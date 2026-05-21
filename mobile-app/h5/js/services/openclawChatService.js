/**
 * openclawChatService.js - 萤火虫设备对话服务
 * 
 * 封装与萤火虫设备（OpenClaw智能体）的对话逻辑
 * 
 * 三段式轮询策略：
 * 1. 恢复轮询 - 页面加载时补齐历史事件
 * 2. 空闲轮询 - 每 10 秒查询一次（idle polling）
 * 3. 活跃轮询 - 发送消息后每 1 秒查询一次（active polling）
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
    callbacks: {},           // 回调函数
    questionTs: 0,          // 当前问题时间戳
    hasFinal: false,        // 是否已收到 final
    finalText: '',          // final 事件中的完整文本
    assistantText: '',       // 当前 assistant 文本
    commandOutputs: [],      // 命令输出列表
    lifecycleStarted: false, // 是否收到 lifecycle start
    lifecycleEnded: false,   // 是否收到 lifecycle end
    activeRunId: ''         // 当前活跃的 runId
  },

  // 配置
  config: {
    sessionKey: 'agent:main:main',
    idleInterval: 10000,     // 空闲轮询间隔：10秒
    activeInterval: 1000,    // 活跃轮询间隔：1秒
    recoverySafetyWindow: 5 * 60 * 1000, // 恢复轮询安全窗口：5分钟
    maxRecoveryIterations: 50, // 最大恢复迭代次数
    maxTotalTime: 10 * 60 * 1000, // 最大总时间：10分钟
    maxInactivityTime: 5000 // 最大无活动时间：5秒（无新事件则认为完成）
  },

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
      processedEvents: new Set(),
      timerId: null,
      callbacks,
      questionTs: 0,
      hasFinal: false,
      finalText: '',
      assistantText: '',
      commandOutputs: [],
      lifecycleStarted: false,
      lifecycleEnded: false,
      activeRunId: '',
      recoveryCount: 0
    };

    // 开始恢复轮询
    this._doPoll();
  },

  /**
   * 停止轮询系统
   */
  stopPolling() {
    if (this._pollState.timerId) {
      clearTimeout(this._pollState.timerId);
      this._pollState.timerId = null;
    }
    this._pollState.isRunning = false;
    console.log('[Poll] stopped');
  },

  /**
   * 发送消息后切换到活跃轮询
   * @param {string} message - 发送的消息
   * @param {number} questionTs - 问题时间戳（在发送前生成）
   */
  startActivePolling(message, questionTs) {
    if (!this._pollState.isRunning) {
      console.warn('[Poll] not running, cannot start active polling');
      return;
    }

    console.log('[Poll] ========== 切换到活跃轮询 ==========');
    console.log('[Poll] message:', message, 'questionTs:', questionTs);

    this._pollState.mode = 'active';
    this._pollState.interval = this.config.activeInterval; // 1秒
    this._pollState.questionTs = questionTs || Date.now();
    this._pollState.cursorTs = this._pollState.questionTs;
    this._pollState.hasFinal = false;
    this._pollState.finalText = '';
    this._pollState.assistantText = '';
    this._pollState.commandOutputs = [];
    this._pollState.lifecycleStarted = false;
    this._pollState.lifecycleEnded = false;
    this._pollState.activeRunId = '';
    this._pollState.callbacks = {}; // 重置回调，避免与空闲轮询的回调冲突
    this._pollState.lastActivityTs = Date.now(); // 记录活动开始时间
    // 不清空 processedEvents，而是依赖 questionTs 过滤
  },

  /**
   * 切换到空闲轮询
   */
  switchToIdlePolling() {
    if (!this._pollState.isRunning) return;

    console.log('[Poll] ========== 切换到空闲轮询 ==========');
    this._pollState.mode = 'idle';
    this._pollState.interval = this.config.idleInterval; // 10秒
    this._pollState.questionTs = 0;
    this._pollState.hasFinal = false;
    this._pollState.processedEvents = new Set();

    this._pollState.callbacks.onIdle?.();
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
    const startTime = Date.now();

    try {
      console.log('[Poll] querying events, mode:', state.mode, 'cursorTs:', state.cursorTs);

      const response = await this.queryEvents(state.deviceId, state.cursorTs, 50);
      const rows = this.extractEventRows(response);
      const serverTsStart = this._getServerTsStart(response);

      console.log('[Poll] received rows:', rows.length, 'serverTsStart:', serverTsStart);

      // 处理事件
      const hasNewEvents = this._processEvents(rows);

      // 推进游标
      if (serverTsStart && serverTsStart > state.cursorTs) {
        state.cursorTs = serverTsStart;
      } else if (state.lastEventTs > state.cursorTs) {
        state.cursorTs = state.lastEventTs;
      }

      // 保存最后事件时间戳到本地存储
      if (state.lastEventTs > 0) {
        localStorage.setItem('openclaw_last_event_ts', state.lastEventTs);
      }

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
    }

    // 计算实际等待时间
    const elapsed = Date.now() - startTime;
    const waitTime = Math.max(0, state.interval - elapsed);

    // 安排下一次轮询
    if (this._pollState.isRunning) {
      this._pollState.timerId = setTimeout(() => this._doPoll(), waitTime);
    }
  },

  /**
   * 处理事件列表
   * @returns {boolean} 是否有新事件
   */
  _processEvents(rows) {
    const state = this._pollState;
    let hasNewEvents = false;

    for (const row of rows) {
      const eventKey = this._getEventKey(row);

      // 去重检查
      if (eventKey && state.processedEvents.has(eventKey)) {
        continue;
      }

      const payload = row.payload || row;
      const rowTs = this._getRowTs(row);

      // active 模式下过滤早于 questionTs - 5秒 的事件（增加时间容差）
      if (state.mode === 'active' && state.questionTs && rowTs && rowTs < state.questionTs - 5000) {
        console.log('[DEBUG-POLL] 事件被时间戳过滤 - rowTs:', rowTs, 'questionTs:', state.questionTs, 'diff(ms):', rowTs - state.questionTs);
        continue;
      }

      // 更新最后事件时间戳
      if (rowTs > state.lastEventTs) {
        state.lastEventTs = rowTs;
      }

      // 更新最后活动时间戳（收到新事件时）
      state.lastActivityTs = Date.now();

      // 标记为已处理
      if (eventKey) {
        state.processedEvents.add(eventKey);
      }

      // 忽略请求回显
      if (this._isReqEcho(row, payload)) {
        continue;
      }

      // 检测到 lifecycle_start，记录 activeRunId
      if (payload.stream === 'lifecycle' && payload.data?.phase === 'start' && payload.runId) {
        state.activeRunId = payload.runId;
        console.log('[Poll] recorded activeRunId:', state.activeRunId);
      }

      // active 模式下，如果已记录 activeRunId，则只处理同一个 runId 的事件
      if (state.mode === 'active' && state.activeRunId && payload.runId && payload.runId !== state.activeRunId) {
        console.log('[DEBUG-POLL] runId不匹配 - expected:', state.activeRunId, 'got:', payload.runId);
        continue;
      }

      hasNewEvents = true;

      // 解析事件类型
      const eventType = this._parseEventType(row, payload);

      console.log('[Event]', eventType, {
        stream: payload.stream,
        state: payload.state,
        phase: payload.data?.phase,
        runId: payload.runId
      });

      // 处理不同类型的事件
      this._handleEvent(eventType, row, payload, eventKey);
    }

    return hasNewEvents;
  },

  /**
   * 处理单个事件
   */
  _handleEvent(eventType, row, payload, eventKey) {
    const state = this._pollState;
    const callbacks = state.callbacks;

    switch (eventType) {
      case 'lifecycle_start':
        state.lifecycleStarted = true;
        console.log('[Lifecycle] start, runId:', payload.runId);
        callbacks.onLifecycleStart?.(payload.runId, payload.data);
        break;

      case 'lifecycle_end':
        state.lifecycleEnded = true;
        console.log('[Lifecycle] end');
        callbacks.onLifecycleEnd?.(payload.data);
        break;

      case 'assistant':
        const assistantText = payload.data?.text || payload.data?.delta || '';
        if (assistantText) {
          state.assistantText = assistantText;
          console.log('[Assistant] update, len:', assistantText.length);
          callbacks.onAssistantUpdate?.(assistantText);
        }
        break;

      case 'chat_delta':
        const chatText = this._extractChatContent(payload);
        if (chatText) {
          state.assistantText = chatText;
          console.log('[Assistant] chat delta, len:', chatText.length);
          callbacks.onAssistantUpdate?.(chatText);
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
          callbacks.onCommandOutput?.(outputText, outputInfo);
        }
        break;

      case 'chat_final':
        const finalText = this._extractChatContent(payload);
        if (finalText) {
          state.hasFinal = true;
          state.finalText = finalText;
          state.assistantText = finalText;
          console.log('[Final] received, len:', finalText.length);
          callbacks.onFinal?.(finalText, {
            assistantText: state.assistantText,
            commandOutputs: state.commandOutputs
          });
        }
        break;
    }
  },

  // ========== 辅助函数 ==========

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
    const payload = row.payload || row;
    return Number(payload.ts || row.ts || row.timestamp || 0) || 0;
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
   * 发送聊天消息
   */
  async sendChatMessage(deviceId, message, sessionKey = 'agent:main:main', images = []) {
    if (!deviceId) throw new Error('deviceId is required');
    if (!message) throw new Error('message is required');
    console.log('[OpenClawChat] sendChatMessage:', { deviceId, message, sessionKey, images: images.length });
    return await window.Api.OPENCLAW.sendChat(deviceId, message, sessionKey, images);
  },

  /**
   * 发送消息并等待回复（新接口，使用活跃轮询）
   * @param {Object} device - 设备对象
   * @param {string} message - 消息内容
   * @param {Object} callbacks - 回调函数
   * @param {Array} images - 图片数据数组（base64）
   */
  async sendMessageAndWait(device, message, callbacks = {}, images = []) {
    const deviceId = this.resolveDeviceId(device);

    if (!deviceId || !Number.isFinite(deviceId)) {
      console.error('[OpenClawChat] sendMessage failed:', device);
      return { success: false, error: 'no_deviceid', msg: '当前设备缺少数字id' };
    }

    this.currentDevice = device;

    console.log('[Turn] ========== 发送消息 ==========');
    console.log('[Turn] message:', message);
    console.log('[Turn] deviceId:', deviceId);

    try {
      const userMessage = String(message || '').trim();

      // 在发送消息之前生成 questionTs，确保能捕获后端快速返回的事件
      const questionTs = Date.now();
      console.log('[Turn] questionTs:', questionTs);

      // 先切换到活跃轮询
      this.startActivePolling(userMessage, questionTs);

      // 设置活跃轮询的回调（覆盖 startActivePolling 清空的回调）
      this._pollState.callbacks = callbacks;

      // 再发送消息（包含图片）
      const sendResponse = await this.sendChatMessage(deviceId, userMessage, 'agent:main:main', images);
      console.log('[Turn] sendResponse:', sendResponse?.success);

      if (!sendResponse?.success) {
        // 发送失败，恢复空闲轮询
        this.switchToIdlePolling();
        return { success: false, error: 'send_failed', msg: sendResponse?.msg || '发送失败' };
      }

      // 等待 final 或超时
      const result = await this._waitForFinal();

      console.log('[Turn] result:', result);
      return result;

    } catch (error) {
      console.error('[Turn] error:', error);
      return { success: false, error: 'unknown', msg: error.message || '通信失败' };
    }
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
        // 检查是否收到 final
        if (state.hasFinal) {
          clearInterval(checkInterval);
          resolve({
            success: true,
            text: state.finalText || state.assistantText,
            isFinal: true,
            hasFinal: true,
            commandOutputs: state.commandOutputs,
            error: false,
            reason: 'final'
          });
          return;
        }

        // 检查是否超时
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          console.warn('[Turn] waitForFinal timeout');

          if (state.assistantText) {
            resolve({
              success: true,
              text: state.assistantText,
              isFinal: false,
              hasFinal: false,
              commandOutputs: state.commandOutputs,
              error: false,
              warning: '回复可能未完整',
              reason: 'timeout'
            });
          } else if (state.commandOutputs.length > 0) {
            resolve({
              success: true,
              text: state.commandOutputs.map(c => c.text).join('\n\n'),
              isFinal: false,
              hasFinal: false,
              commandOutputs: state.commandOutputs,
              error: false,
              warning: '仅返回执行结果',
              reason: 'command_only'
            });
          } else {
            resolve({
              success: true,
              text: '暂未返回结果，请稍后重试。',
              isFinal: false,
              hasFinal: false,
              commandOutputs: [],
              error: true,
              reason: 'timeout'
            });
          }
          return;
        }

        // 无活动超时：如果已有回复且一段时间没有新事件，认为任务完成
        if (state.assistantText && Date.now() - state.lastActivityTs > this.config.maxInactivityTime) {
          clearInterval(checkInterval);
          console.log('[Turn] waitForFinal - inactivity timeout, returning current response');
          resolve({
            success: true,
            text: state.assistantText,
            isFinal: false,
            hasFinal: false,
            commandOutputs: state.commandOutputs,
            error: false,
            reason: 'inactivity_timeout'
          });
          return;
        }

        // 30秒后提示仍在执行（仅当没有收到任何回复时）
        if (Date.now() - startTime > 30000 && !state.hasFinal && !state.assistantText) {
          state.callbacks.onWarning?.('任务仍在执行中，我会继续等待结果...');
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

    this.startActivePolling(message);

    // 等待结果
    return await this._waitForFinal();
  },

  // ========== 工具方法 ==========

  /**
   * 提取事件rows（兼容双层data结构）
   */
  extractEventRows(response) {
    if (!response) return [];

    if (Array.isArray(response)) return response;
    if (Array.isArray(response.rows)) return response.rows;
    if (Array.isArray(response.events)) return response.events;

    const data1 = response.data;
    if (Array.isArray(data1)) return data1;
    if (Array.isArray(data1?.rows)) return data1.rows;
    if (Array.isArray(data1?.events)) return data1.events;

    const data2 = data1?.data;
    if (Array.isArray(data2)) return data2;
    if (Array.isArray(data2?.rows)) return data2.rows;
    if (Array.isArray(data2?.result)) return data2.result;

    return [];
  },

  /**
   * 睡眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// 导出到全局
window.OpenClawChatService = OpenClawChatService;
