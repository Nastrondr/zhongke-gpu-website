/**
 * openclawChatService.js - 萤火虫设备对话服务
 * 
 * 封装与萤火虫设备（OpenClaw智能体）的对话逻辑
 * 
 * 三段式策略：
 * 1. 恢复轮询 - 页面加载时补齐历史事件（queryEvent，1s间隔）
 * 2. 空闲保活 - 定期健康检查（healthCheck，30s间隔），不查事件
 * 3. 活跃轮询 - 发送消息后监听事件流（queryEvent，1s间隔）
 */

// OpenClaw 调试开关
const DEBUG_OPENCLAW = false;

const OpenClawChatService = {
  // 轮询状态
  _pollState: {
    mode: 'idle',           // recovery, idle, active
    interval: 10000,        // 轮询间隔（毫秒）
    isRunning: false,        // 是否正在轮询
    deviceId: null,          // 当前设备ID
    cursorTs: 0,            // 当前游标时间戳
    lastEventTs: 0,         // 最后事件时间戳
    lastActivityTs: 0,      // 最后活动时间戳（用于无活动超时）
    processedEvents: new Set(), // 已处理事件集合
    timerId: null,          // 定时器ID
    callbacks: {},           // 保留兼容
    idleCallbacks: {},       // idle/recovery 轮询的回调（仅用于 onIdle）
    questionTs: 0,          // 当前问题时间戳
    hasFinal: false,        // 是否已收到 final
    finalText: '',          // final 事件中的完整文本
    assistantText: '',       // 当前 assistant 文本
    commandOutputs: [],      // 命令输出列表
    lifecycleStarted: false, // 是否收到 lifecycle start
    lifecycleEnded: false,   // 是否收到 lifecycle end
    activeRunId: '',         // 当前活跃的 runId
    lastQueryTs: 0,         // 上次查询时间戳
    zeroRowsCount: 0,        // 连续0事件计数
    currentTurn: null,       // 当前会话轮次（包含 callbacks）
    recentlyActiveTurn: null, // 保留兼容，不再使用
    recentCallbacks: null    // 保留兼容，不再使用
  },

  // 配置
  config: {
    sessionKey: 'agent:main:main',
    idleInterval: 30000,     // 空闲保活间隔：30秒（healthCheck）
    activeInterval: 1000,    // 活跃轮询间隔：1秒
    recoverySafetyWindow: 5 * 60 * 1000, // 恢复轮询安全窗口：5分钟
    maxRecoveryIterations: 50, // 最大恢复迭代次数
    maxTotalTime: 10 * 60 * 1000, // 最大总时间：10分钟
    maxInactivityTime: 30000, // 最大无活动时间：30秒（无新事件且连续零行才认为完成）
    showCommandOutput: false, // 是否显示命令输出卡片
    // WebSocket 状态缓存配置
    wsCacheTtl: 10000 // 缓存有效期：10秒
  },

  // WebSocket 状态缓存
  _wsStatusCache: {
    statusData: null,
    lastQueryTime: 0,
    isReady: false,
    openclawOk: false,
    healthPayload: null
  },

  // 当前活跃的会话 key（init 时 resolveSessionKey 设置）
  _activeSessionKey: 'agent:main:main',

  // 当前设备
  currentDevice: null,

  // 初始化
  init(device) {
    this.currentDevice = device;
    console.log('[OpenClawChat] init with device:', device?.name);
  },

  // 获取设备ID（数字）
  resolveDeviceId(device) {
    if (!device) return null;
    const rawId = device.id || device.deviceId;
    const numericId = Number(rawId);
    if (!Number.isFinite(numericId)) {
      console.error('[OpenClawChat] resolveDeviceId failed:', { rawId, device });
      return null;
    }
    return numericId;
  },

  // 获取设备UUID
  resolveDeviceUuid(device) {
    if (!device) return null;
    return device.iotDeviceUuid || device.uuid || device.routeDeviceUuid || null;
  },

  // ========== 三段式轮询核心 ==========

  /**
   * 启动轮询系统
   * @param {number} deviceId - 设备ID
   * @param {Object} callbacks - 回调函数
   * @param {Function} callbacks.onRecoveryProgress - 恢复进度回调
   * @param {Function} callbacks.onAssistantUpdate - Assistant 更新回调
   * @param {Function} callbacks.onCommandOutput - 命令输出回调
   * @param {Function} callbacks.onFinal - Final 事件回调
   * @param {Function} callbacks.onLifecycleStart - Lifecycle start 回调
   * @param {Function} callbacks.onLifecycleEnd - Lifecycle end 回调
   * @param {Function} callbacks.onIdle - 进入空闲状态回调
   */
  startPolling(deviceId, callbacks = {}) {
    if (this._pollState.isRunning) {
      console.log('[Poll] already running, restart');
      this.stopPolling();
    }

    console.log('[Poll] ========== 启动轮询系统 ==========');
    console.log('[Poll] deviceId:', deviceId);

    this._pollState = {
      mode: 'recovery',
      interval: 1000, // 恢复阶段使用 1 秒间隔
      isRunning: true,
      deviceId,
      cursorTs: this._getRecoveryTs(),
      lastEventTs: 0,
      lastActivityTs: 0,
      processedEvents: new Set(),
      timerId: null,
      callbacks: {},           // 不再用于渲染
      idleCallbacks: callbacks || {}, // idle/recovery 轮询的回调
      questionTs: 0,
      hasFinal: false,
      finalHandled: false,
      finalText: '',
      assistantText: '',
      commandOutputs: [],
      lifecycleStarted: false,
      lifecycleEnded: false,
      activeRunId: '',
      recoveryCount: 0,
      zeroRowsCount: 0,
      currentTurn: null,        // currentTurn 由 sendMessageAndWait 创建
      recentlyActiveTurn: null, // 不再使用
      recentCallbacks: null,    // 不再使用
      pollVersion: 0,
      _lastWarningTs: 0
    };

    // 开始恢复轮询
    this._doPoll();
  },

  /**
   * 停止轮询系统
   */
  stopPolling() {
    console.log('[Poll] stopPolling');

    if (this._pollState.timerId) {
      clearTimeout(this._pollState.timerId);
    }

    this._pollState.pollVersion = (this._pollState.pollVersion || 0) + 1;
    this._pollState.isRunning = false;
    this._pollState.timerId = null;
    this._pollState.mode = 'idle';
    this._pollState.callbacks = {};
    this._pollState.currentTurn = null;
    this._pollState.recentlyActiveTurn = null;
    this._pollState.recentCallbacks = null;
    this._pollState.zeroRowsCount = 0;
    this._pollState._lastWarningTs = 0;

    console.log('[Poll] stopped, pollVersion:', this._pollState.pollVersion);
  },

  /**
   * 发送消息后切换到活跃轮询
   * @param {string} deviceId - 设备ID
   * @param {string} message - 发送的消息
   * @param {number} questionTs - 问题时间戳（在发送前生成）
   * @param {object} [callbacks] - 可选的回调函数，会立即设置
   */
  startActivePolling(deviceId, message, questionTs, callbacks = null) {
    if (!this._pollState.isRunning) {
      console.warn('[Poll] not running, bootstrap polling before active mode');

      this._pollState.isRunning = true;
      this._pollState.deviceId = deviceId;
      this._pollState.timerId = null;
      this._pollState.pollVersion = (this._pollState.pollVersion || 0) + 1;
    }

    if (!this._pollState.deviceId) {
      this._pollState.deviceId = deviceId;
    }

    // 清除旧的轮询 timer，避免并发
    if (this._pollState.timerId) {
      console.log('[Poll] clearing old timer before switching to active');
      clearTimeout(this._pollState.timerId);
      this._pollState.timerId = null;
    }

    console.log('[Poll] ========== 切换到活跃轮询 ==========');
    console.log('[Poll] message:', message, 'questionTs:', questionTs);

    this._pollState.mode = 'active';
    this._pollState.interval = this.config.activeInterval; // 1秒
    this._pollState.questionTs = questionTs || Date.now();
    // 首次查询扩大窗口，避免时间不一致导致事件被过滤
    const firstQueryTs = this._pollState.questionTs - 60 * 1000; // 提前1分钟
    console.log('[Poll] firstQueryTs (expanded window):', firstQueryTs, '(提前60秒)');
    this._pollState.cursorTs = firstQueryTs;
    this._pollState.hasFinal = false;
    this._pollState.finalText = '';
    this._pollState.assistantText = '';
    this._pollState.commandOutputs = [];
    this._pollState.lifecycleStarted = false;
    this._pollState.lifecycleEnded = false;
    this._pollState.activeRunId = '';
    // 不清空 callbacks，而是接受新的 callbacks
    if (callbacks) {
      this._pollState.callbacks = callbacks;
    }
    this._pollState.lastActivityTs = Date.now(); // 记录活动开始时间
    this._pollState.zeroRowsCount = 0; // 连续0事件计数
    // 不清空 processedEvents，而是依赖 questionTs 过滤

    // 立即触发一次轮询（不要等待定时器）
    this._doPoll();
  },

  /**
   * 切换到空闲轮询
   */
  switchToIdlePolling() {
    if (!this._pollState.isRunning) return;

    console.log('[Poll] ========== 切换到空闲保活 ==========');

    // 不再保存 recentlyActiveTurn - currentTurn 必须由 completeActiveTurn 清理
    // 也不在这里调用 onIdle，让 completeActiveTurn 处理

    this._pollState.mode = 'idle';
    this._pollState.interval = this.config.idleInterval; // 30秒 healthCheck
    this._pollState.questionTs = 0;
    // 注意：不清空 hasFinal，让 completeActiveTurn 处理
    // 清空 processedEvents 释放内存（空闲模式不需要保留 active 模式的事件）
    this._pollState.processedEvents = new Set();
    // 重置辅助状态
    this._pollState.recoveryCount = 0;
    // 注意：不清空 currentTurn，只清空辅助状态
    this._pollState.assistantText = '';
    this._pollState.commandOutputs = [];
    this._pollState.lifecycleStarted = false;
    this._pollState.lifecycleEnded = false;
    this._pollState.activeRunId = '';
    this._pollState.zeroRowsCount = 0;
    
    // 调用 idle 回调（使用 idleCallbacks）
    this._pollState.idleCallbacks?.onIdle?.();
  },

  // ========== 内部轮询逻辑 ==========

  /**
   * 获取恢复轮询的起始时间戳
   */
  _getRecoveryTs() {
    // 优先使用本地存储的最后事件时间
    const lastTs = localStorage.getItem('openclaw_last_event_ts');
    if (lastTs && Number(lastTs) > 0) {
      console.log('[Poll] using lastEventTs from storage:', lastTs);
      return Number(lastTs);
    }

    // 否则使用安全窗口（当前时间 - 5分钟）
    const safetyTs = Date.now() - this.config.recoverySafetyWindow;
    console.log('[Poll] using safety window ts:', safetyTs);
    return safetyTs;
  },

  /**
   * 执行一次轮询
   */
  async _doPoll() {
    if (!this._pollState.isRunning) return;

    const state = this._pollState;
    const pollVersion = state.pollVersion || 0;
    const startTime = Date.now();

    try {
      // === idle 模式：只做健康检查，不查事件 ===
      if (state.mode === 'idle') {
        console.log('[Poll] idle health check...');
        await this._checkOpenClawHealth(state.deviceId);
        this._scheduleNextPoll();
        return;
      }

      // === recovery / active 模式：查询事件 ===
      let queryTs = state.cursorTs;
      let queryLimit = 50;

      // active 模式：使用 minAcceptedTs 和 cursorTs
      if (state.mode === 'active' && state.currentTurn) {
        const turn = state.currentTurn;

        const minAcceptedTs = (turn.minAcceptedTs != null) 
          ? turn.minAcceptedTs 
          : (turn.questionTs - 60000);

        // active 模式：第一次从 minAcceptedTs 查，后续必须从 cursorTs 继续查，避免重复拉旧事件
        const cursorTs = state.cursorTs || 0;
        queryTs = Math.max(minAcceptedTs, cursorTs);

        console.log('[Poll] final query args before queryEvents', {
          mode: state.mode,
          queryTs,
          minAcceptedTs,
          cursorTs: state.cursorTs,
          questionTs: turn.questionTs,
          currentTurn: {
            turnId: turn.turnId,
            questionTs: turn.questionTs,
            minAcceptedTs: turn.minAcceptedTs,
            assistantMessageId: turn.assistantMessageId
          }
        });
        
        // 超时策略：只有超过 60 秒且没有收到任何回复时才结束
        const elapsed = Date.now() - turn.questionTs;
        if (elapsed > 60000 && !state.hasFinal && !state.assistantText) {
          // 超时：结束当前 turn
          console.warn('[Poll] active timeout, elapsed:', elapsed, 'zeroRowsCount:', state.zeroRowsCount);
          this.completeActiveTurn('timeout');
          return;
        } else if (elapsed < 60000) {
          console.log('[Turn] active mode kept waiting', { elapsed: Math.round(elapsed/1000) + 's' });
        }
        
        // 等待提示（超过 10 秒无事件，且未完成）
        if (state.zeroRowsCount > 10 && 
            !state.hasFinal && 
            !state.finalHandled && 
            !state.assistantText && 
            !state.currentTurn?.completed &&
            state.mode === 'active') {
          // 只在 currentTurn 存在时触发 warning
          if (state.currentTurn) {
            // 5 秒内只允许触发一次 warning
            const now = Date.now();
            if (!state._lastWarningTs || now - state._lastWarningTs > 5000) {
              console.log('[UI] warning: 消息已发送，正在等待设备返回...');
              const cb = state.currentTurn?.callbacks || state.callbacks || {};
              cb.onWarning?.('消息已发送，正在等待设备返回...');
              state._lastWarningTs = now;
            }
          }
        }
      }

      // recovery 模式：使用安全窗口
      if (state.mode === 'recovery') {
        queryTs = this._getRecoveryTs();
      }

      // active 模式：始终使用 currentTurn.minAcceptedTs 查询，不允许 queryTs=0
      // 禁用 fallback 查询！所有 rows 必须进入 _processEvents

      console.log('[Poll] ========== query start ==========');
      console.log('[Poll] mode:', state.mode);
      console.log('[Poll] queryTs:', queryTs);
      console.log('[Poll] cursorTs:', state.cursorTs);
      if (state.currentTurn) {
        console.log('[Poll] currentTurn.minAcceptedTs:', state.currentTurn.minAcceptedTs);
        console.log('[Poll] currentTurn.questionTs:', state.currentTurn.questionTs);
        console.log('[Poll] currentTurn.assistantMessageId:', state.currentTurn.assistantMessageId);
      }
      console.log('[Poll] zeroRowsCount:', state.zeroRowsCount);

      const response = await this.queryEvents(state.deviceId, queryTs, queryLimit);
      if (!this._pollState.isRunning || this._pollState.pollVersion !== pollVersion) {
        console.log('[Poll] stale poll result ignored', {
          oldVersion: pollVersion,
          currentVersion: this._pollState.pollVersion
        });
        return;
      }
      
      // 解析响应结构
      const body = response?.data?.data;
      const rows = body?.rows || [];
      const serverTsStart = body?.ts_start;
      const msgCacheSize = body?.msgCacheSize;
      const sysMsgCacheSize = body?.sysMsgCacheSize;

      console.log('[Poll] incoming rows count:', rows.length);
      
      // 打印每行数据
      rows.forEach((row, idx) => {
        const payload = row.payload || row;
        const rowTs = this._getRowTs(row);
        console.log(`[Poll] row[${idx}]`, {
          seq: row.seq,
          event: row.event,
          stream: payload.stream,
          state: payload.state,
          runId: payload.runId,
          ts: rowTs,
          content: payload.data?.text || payload.data?.delta || payload.message?.content?.[0]?.text || ''
        });
      });

      // 更新 WebSocket 状态缓存
      if (msgCacheSize !== undefined || sysMsgCacheSize !== undefined) {
        this._updateWsStatusCache(body);
      }

      // 如果连续0条事件，记录计数
      if (rows.length === 0 && state.mode === 'active') {
        state.zeroRowsCount++;
        console.log('[Poll] zeroRowsCount:', state.zeroRowsCount);
      } else if (rows.length > 0 && state.mode === 'active') {
        state.zeroRowsCount = 0; // 有事件就重置计数
      }

      // 处理事件 - 所有 rows 必须进入 _processEvents！
      const hasNewEvents = this._processEvents(rows);

      // 推进游标
      if (rows.length > 0) {
        const maxRowTs = Math.max(
          ...rows.map(row => this._getRowTs(row) || 0),
          0
        );

        const nextCursorTs = Math.max(
          state.cursorTs || 0,
          serverTsStart || 0,
          state.lastEventTs || 0,
          maxRowTs || 0
        );

        if (nextCursorTs > (state.cursorTs || 0)) {
          state.cursorTs = nextCursorTs;
          console.log('[Poll] cursor advanced:', state.cursorTs);
        }
        
        // 保存最后事件时间戳
        if (state.lastEventTs > 0) {
          localStorage.setItem('openclaw_last_event_ts', state.lastEventTs);
        }
      }

      console.log('[Poll] hasNewEvents:', hasNewEvents);
      console.log('[Poll] rows processed:', rows.length);

      // 检查恢复是否完成
      if (state.mode === 'recovery') {
        state.recoveryCount++;

        if (rows.length === 0 || (!hasNewEvents && state.recoveryCount > 1)) {
          console.log('[Poll] recovery complete, switching to idle polling');
          this.switchToIdlePolling();
        } else if (state.recoveryCount >= this.config.maxRecoveryIterations) {
          console.log('[Poll] recovery max iterations reached, switching to idle polling');
          this.switchToIdlePolling();
        }
      }

      // 检查是否收到 final
      if (state.hasFinal && state.mode === 'active') {
        console.log('[Poll] final received, switching to idle polling');
        this.switchToIdlePolling();
      }

    } catch (error) {
      console.error('[Poll] error:', error);
      // 出错时不改变状态，继续轮询
    }

    // 安排下一次轮询
    this._scheduleNextPoll();
  },

  /**
   * 安排下一次轮询
   */
  _scheduleNextPoll() {
    const state = this._pollState;
    if (!state.isRunning) {
      console.log('[Poll] polling stopped');
      return;
    }

    const waitTime = state.interval || 1000;
    console.log('[Poll] scheduling next poll in', waitTime, 'ms');

    if (state.timerId) {
      clearTimeout(state.timerId);
    }
    state.timerId = setTimeout(() => this._doPoll(), waitTime);
  },

  /**
   * 处理事件列表
   * @returns {boolean} 是否有新的有效事件
   */
  _processEvents(rows) {
    const state = this._pollState;
    let hasNewEvents = false;

    // 打印精简表
    console.log('[Poll] rows summary:', rows.map(row => {
      const payload = row.payload || row;
      const rowTs = this._getRowTs(row);
      return {
        seq: row.seq,
        event: row.event,
        stream: payload.stream,
        state: payload.state,
        phase: payload.data?.phase,
        runId: payload.runId,
        payloadSeq: payload.seq,
        ts: rowTs,
        messageTimestamp: payload.message?.timestamp,
        sessionKey: payload.sessionKey,
        textPreview: this._extractAssistantText(row).slice(0, 40) || 
                     String(payload.data?.text || payload.data?.delta || '').slice(0, 40)
      };
    }));

    for (const row of rows) {
      const eventKey = this._getEventKey(row);
      const payload = row.payload || row;
      const rowTs = this._getRowTs(row);
      const eventType = this._parseEventType(row, payload);

      // 判断是否是 chat assistant 事件（最高优先级）
      const isChatFinal = 
        row.event === 'chat' && 
        payload.state === 'final' && 
        payload.message?.role === 'assistant';
      
      const isChatDelta = 
        row.event === 'chat' && 
        payload.state === 'delta' && 
        payload.message?.role === 'assistant';
      
      const isChatAssistantEvent = isChatFinal || isChatDelta;

      // 判断是否是 assistant 文本事件
      const isAssistantTextEvent = 
        payload.stream === 'assistant' ||
        eventType === 'chat_delta' ||
        eventType === 'chat_final' ||
        isChatAssistantEvent;

      // 判断是否是工具事件（需要额外过滤）
      const isToolEvent = 
        payload.stream === 'command_output' ||
        payload.stream === 'tool' ||
        payload.stream === 'item' ||
        eventType === 'command_output' ||
        eventType === 'tool';

      // 打印进入过滤器时的信息
      if (DEBUG_OPENCLAW) {
        console.log('[EventFilter] incoming', {
          event: row.event,
          stream: payload.stream,
          state: payload.state,
          phase: payload.data?.phase,
          runId: payload.runId,
          seq: row.seq,
          ts: rowTs,
          sessionKey: payload.sessionKey,
          mode: state.mode,
          eventType: eventType,
          isChatFinal,
          isChatDelta,
          isAssistantTextEvent
        });
      }

      // idle/recovery 模式：只要 currentTurn 存在，chat final/delta 就允许处理
      let turnForEvent = state.currentTurn;
      if (state.mode !== 'active' && isAssistantTextEvent) {
        const activeTurn = state.currentTurn;
        
        // 判断是否属于当前轮次
        const belongsToCurrentTurn = 
          activeTurn && 
          (isChatFinal || isChatDelta || payload.stream === 'assistant') &&
          (!payload.sessionKey || payload.sessionKey === activeTurn.sessionKey) && 
          rowTs >= activeTurn.minAcceptedTs && 
          Date.now() - activeTurn.questionTs <= 120000;

        if (!belongsToCurrentTurn) {
          console.log('[EventFilter] drop assistant event - not current turn', {
            mode: state.mode,
            rowTs,
            minAcceptedTs: activeTurn?.minAcceptedTs,
            questionTs: activeTurn?.questionTs,
            sessionKey: payload.sessionKey,
            expectedSessionKey: activeTurn?.sessionKey,
            isChatFinal,
            isChatDelta,
            stream: payload.stream,
            hasCurrentTurn: !!activeTurn
          });
          continue;
        }

        turnForEvent = activeTurn;
        console.log('[EventFilter] accepted - belongs to current turn', {
          turnId: activeTurn.turnId,
          isChatFinal,
          isChatDelta
        });
      }

      // active 模式下基于 currentTurn 过滤
      if (state.mode === 'active' && state.currentTurn) {
        const turn = state.currentTurn;

        // chat final 候选事件日志
        if (isChatFinal) {
          console.log('[EventFilter] chat final candidate', {
            rowTs,
            minAcceptedTs: turn.minAcceptedTs,
            sessionKey: payload.sessionKey,
            currentSessionKey: turn.sessionKey,
            runId: payload.runId
          });
        }

        // sessionKey 检查
        if (payload.sessionKey && payload.sessionKey !== turn.sessionKey) {
          console.log('[EventFilter] drop - sessionKey mismatch', {
            expected: turn.sessionKey,
            got: payload.sessionKey,
            isChatFinal
          });
          continue;
        }

        // 时间戳检查
        if (rowTs < turn.minAcceptedTs) {
          console.log('[EventFilter] drop - timestamp too old', {
            ts: rowTs,
            minAcceptedTs: turn.minAcceptedTs,
            runId: payload.runId,
            isChatFinal
          });
          continue;
        }

        // 已处理事件检查
        if (eventKey && turn.processedEventKeys.has(eventKey)) {
          if (DEBUG_OPENCLAW) {
            console.log('[EventFilter] drop - duplicate eventKey', { eventKey });
          }
          continue;
        }

        // 工具事件（command_output/tool/item）需要额外检查 runId 是否属于当前会话
        if (isToolEvent && payload.runId) {
          const acceptedRunIds = turn.acceptedRunIds || new Set();
          if (!acceptedRunIds.has(payload.runId)) {
            console.log('[EventFilter] drop - tool event runId not accepted', {
              runId: payload.runId,
              acceptedRunIds: Array.from(acceptedRunIds),
              stream: payload.stream,
              eventType: eventType
            });
            continue;
          }
        }

        // assistant/chat 事件需要检查 runId
        if (isAssistantTextEvent && payload.runId) {
          const acceptedRunIds = turn.acceptedRunIds || new Set();
          
          if (acceptedRunIds.size > 0) {
            // 如果已有 acceptedRunIds，必须匹配
            if (!acceptedRunIds.has(payload.runId)) {
              console.log('[EventFilter] drop - assistant event runId not accepted', {
                runId: payload.runId,
                acceptedRunIds: Array.from(acceptedRunIds),
                isChatFinal,
                isChatDelta
              });
              continue;
            }
          } else if (!turn.awaitingRunId) {
            // 只有在不是等待 runId 状态时，才接收第一个符合条件的 assistant/chat 事件并绑定 runId
            // 如果 awaitingRunId 为 true，说明 sendChat 还未返回，此时不绑定任何 runId
            turn.acceptedRunIds.add(payload.runId);
            console.log('[EventFilter] bound first assistant event runId:', {
              runId: payload.runId,
              turnId: turn.turnId,
              acceptedRunIds: Array.from(turn.acceptedRunIds),
              awaitingRunId: turn.awaitingRunId
            });
          } else {
            // awaitingRunId 为 true，sendChat 还未返回，丢弃没有匹配 runId 的事件
            console.log('[EventFilter] drop - awaiting sendChat runId, discarding unbound event', {
              runId: payload.runId,
              turnId: turn.turnId,
              awaitingRunId: turn.awaitingRunId,
              isChatFinal,
              isChatDelta
            });
            continue;
          }
        }

        // chat final 通过过滤
        if (isChatFinal) {
          console.log('[EventFilter] chat final accepted to handleEvent');
        }
      } else if (state.mode === 'active' && !state.currentTurn) {
        console.log('[EventFilter] drop - no currentTurn in active mode');
        continue;
      }

      // 更新最后事件时间戳
      if (rowTs > state.lastEventTs) {
        state.lastEventTs = rowTs;
      }

      // 更新最后活动时间戳（收到新事件时）
      state.lastActivityTs = Date.now();

      // 标记为已处理
      if (state.mode === 'active' && state.currentTurn && eventKey) {
        state.currentTurn.processedEventKeys.add(eventKey);
      } else if (eventKey) {
        state.processedEvents.add(eventKey);
      }

      // 忽略请求回显
      if (this._isReqEcho(row, payload)) {
        continue;
      }

      hasNewEvents = true;

      console.log('[Event]', eventType, {
        stream: payload.stream,
        state: payload.state,
        phase: payload.data?.phase,
        runId: payload.runId
      });

      // 处理不同类型的事件
      this._handleEvent(eventType, row, payload, eventKey, turnForEvent);
    }

    return hasNewEvents;
  },

  /**
   * 获取适合当前事件的 callbacks
   */
  _getCallbacksForEvent(turnOverride = null) {
    const state = this._pollState;

    // 优先级 1: turnOverride 自身有 callbacks
    if (turnOverride?.callbacks && Object.keys(turnOverride.callbacks).length > 0) {
      return turnOverride.callbacks;
    }

    // 优先级 2: state.currentTurn 有 callbacks
    if (state.currentTurn?.callbacks && Object.keys(state.currentTurn.callbacks).length > 0) {
      return state.currentTurn.callbacks;
    }

    // 优先级 3: state.callbacks（兼容旧逻辑）
    if (state.callbacks && Object.keys(state.callbacks).length > 0) {
      return state.callbacks;
    }

    return {};
  },

  /**
   * 处理单个事件
   */
  _handleEvent(eventType, row, payload, eventKey, turnOverride = null) {
    const state = this._pollState;
    const callbacks = this._getCallbacksForEvent(turnOverride);
    const turn = turnOverride || state.currentTurn;

    // 构建 meta 信息
    const meta = {
      assistantMessageId: turn?.assistantMessageId,
      turnId: turn?.turnId,
      runId: payload.runId
    };

    switch (eventType) {
      case 'lifecycle_start':
        state.lifecycleStarted = true;
        console.log('[Lifecycle] start, runId:', payload.runId);
        
        // 记录 runId 到当前轮次的 acceptedRunIds，允许后续工具事件通过过滤
        if (turn && payload.runId) {
          if (!turn.acceptedRunIds) {
            turn.acceptedRunIds = new Set();
          }
          turn.acceptedRunIds.add(payload.runId);
          console.log('[Lifecycle] registered runId:', payload.runId);
        }
        
        callbacks.onLifecycleStart?.(payload.runId, payload.data, meta);
        break;

      case 'lifecycle_end':
        state.lifecycleEnded = true;
        console.log('[Lifecycle] end');
        callbacks.onLifecycleEnd?.(payload.data, meta);
        break;

      case 'assistant':
      case 'chat_delta':
        const text = this._extractAssistantText(row) || 
                     (eventType === 'assistant' ? (payload.data?.text || payload.data?.delta || '') : '') ||
                     this._extractChatContent(payload);
        if (text) {
          state.assistantText = text;
          const logPrefix = eventType === 'assistant' ? '[Assistant] update' : '[Assistant] chat delta';
          console.log(logPrefix, 'len:', text.length);
          
          // 打印 UI 更新信息
          console.log('[UIBridge] assistant update', {
            assistantMessageId: meta.assistantMessageId,
            turnId: meta.turnId,
            runId: meta.runId,
            textLength: text.length,
            mode: state.mode
          });
          
          // 安全调用回调
          if (state.mode === 'active' || callbacks.onAssistantUpdate) {
            callbacks.onAssistantUpdate?.(text, meta);
          } else {
            console.log('[UIBridge] skip - idle mode without onAssistantUpdate callback');
          }
        }
        break;

      case 'command_output':
        const outputText = payload.data?.output || payload.data?.text || '';
        if (outputText) {
          const outputInfo = {
            text: outputText,
            isEnd: payload.data?.phase === 'end',
            index: state.commandOutputs.length
          };
          state.commandOutputs.push(outputInfo);
          console.log('[CommandOutput]', outputInfo.isEnd ? 'end' : 'delta', 'len:', outputText.length);
          if (this.config?.showCommandOutput === true) {
            callbacks.onCommandOutput?.(outputText, outputInfo, meta);
          } else if (DEBUG_OPENCLAW) {
            console.log('[CommandOutput] skipped UI render, len:', outputText.length);
          }
        }
        break;

      case 'chat_final':
        const finalText = this._extractAssistantText(row) || this._extractChatContent(payload);
        console.log('[Event] chat final accepted', {
          runId: payload.runId,
          text: finalText?.slice(0, 50),
          assistantMessageId: turn?.assistantMessageId,
          turnId: turn?.turnId,
          mode: state.mode,
          hasFinalBefore: state.hasFinal
        });

        if (finalText && !state.hasFinal) {
          state.hasFinal = true;
          state.finalHandled = true;
          state.finalText = finalText;
          state.assistantText = finalText;
          console.log('[Final] received, len:', finalText.length);
          
          // 打印 UI 更新信息
          console.log('[UIBridge] final update', {
            assistantMessageId: meta.assistantMessageId,
            textLength: finalText.length
          });
          
          // 先执行回调渲染 UI
          callbacks.onFinal?.(finalText, {
            assistantText: state.assistantText,
            commandOutputs: state.commandOutputs,
            ...meta,
            final: true,
            state: 'final'
          });
          
          // 标记 turn 完成
          if (turn) {
            turn.completed = true;
          }
          
          // 最后清理状态
          this.completeActiveTurn?.('final');
        } else if (state.hasFinal) {
          console.log('[Final] already received, skipping duplicate');
        }
        break;
    }
  },

  /**
   * 统一清理活跃会话状态
   */
  completeActiveTurn(reason) {
    const state = this._pollState;
    console.log('[Turn] completeActiveTurn', { reason });
    
    // 不再保存 recentlyActiveTurn - 渲染完全依赖 currentTurn.callbacks
    
    // 只在非 final 时清空 final 相关标记
    if (reason !== 'final') {
      state.hasFinal = false;
      state.finalText = '';
    }
    
    // 设置 finalHandled 标记
    state.finalHandled = reason === 'final' || state.hasFinal;
    
    // 切换到 idle
    state.mode = 'idle';
    state.interval = this.config.idleInterval;
    state.questionTs = 0;
    state.activeRunId = '';
    state.callbacks = {};
    state.currentTurn = null;
    state.assistantText = '';
    state.commandOutputs = [];
    state.zeroRowsCount = 0;
    state.lifecycleStarted = false;
    state.lifecycleEnded = false;
  },

  // ========== 辅助函数 ==========

  /**
   * 从 sendChat 响应中提取 runId
   */
  _extractRunIdFromSendResponse(response) {
    const candidates = [
      response?.runId,
      response?.payload?.runId,
      response?.data?.runId,
      response?.data?.payload?.runId,
      response?.data?.data?.runId,
      response?.data?.data?.payload?.runId,
      response?.data?.data?.rows?.[0]?.payload?.runId,
      response?.data?.data?.data?.runId,
      response?.data?.data?.data?.payload?.runId,
      response?.data?.data?.data?.rows?.[0]?.payload?.runId,
      response?.data?.data?.reqResMsgCache?.[0]?.payload?.runId,
      response?.data?.data?.data?.reqResMsgCache?.[0]?.payload?.runId,
      response?.data?.rows?.[0]?.payload?.runId,
      response?.data?.data?.rows?.find?.(function(r) { return r?.payload?.runId; })?.payload?.runId,
      response?.data?.data?.data?.rows?.find?.(function(r) { return r?.payload?.runId; })?.payload?.runId
    ];

    const runId = candidates.find(Boolean);
    return runId || '';
  },

  /**
   * 从 queryRunInfo 响应中提取最近一次启动的 runId
   */
  _extractLatestStartedRunIdFromRunInfo(runInfoResponse) {
    const data =
      runInfoResponse?.data?.data?.data ||
      runInfoResponse?.data?.data ||
      runInfoResponse?.data ||
      runInfoResponse;

    const list = data?.reqResMsgCache || [];
    const item = list.find(x => x?.type === 'res' && x?.ok === true && x?.payload?.runId);
    return item?.payload?.runId || '';
  },

  /**
   * 获取服务器返回的 ts_start
   */
  _getServerTsStart(response) {
    const ts = response?.data?.data?.ts_start || response?.data?.ts_start;
    const num = Number(ts);
    return Number.isFinite(num) && num > 0 ? num : null;
  },

  /**
   * 获取事件的唯一 key（用于去重）
   */
  _getEventKey(row) {
    const payload = row.payload || row;
    return [
      row.seq || '',
      row.event || '',
      row.type || '',
      payload.id || '',
      payload.method || '',
      payload.runId || '',
      payload.seq || '',
      payload.stream || '',
      payload.state || '',
      payload.data?.phase || '',
      payload.ts || row.ts || ''
    ].join('_');
  },

  /**
   * 获取事件的 timestamp
   */
  _getRowTs(row) {
    const payload = row?.payload || row || {};
    return Number(
      payload.ts ||
      payload.message?.timestamp ||
      row?.ts ||
      row?.timestamp ||
      0
    ) || 0;
  },

  /**
   * 检查是否为请求回显
   */
  _isReqEcho(row, payload) {
    return row.type === 'req' ||
           row.method === 'chat.send' ||
           payload.type === 'req' ||
           payload.method === 'chat.send';
  },

  /**
   * 提取 Assistant 文本内容
   */
  _extractAssistantText(row) {
    const payload = row?.payload || row || {};

    // chat event: payload.message.content[]
    if (payload.message?.role === 'assistant') {
      const content = payload.message.content;
      if (Array.isArray(content)) {
        return content
          .map(item => {
            if (typeof item === 'string') return item;
            if (item?.type === 'text') return item.text || '';
            return item?.text || '';
          })
          .filter(Boolean)
          .join('');
      }
      if (typeof payload.message.content === 'string') {
        return payload.message.content;
      }
    }

    // agent assistant stream
    if (payload.stream === 'assistant') {
      return payload.data?.text || payload.data?.delta || '';
    }

    return '';
  },

  /**
   * 解析事件类型
   */
  _parseEventType(row, payload) {
    // lifecycle
    if (payload.stream === 'lifecycle') {
      return payload.data?.phase === 'start' ? 'lifecycle_start' : 'lifecycle_end';
    }

    // assistant stream
    if (payload.stream === 'assistant') {
      return 'assistant';
    }

    // command output
    if (payload.stream === 'command_output') {
      return 'command_output';
    }

    // chat events
    if (row.event === 'chat' || row.method === 'chat.send') {
      if (payload.state === 'final') {
        return 'chat_final';
      }
      if (payload.state === 'delta') {
        return 'chat_delta';
      }
    }

    // tool/item
    if (payload.stream === 'tool' || payload.stream === 'item') {
      return 'tool';
    }

    return 'unknown';
  },

  /**
   * 提取 chat 消息内容
   */
  _extractChatContent(payload) {
    if (!payload?.message?.content) return '';

    const content = payload.message.content;
    if (Array.isArray(content)) {
      return content.map(item => item?.text || '').filter(Boolean).join('');
    }
    if (typeof content === 'string') {
      return content;
    }
    return '';
  },

  // ========== API 方法 ==========

  /**
   * 查询 OpenClaw 状态（兼容 device-chat.html 的 checkOpenclawStatus）
   */
  async queryOpenClawStatus(device) {
    const deviceId = typeof device === 'number'
      ? device
      : this.resolveDeviceId(device);

    if (!deviceId || !Number.isFinite(deviceId)) {
      return {
        success: false,
        wasLive: false,
        wsAlive: false,
        error: 'no_deviceid',
        raw: null
      };
    }

    try {
      // 先尝试调用 queryRunInfo (RPC 方式)
      let response = null;
      let data = {};
      let isLive = false;

      try {
        response = await window.Api.OPENCLAW.queryRunInfo(deviceId);
        console.log('[OpenClawChat1111] queryRunInfo response:', response);
        // 正确路径: response.data.data
        data = response?.data?.data || {};
        console.log('[OpenClawChat] queryRunInfo data:', data);
      } catch (e) {
        console.warn('[OpenClawChat] queryRunInfo failed:', e);
      }

      // 从 queryRunInfo 结果中提取状态（后端只返回 wsAvlie 字段）
      const wsAvlie = data.wsAvlie === true;
      isLive = wsAvlie;
      return {
        success: response?.success !== false,
        wasLive: isLive,
        wsAlive: isLive,
        raw: response,
        wsAvlie
      };
    } catch (error) {
      console.warn('[OpenClawChat] queryOpenClawStatus failed:', error);
      return {
        success: false,
        wasLive: false,
        wsAlive: false,
        error: error.message || 'queryOpenClawStatus failed',
        raw: null
      };
    }
  },

  /**
   * 查询事件
   */
  async queryEvents(deviceId, tsStart, limit = 50) {
    if (!deviceId) throw new Error('deviceId is required');
    console.log('[OpenClawChat] queryEvents:', { deviceId, tsStart, limit });
    return await window.Api.OPENCLAW.queryEvent(deviceId, tsStart, limit);
  },

  /**
   * 加载会话历史消息
   * session key 优先用传入值，其次从 healthPayload 取最近活跃会话，最后回退到 config.sessionKey
   * @returns {Array<{role: string, text: string, timestamp: number}>}
   */
  async loadSessionHistory(deviceId, sessionKey = '') {
    try {
      const key = sessionKey
        || this._activeSessionKey;

      console.log('[OpenClawChat] loadSessionHistory:', { deviceId, sessionKey: key });
      console.time('[Perf] loadSessionHistory duration');
      const resp = await window.Api.OPENCLAW.sessionGetHistory(deviceId, key);
      console.timeEnd('[Perf] loadSessionHistory duration');

      const messages = resp?.data?.data?.payload?.messages || [];

      return messages.map(msg => ({
        role: msg.role,
        text: msg.content?.find(c => c.type === 'text')?.text || '',
        timestamp: msg.timestamp
      }));
    } catch (error) {
      console.error('[OpenClawChat] loadSessionHistory failed:', error);
      return [];
    }
  },

  /**
   * 获取当前活跃的 session key
   */
  getActiveSessionKey() {
    return this._activeSessionKey;
  },

  /**
   * 解析并设置当前用户的 session key
   * 规则: agent:main:mobile-{手机号后6位}
   * 1. 查 sessionList 看是否已有匹配的 key
   * 2. 没有则创建新 session
   * 结果写入 this._activeSessionKey
   * @returns {Promise<string>} 解析后的 session key
   */
  async resolveSessionKey(deviceId) {
    try {
      // 直接读 Storage.Auth，不依赖 UserService（device-chat.html 未加载 userService.js）
      const storedUser = window.Storage?.Auth?.getCurrentUser();
      const phone = storedUser?.mobile || storedUser?.phone || '';
      const phoneLast6 = phone.slice(-6) || '000000';
      const targetKey = 'agent:main:mobile-' + phoneLast6;

      console.log('[Session] target key:', targetKey, 'phone:', phone, 'phoneLast6:', phoneLast6);

      // 查询 session 列表
      const resp = await window.Api.OPENCLAW.sessionList(deviceId);
      const sessions = resp?.data?.data?.payload?.sessions || [];

      const matched = sessions.find(s => s.key === targetKey);

      if (matched) {
        console.log('[Session] found existing:', matched.key, 'status:', matched.status);
        this._activeSessionKey = matched.key;
        return matched.key;
      }

      // 不存在则创建
      console.log('[Session] not found, creating:', targetKey);
      await window.Api.OPENCLAW.sessionCreate(deviceId, targetKey);
      this._activeSessionKey = targetKey;
      console.log('[Session] created and set:', targetKey);
      return targetKey;
    } catch (error) {
      console.error('[Session] resolveSessionKey failed:', error);
      // 回退到默认 key，保证不阻塞初始化
      this._activeSessionKey = 'agent:main:mobile-' + Date.now();
      return this._activeSessionKey;
    }
  },

  /**
   * 发送聊天消息
   */
  async sendChatMessage(deviceId, message, sessionKey = 'agent:main:main', attachments = []) {
    if (!deviceId) throw new Error('deviceId is required');
    if (!message) throw new Error('message is required');
    console.log('[OpenClawChat] sendChatMessage:', { deviceId, message, sessionKey, attachments: attachments.length });
    return await window.Api.OPENCLAW.sendChat(deviceId, message, sessionKey, attachments);
  },

  /**
   * 发送消息并等待回复（新接口，使用活跃轮询）
   * @param {Object} device - 设备对象
   * @param {string} message - 消息内容
   * @param {Object} callbacks - 回调函数
   * @param {Array} images - 图片数据数组（base64）
   * @param {Object} options - 选项参数（包含 turnId、assistantMessageId）
   */
  async sendMessageAndWait(device, message, callbacks = {}, attachments = [], options = {}) {
    const deviceId = this.resolveDeviceId(device);
    console.time('[Perf] total send flow duration');

    if (!deviceId || !Number.isFinite(deviceId)) {
      console.error('[OpenClawChat] sendMessage failed:', device);
      return { success: false, error: 'no_deviceid', msg: '当前设备缺少数字id' };
    }

    this.currentDevice = device;

    console.log('[Turn] ========== 发送消息 ==========');
    console.log('[Turn] message:', message);
    console.log('[Turn] deviceId:', deviceId);
    console.log('[Turn] options:', options);

    try {
      const userMessage = String(message || '').trim();

      // 发送前检查 WebSocket 状态
      console.log('[Perf] before ensureWebSocketReady');
      console.time('[Perf] ensureWebSocketReady total');
      await this._ensureWebSocketReady(deviceId);
      console.timeEnd('[Perf] ensureWebSocketReady total');

      // 在发送消息之前生成 questionTs，确保能捕获后端快速返回的事件
      const questionTs = Date.now();
      console.log('[Turn] questionTs:', questionTs);

      // 创建 currentTurn（包含 callbacks，用于渲染 UI）
      const currentTurn = {
        turnId: options.turnId || 'turn_' + questionTs,
        assistantMessageId: options.assistantMessageId || null,
        sessionKey: this._activeSessionKey,
        questionTs: questionTs,
        minAcceptedTs: questionTs,  // 根据后端建议：直接使用 questionTs，不从更早时间查询，避免读取历史内容
        requestId: this._generateUUID(),
        idempotencyKey: this._generateUUID(),
        acceptedRunIds: new Set(),
        processedEventKeys: new Set(),
        callbacks: callbacks || {},  // UI 渲染回调绑定在 currentTurn 上
        completed: false,
        awaitingRunId: true  // 等待 sendChat 返回 runId，期间不绑定历史事件
      };
      this._pollState.currentTurn = currentTurn;
      console.log('[Turn] currentTurn created:', {
        turnId: currentTurn.turnId,
        assistantMessageId: currentTurn.assistantMessageId,
        questionTs: currentTurn.questionTs,
        hasCallbacks: Object.keys(currentTurn.callbacks).length > 0
      });

      // 先切换到活跃轮询
      this.startActivePolling(deviceId, userMessage, questionTs, callbacks);

      // 再发送消息（包含图片）
      console.log('[Perf] before sendChat API');
      console.time('[Perf] sendChat API duration');
      console.log('[SendFlow] before service.sendChatMessage', {
        currentAssistantId: options.assistantMessageId,
        currentTurnId: options.turnId
      });
      const sendResponse = await this.sendChatMessage(deviceId, userMessage, this._activeSessionKey, attachments);
      console.timeEnd('[Perf] sendChat API duration');
      console.timeEnd('[Perf] total send flow duration');
      console.log('[Turn] sendResponse:', sendResponse?.success);

      // 打印 sendResponse 结构，帮助调试 runId 提取
      console.log('[Turn] sendResponse structure:', {
        keys: Object.keys(sendResponse || {}),
        dataKeys: Object.keys(sendResponse?.data || {}),
        nestedDataKeys: Object.keys(sendResponse?.data?.data || {}),
        payloadRunId: sendResponse?.data?.payload?.runId,
        dataRunId: sendResponse?.data?.data?.runId,
        nestedPayloadRunId: sendResponse?.data?.data?.payload?.runId,
        deepRunId: sendResponse?.data?.data?.data?.payload?.runId,
        reqResRunId: sendResponse?.data?.data?.reqResMsgCache?.[0]?.payload?.runId ||
                     sendResponse?.data?.data?.data?.reqResMsgCache?.[0]?.payload?.runId
      });

      // 提取并绑定 runId 到 currentTurn
      const sentRunId = this._extractRunIdFromSendResponse(sendResponse);
      if (sentRunId && this._pollState.currentTurn) {
        this._pollState.currentTurn.acceptedRunIds.add(sentRunId);
        this._pollState.activeRunId = sentRunId;
        this._pollState.currentTurn.awaitingRunId = false;  // 不再等待，开始接收事件

        console.log('[Turn] bound sendChat runId to currentTurn:', {
          runId: sentRunId,
          turnId: this._pollState.currentTurn.turnId,
          assistantMessageId: this._pollState.currentTurn.assistantMessageId,
          acceptedRunIds: Array.from(this._pollState.currentTurn.acceptedRunIds),
          awaitingRunId: this._pollState.currentTurn.awaitingRunId
        });
      } else {
        console.warn('[Turn] sendChat runId not found; will bind first fresh assistant event later', {
          hasCurrentTurn: !!this._pollState.currentTurn,
          sendResponsePreview: {
            success: sendResponse?.success,
            ok: sendResponse?.ok,
            errorCode: sendResponse?.errorCode || sendResponse?.data?.errorCode,
            keys: Object.keys(sendResponse || {}),
            dataKeys: Object.keys(sendResponse?.data || {})
          }
        });
      }

      // 检查发送是否成功（包括内层错误码）
      const innerErrorCode = sendResponse?.errorCode || sendResponse?.data?.errorCode;
      const isTimeoutError = innerErrorCode && (innerErrorCode.includes('TIMEOUT') || innerErrorCode.includes('timeout'));
      
      if (!sendResponse?.success || isTimeoutError) {
        // 发送失败或超时，清理并恢复空闲轮询
        const errorMsg = isTimeoutError ? `请求超时 (${innerErrorCode})` : (sendResponse?.msg || '发送失败');
        console.error('[Turn] sendChat failed:', { success: sendResponse?.success, errorCode: innerErrorCode, msg: errorMsg });
        this.completeActiveTurn(isTimeoutError ? 'timeout' : 'send_failed');
        return { success: false, error: isTimeoutError ? 'timeout' : 'send_failed', msg: errorMsg };
      }

      // 等待 final 或超时
      const result = await this._waitForFinal();

      console.log('[Turn] result:', result);
      return result;

    } catch (error) {
      console.error('[Turn] error:', error);
      // 出错时清理
      this.completeActiveTurn('error');
      return { success: false, error: 'unknown', msg: error.message || '通信失败' };
    }
  },

  /**
   * 确保设备就绪（WS连接 + OpenClaw健康检查）
   * 1. 检查 WS 连接状态（queryRunInfo），未连接则尝试拉起
   * 2. WS 就绪后，调用 healthCheck 验证 OpenClaw 服务可用（payload.ok === true）
   * 结果缓存 10 秒
   */
  async _ensureWebSocketReady(deviceId) {
    try {
      const now = Date.now();
      const cacheAge = now - this._wsStatusCache.lastQueryTime;
      const cacheTtl = this.config.wsCacheTtl || 10000;

      // 缓存命中：跳过 WS 检查和 health 检查
      if (this._wsStatusCache.statusData && cacheAge < cacheTtl) {
        console.log('[ReadyCheck] using cached status (age:', cacheAge, 'ms)');
        console.log('[ReadyCheck] cached wsReady:', this._wsStatusCache.isReady, 'openclawOk:', this._wsStatusCache.openclawOk);

        if (!this._wsStatusCache.isReady) {
          console.log('[ReadyCheck] cached WS not ready, attempting to start...');
          console.time('[Perf] startWebSocket duration');
          await this._startWebSocketIfNeeded(deviceId, this._wsStatusCache.statusData);
          console.timeEnd('[Perf] startWebSocket duration');
        } else if (!this._wsStatusCache.openclawOk) {
          console.warn('[ReadyCheck] cached OpenClaw not ok, will retry health check');
          await this._checkOpenClawHealth(deviceId);
        }
        return;
      }

      // === 第一步：检查 WS 连接状态 ===
      console.log('[ReadyCheck] cache expired, querying WS status...');
      console.time('[Perf] queryRunInfo duration');
      const runInfo = await window.Api.OPENCLAW.queryRunInfo(deviceId);
      console.timeEnd('[Perf] queryRunInfo duration');

      const statusData = runInfo?.data?.data || {};
      console.log('[ReadyCheck] WS status data:', statusData);

      const wsReady = this._isWebSocketReady(statusData);

      this._wsStatusCache.statusData = statusData;
      this._wsStatusCache.lastQueryTime = now;
      this._wsStatusCache.isReady = wsReady;
      this._wsStatusCache.openclawOk = false;

      if (!wsReady) {
        console.log('[ReadyCheck] WS not ready, attempting to start...');
        console.time('[Perf] startWebSocket duration');
        await this._startWebSocketIfNeeded(deviceId, statusData);
        console.timeEnd('[Perf] startWebSocket duration');
        return;
      }

      console.log('[ReadyCheck] WS is ready');

      // === 第二步：检查 OpenClaw 服务可用性 ===
      await this._checkOpenClawHealth(deviceId);

    } catch (error) {
      console.error('[ReadyCheck] Failed:', error);
    }
  },

  /**
   * 调用 healthCheck 验证 OpenClaw 服务可用性
   * 结果写入 _wsStatusCache.openclawOk
   */
  async _checkOpenClawHealth(deviceId) {
    try {
      console.time('[Perf] healthCheck duration');
      const healthResp = await window.Api.OPENCLAW.healthCheck(deviceId);
      console.timeEnd('[Perf] healthCheck duration');

      const payload = healthResp?.data?.data?.payload;
      const ok = payload?.ok === true;

      this._wsStatusCache.openclawOk = ok;
      this._wsStatusCache.healthPayload = payload || null;

      if (ok) {
        console.log('[ReadyCheck] OpenClaw health OK, agents:', payload.agents?.length, 'sessions:', payload.sessions?.count);
      } else {
        console.warn('[ReadyCheck] OpenClaw health NOT ok, payload:', payload);
      }
    } catch (error) {
      this._wsStatusCache.openclawOk = false;
      this._wsStatusCache.healthPayload = null;
      console.error('[ReadyCheck] healthCheck failed:', error);
    }
  },

  /**
   * 判断 WebSocket 是否就绪
   */
  _isWebSocketReady(statusData) {
    const status = statusData?.status;
    const connected = statusData?.connected;
    const error = statusData?.error;
    const msgCacheSize = statusData?.msgCacheSize;
    
    console.log('[OpenClawReadyCheck] statusData:', statusData);
    
    let decision = false;
    let reason = 'unknown';
    
    // 如果有明确的错误状态，认为未就绪
    if (error) {
      decision = false;
      reason = 'has error: ' + error;
    }
    // 如果有明确的 connected 字段
    else if (connected !== undefined) {
      decision = connected === true;
      reason = 'connected field: ' + connected;
    }
    // 如果有明确的 status 字段
    else if (status) {
      decision = status === 'running' || status === 'connected';
      reason = 'status field: ' + status;
    }
    // 如果有 msgCacheSize，说明设备正在运行
    else if (msgCacheSize !== undefined && msgCacheSize >= 0) {
      decision = true;
      reason = 'msgCacheSize exists: ' + msgCacheSize;
    }
    // 无法判断状态，认为未就绪
    else {
      decision = false;
      reason = 'no recognizable status field';
    }
    
    console.log('[OpenClawReadyCheck] decision:', decision);
    console.log('[OpenClawReadyCheck] reason:', reason);
    
    return decision;
  },

  /**
   * 更新 WebSocket 状态缓存
   */
  _updateWsStatusCache(statusData) {
    const now = Date.now();
    const cacheTtl = this.config.wsCacheTtl || 10000;
    
    // 提取状态信息
    const wsAlive = statusData?.wsAlive;
    const wsAvlie = statusData?.wsAvlie; // 拼写错误兼容
    const msgCacheSize = statusData?.msgCacheSize;
    
    // 判断是否就绪
    let isReady = false;
    if (wsAlive === true || wsAvlie === true) {
      isReady = true;
    } else if (msgCacheSize !== undefined && msgCacheSize >= 0) {
      isReady = true;
    }
    
    // 更新缓存（如果新数据比缓存新）
    if (!this._wsStatusCache.statusData || 
        !this._wsStatusCache.lastQueryTime ||
        (msgCacheSize !== undefined && msgCacheSize >= 0)) {
      this._wsStatusCache.statusData = statusData;
      this._wsStatusCache.lastQueryTime = now;
      this._wsStatusCache.isReady = isReady;
      
      console.log('[WsCache] updated cache:', {
        isReady: isReady,
        wsAlive: wsAlive,
        msgCacheSize: msgCacheSize,
        cachedFor: cacheTtl + 'ms'
      });
    }
  },

  /**
   * 如果需要，启动 WebSocket
   */
  async _startWebSocketIfNeeded(deviceId, statusData) {
    try {
      console.log('[OpenClawStartCheck] will start websocket: true');
      console.log('[OpenClawStartCheck] reason: _isWebSocketReady returned false');
      
      // 从配置或其他地方获取 WS 地址和 token
      // 这里需要根据实际情况获取，暂时使用示例值
      const wsUri = 'ws://192.168.8.196:18789';
      const wsToken = this._getWebSocketToken(deviceId);
      
      if (!wsToken) {
        console.warn('[WebSocketCheck] No WebSocket token available, skipping start');
        console.log('[OpenClawStartCheck] will start websocket: false');
        console.log('[OpenClawStartCheck] reason: no websocket token');
        return;
      }
      
      const response = await window.Api.OPENCLAW.startWebSocket(deviceId, wsUri, wsToken);
      console.log('[WebSocketCheck] startWebSocket response:', response?.success ? 'success' : 'failed');
    } catch (error) {
      console.error('[WebSocketCheck] Failed to start WebSocket:', error);
    }
  },

  /**
   * 获取 WebSocket token（需要根据实际实现）
   */
  _getWebSocketToken(deviceId) {
    // 这里应该从设备信息或配置中获取 token
    // 暂时返回一个示例 token
    return '29a71586190952b0b107c63121d9fc112348b031f18565c0';
  },

  /**
   * 等待 final 事件
   */
  async _waitForFinal() {
    const state = this._pollState;
    const startTime = Date.now();
    const maxWaitTime = this.config.maxTotalTime;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        let result = null;
        let reason = null;
        
        // 检查是否收到 final
        if (state.hasFinal) {
          clearInterval(checkInterval);
          reason = 'final';
          result = {
            success: true,
            text: state.finalText || state.assistantText,
            isFinal: true,
            hasFinal: true,
            commandOutputs: state.commandOutputs,
            error: false,
            reason: reason
          };
        }
        // 检查是否超时
        else if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          console.warn('[Turn] waitForFinal timeout');

          if (state.assistantText) {
            reason = 'timeout';
            result = {
              success: true,
              text: state.assistantText,
              isFinal: false,
              hasFinal: false,
              commandOutputs: state.commandOutputs,
              error: false,
              warning: '回复可能未完整',
              reason: reason
            };
          } else if (state.commandOutputs.length > 0) {
            reason = 'command_only';
            result = {
              success: true,
              text: state.commandOutputs.map(c => c.text).join('\n\n'),
              isFinal: false,
              hasFinal: false,
              commandOutputs: state.commandOutputs,
              error: false,
              warning: '仅返回执行结果',
              reason: reason
            };
          } else {
            reason = 'timeout';
            result = {
              success: true,
              text: '暂未返回结果，请稍后重试。',
              isFinal: false,
              hasFinal: false,
              commandOutputs: [],
              error: true,
              reason: reason
            };
          }
        }
        // 无活动超时：已有回复 + 超时阈值 + 连续三轮零事件 = 判定流结束
        else if (state.assistantText && Date.now() - state.lastActivityTs > this.config.maxInactivityTime && state.zeroRowsCount >= 3) {
          clearInterval(checkInterval);
          console.log('[Turn] waitForFinal - inactivity timeout, returning current response');
          reason = 'inactivity_timeout';
          result = {
            success: true,
            text: state.assistantText,
            isFinal: false,
            hasFinal: false,
            commandOutputs: state.commandOutputs,
            error: false,
            reason: reason
          };
        }
        // 30秒后提示仍在执行（仅当没有收到任何回复且未完成时）
        else if (Date.now() - startTime > 30000 && 
                 !state.hasFinal && 
                 !state.finalHandled && 
                 !state.assistantText && 
                 !state.currentTurn?.completed &&
                 state.mode === 'active') {
          // 只在 currentTurn 存在时触发 warning
          if (state.currentTurn) {
            // 5 秒内只允许触发一次 warning
            const now = Date.now();
            if (!state._lastWarningTs || now - state._lastWarningTs > 5000) {
              console.log('[UI] warning: 消息已发送，正在等待设备返回...');
              const cb = state.currentTurn?.callbacks || state.callbacks || {};
              cb.onWarning?.('消息已发送，正在等待设备返回...');
              state._lastWarningTs = now;
            }
          }
        }

        if (result) {
          this.completeActiveTurn(reason);
          resolve(result);
        }
      }, 500); // 每 500ms 检查一次
    });
  },

  // ========== 兼容旧接口 ==========

  /**
   * 等待设备回复（旧接口，保留兼容）
   */
  async waitForReply(deviceId, requestId, idempotencyKey, questionTs, sessionKey, message, callbacks = {}) {
    console.log('[Poll] waitForReply called (legacy), switching to active polling');

    // 启动活跃轮询
    this._pollState.deviceId = deviceId;
    this._pollState.questionTs = questionTs;
    this._pollState.callbacks = callbacks;

    // 合并回调
    this._pollState.callbacks = {
      ...this._pollState.callbacks,
      ...callbacks
    };

    this.startActivePolling(deviceId, message, questionTs, callbacks);

    // 等待结果
    return await this._waitForFinal();
  },

  // ========== 工具方法 ==========

  /**
   * 提取事件rows（兼容双层data结构）
   */
  extractEventRows(response) {
    if (!response) return [];

    // 优先使用明确的三层结构：response.data.data.rows
    const body = response?.data?.data;
    if (body && Array.isArray(body.rows)) {
      return body.rows;
    }

    // 兼容其他可能的结构
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.rows)) return response.rows;
    if (Array.isArray(response.events)) return response.events;

    const data1 = response.data;
    if (Array.isArray(data1)) return data1;
    if (Array.isArray(data1?.rows)) return data1.rows;
    if (Array.isArray(data1?.events)) return data1.events;
    if (Array.isArray(data1?.result)) return data1.result;

    const data2 = data1?.data;
    if (Array.isArray(data2)) return data2;
    if (Array.isArray(data2?.rows)) return data2.rows;
    if (Array.isArray(data2?.events)) return data2.events;
    if (Array.isArray(data2?.result)) return data2.result;

    const result1 = response.result;
    if (Array.isArray(result1)) return result1;
    if (Array.isArray(result1?.rows)) return result1.rows;
    if (Array.isArray(result1?.events)) return result1.events;
    if (Array.isArray(result1?.data)) return result1.data;

    const resultData = result1?.data;
    if (Array.isArray(resultData)) return resultData;
    if (Array.isArray(resultData?.rows)) return resultData.rows;
    if (Array.isArray(resultData?.events)) return resultData.events;

    console.log('[ExtractEventRows] no matching structure found, returning empty');
    return [];
  },

  /**
   * 睡眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * 生成 UUID
   */
  _generateUUID() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

// 导出到全局
window.OpenClawChatService = OpenClawChatService;
