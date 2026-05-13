/**
 * openclawChatService.js - 小龙虾设备对话服务
 * 
 * 封装与小龙虾设备（OpenClaw智能体）的对话逻辑
 * 
 * 使用方法:
 * const chatService = window.openclawChatService;
 * await chatService.sendMessage(deviceId, 'hello');
 * const events = await chatService.queryEvents(deviceId, Date.now(), 10);
 */

// OpenClaw 调试开关
const DEBUG_OPENCLAW = false;  // 设为 true 查看详细日志

const OpenClawChatService = {
  // queryRunInfo 缓存，60秒内不重复查询
  _runInfoCache: {
    timestamp: 0,
    data: null
  },
  
  // 配置（敏感信息请通过 Storage 配置，不要硬编码）
  config: {
    // 中文专用 session，避免英文上下文污染
    sessionKey: 'agent:main:main',
    maxPolling: 10,
    pollingInterval: 2000,
    // WebSocket 连接配置（从用户配置中读取）
    get websocketUri() {
      return Storage.get('openclaw_ws_uri') || '';
    },
    get websocketToken() {
      return Storage.get('openclaw_ws_token') || '';
    }
  },

  // 构建发送给 OpenClaw 的消息（添加中文约束）
  // 后端要求 message 必须为用户输入原文，前端不再包装 system instruction。
  // 保留此函数仅用于兼容，防止其他地方调用报错。
  buildOpenClawMessage(userMessage) {
    const trimmed = String(userMessage || '').trim();
    console.log('[OpenClaw] buildOpenClawMessage: raw message used (no system instruction)');
    return trimmed;
  },

  // 当前设备
  currentDevice: null,

  // 初始化
  init(device) {
    this.currentDevice = device;
    console.log('[OpenClawChat] init with device:', device?.name);
  },

  // 获取当前设备的 deviceId
  resolveDeviceId(device) {
    if (!device) return null;
    return device.id || device.deviceId || null;
  },

  // 获取当前设备的 iotDeviceUuid（用于小龙虾连接）
  resolveDeviceUuid(device) {
    if (!device) return null;
    return device.iotDeviceUuid || device.uuid || device.routeDeviceUuid || null;
  },

  // 获取当前设备Id
  getCurrentDeviceId() {
    if (!this.currentDevice) return null;
    return this.resolveDeviceId(this.currentDevice);
  },

  // 查询运行状态
  async queryRunInfo(deviceId) {
    if (!deviceId) throw new Error('deviceId is required');
    console.log('[OpenClawChat] queryRunInfo:', deviceId);
    return await window.Api.OPENCLAW.queryRunInfo(deviceId);
  },

  // 查询小龙虾服务状态（使用wasLive判断）
  async queryOpenClawStatus(deviceId) {
    if (!deviceId) throw new Error('deviceId is required');
    
    try {
      const response = await this.queryRunInfo(deviceId);
      const info = response?.data?.data || response?.data || response;
      
      const wasLive = info?.wasLive === true;
      const ok = info?.ok === true;
      
      console.log('[StateDebug] openclaw runInfo:', info);
      console.log('[StateDebug] openclawOnline wasLive:', wasLive);
      
      return {
        raw: response,
        wasLive,
        ok,
        latestMsgTs: info?.latestMsgTs || null,
        url: info?.url || '',
        heartbeatInterval: info?.heartbeatInterval || null,
        error: null
      };
    } catch (error) {
      console.error('[OpenClawChat] queryOpenClawStatus failed:', error);
      return {
        raw: null,
        wasLive: false,
        ok: false,
        latestMsgTs: null,
        url: '',
        heartbeatInterval: null,
        error: error.message || '检测失败'
      };
    }
  },

  // 启动 OpenClaw
  async startOpenClaw(deviceId, options = {}) {
    if (!deviceId) throw new Error('deviceId is required');
    const uri = options.uri || this.config.websocketUri;
    const token = options.token || this.config.websocketToken;
    
    if (!uri || !token) {
      console.warn('[OpenClawChat] uri/token not available, cannot start');
      return { success: false, msg: '启动参数不完整' };
    }
    
    console.log('[OpenClawChat] startOpenClaw:', deviceId);
    return await window.Api.OPENCLAW.startWebsocket(deviceId, uri, token);
  },

  // 重启 OpenClaw
  async restartOpenClaw(deviceId, options = {}) {
    if (!deviceId) throw new Error('deviceId is required');
    const uri = options.uri || this.config.websocketUri;
    const token = options.token || this.config.websocketToken;
    
    console.log('[OpenClawChat] restartOpenClaw:', deviceId);
    return await window.Api.OPENCLAW.restartWebsocket(deviceId, uri, token);
  },

  // 发送聊天消息
  async sendChatMessage(deviceId, message, options = {}) {
    if (!deviceId) throw new Error('deviceId is required');
    if (!message) throw new Error('message is required');
    
    const sessionKey = options.sessionKey || this.config.sessionKey;
    console.log('[OpenClawChat] sendChatMessage:', { deviceId, message, sessionKey });
    
    return await window.Api.OPENCLAW.sendChat(deviceId, message, sessionKey);
  },

  // 查询事件
  async queryEvents(deviceId, tsStart, limit = 10) {
    if (!deviceId) throw new Error('deviceId is required');
    if (!tsStart) tsStart = Date.now();
    
    console.log('[OpenClawChat] queryEvents:', { deviceId, tsStart, limit });
    return await window.Api.OPENCLAW.queryEvent(deviceId, tsStart, limit);
  },

  // 等待设备回复（游标式增量轮询）
  async waitForReply(deviceId, requestId, idempotencyKey, questionTs) {
    if (!deviceId) throw new Error('deviceId is required');
    
    const maxPolling = 20;  // 最多20次轮询
    
    // 轮询状态 - 使用 questionTs 作为初始游标
    const pollState = {
      questionTs: questionTs,  // 用户提问时刻
      cursorTs: questionTs,   // 游标时间戳（第一次使用 questionTs）
      processedSeqSet: new Set(),  // 已处理的 seq 去重
      currentRunId: '',  // 本轮 runId
      lastPartialText: '',
      hasFinal: false,
      hasLifecycleEnd: false,
      pollingCount: 0,
      firstTokenAt: 0,
      finalAt: 0
    };
    
    console.log('[OpenClawPoll] start, questionTs:', questionTs, 'initial cursorTs:', pollState.cursorTs);
    
    for (let i = 0; i < maxPolling; i++) {
      // 动态调整轮询间隔：前6秒每秒1次，之后每2秒1次
      const dynamicInterval = i < 6 ? 1000 : 2000;
      if (i > 0) {
        await this._sleep(dynamicInterval);
        if (DEBUG_OPENCLAW) {
          console.log('[OpenClawPoll] polling #' + (i + 1) + ' (interval: ' + dynamicInterval + 'ms)');
        }
      }
      
      pollState.pollingCount++;
      
      // 游标式查询
      console.log('[OpenClawQuery] calling queryEvent, ts_start:', pollState.cursorTs, 'questionTs:', pollState.questionTs);
      const response = await this.queryEvents(deviceId, pollState.cursorTs, 50);
      const rows = this.extractEventRows(response);
      
      // 先声明并初始化 maxTs，再使用
      let maxTs = pollState.cursorTs;
      console.log('[OpenClawQuery] rows count:', rows.length, 'maxTs (initial):', maxTs);
      const newRows = [];
      
      for (const row of rows) {
        // 生成唯一 seq
        const seq = row.seq || `${row.event}_${row.payload?.runId}_${row.payload?.seq}_${row.payload?.ts}`;
        
        // 跳过已处理的
        if (pollState.processedSeqSet.has(seq)) continue;
        pollState.processedSeqSet.add(seq);
        
        // 提取事件时间戳
        const rowTs = Number(row.payload?.ts || row.payload?.message?.timestamp || row.payload?.data?.startedAt || row.payload?.data?.endedAt || row.ts || 0);
        if (rowTs > maxTs) maxTs = rowTs;
        
        newRows.push(row);
        
        // 绑定本轮 runId - 使用 questionTs 作为本轮起始时间
        if (!pollState.currentRunId && row.event === 'agent' && row.payload?.stream === 'lifecycle' && row.payload?.data?.phase === 'start' && rowTs >= pollState.questionTs) {
          pollState.currentRunId = row.payload.runId || '';
          console.log('[OpenClawPoll] found runId:', pollState.currentRunId, 'at ts:', rowTs);
        }
        
        // 记录首 token 时间
        if (!pollState.firstTokenAt && row.event === 'agent' && row.payload?.stream === 'assistant' && (row.payload?.data?.delta || row.payload?.data?.text)) {
          pollState.firstTokenAt = rowTs;
        }
        
        // 检查 lifecycle end
        if (row.event === 'agent' && row.payload?.stream === 'lifecycle' && row.payload?.data?.phase === 'end') {
          pollState.hasLifecycleEnd = true;
          console.log('[OpenClawPoll] lifecycle end detected');
        }
        
        // 检查 final
        if (!pollState.hasFinal && row.event === 'chat' && row.payload?.state === 'final' && row.payload?.message?.role === 'assistant') {
          // 验证是否是本轮 runId
          const rowRunId = row.payload.runId;
          if (!rowRunId || rowRunId === pollState.currentRunId || !pollState.currentRunId) {
            pollState.hasFinal = true;
            pollState.finalAt = rowTs;
            
            // 解析 final 文本
            const content = row.payload?.message?.content;
            const finalText = Array.isArray(content) 
              ? content.filter(c => c?.type === 'text').map(c => c.text).join('')
              : String(content || '');
            
            // 立即停止轮��，输出性能汇总
            console.log('[OpenClawPoll] final detected at:', pollState.finalAt);
            console.table({
              sendToStart: pollState.firstTokenAt ? pollState.firstTokenAt - pollState.sendAt : 'N/A',
              startToFinal: pollState.finalAt ? pollState.finalAt - pollState.firstTokenAt : 'N/A',
              total: pollState.finalAt - pollState.sendAt,
              pollingCount: pollState.pollingCount,
              cursorTs: pollState.cursorTs
            });
            
            return {
              success: true,
              data: finalText,
              isFinal: true
            };
          }
        }
        
        // 收集 partial text
        if (!pollState.hasFinal && row.event === 'agent' && row.payload?.stream === 'assistant' && row.payload?.data?.text) {
          pollState.lastPartialText = row.payload.data.text;
        }
      }
      
      // 更新游标
      if (maxTs > pollState.cursorTs) {
        pollState.cursorTs = maxTs;
      }
      
      console.log('[OpenClawPoll] cursorTs:', pollState.cursorTs, 'new rows:', newRows.length, 'runId:', pollState.currentRunId, 'hasFinal:', pollState.hasFinal);
      
      // 如果已有 partial 但没 final，继续等待
      if (pollState.lastPartialText && !pollState.hasFinal) {
        // 继续轮询等待 final
      }
    }
    
    // 超时处理
    console.table({
      sendToFinal: pollState.finalAt ? pollState.finalAt - pollState.sendAt : 'N/A',
      total: Date.now() - pollState.sendAt,
      pollingCount: pollState.pollingCount,
      hasFinal: pollState.hasFinal,
      hasLifecycleEnd: pollState.hasLifecycleEnd,
      cursorTs: pollState.cursorTs
    });
    
    if (pollState.lastPartialText) {
      return {
        success: true,
        data: pollState.lastPartialText,
        timeout: true,
        msg: '回复可能未完整'
      };
    }
    
    return { timeout: true, msg: '小龙虾已收到指令，但暂未返回结果' };
  },

  // 发送消息并等待回复（完整流程）
  async sendMessageAndWait(device, message) {
    const deviceId = this.resolveDeviceId(device);
    
    if (!deviceId) {
      return { success: false, error: 'no_deviceid', msg: '当前设备缺少 id，暂无法连接小龙虾' };
    }

    // 设置当前设备
    this.currentDevice = device;
    
    console.log('[OpenClawChat] sendMessage:', { deviceId, message, deviceName: device?.name });

    try {
      // 1. 记录本轮提问时刻（在发送消息之前）
      const questionTs = Date.now();
      console.log('[OpenClawSend] questionTs:', questionTs);

      // 2. 发送消息
      const requestId = window.Api.OPENCLAW._generateUUID();
      const idempotencyKey = window.Api.OPENCLAW._generateUUID();
      
      console.log('[OpenClawSend] requestId:', requestId);
      console.log('[OpenClawSend] idempotencyKey:', idempotencyKey);
      
      // 使用用户输入原文
      const deviceMessage = this.buildOpenClawMessage(message);
      console.log('[OpenClawSend] message:', deviceMessage);
      
      const sendResponse = await this.sendChatMessage(deviceId, deviceMessage);
      console.log('[OpenClawChat] sendChat:', sendResponse);

      if (!sendResponse || !sendResponse.success) {
        return { success: false, error: 'send_failed', msg: sendResponse?.msg || '发送失败' };
      }

      // 3. 等待回复 - 使用 questionTs 作为本轮查询起点
      const reply = await this.waitForReply(deviceId, null, idempotencyKey, questionTs);
      return reply;
      
    } catch (error) {
      console.error('[OpenClawChat] error:', error);
      
      if (error.message?.includes('404')) {
        return { success: false, error: 'not_found', msg: '设备接口不存在' };
      }
      if (error.message?.includes('500')) {
        return { success: false, error: 'server_error', msg: '设备服务异常' };
      }
      return { success: false, error: 'unknown', msg: error.message || '通信失败' };
    }
  },

  // 提取事件rows（兼容双层data结构）
  extractEventRows(response) {
    if (!response) return [];
    
    // 如果本身就是数组
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.rows)) return response.rows;
    if (Array.isArray(response.events)) return response.events;
    
    // response.data
    const data1 = response.data;
    if (Array.isArray(data1)) return data1;
    if (Array.isArray(data1?.rows)) return data1.rows;
    if (Array.isArray(data1?.events)) return data1.events;
    
    // response.data.data（双层data）
    const data2 = data1?.data;
    if (Array.isArray(data2)) return data2;
    if (Array.isArray(data2?.rows)) return data2.rows;
    if (Array.isArray(data2?.events)) return data2.events;
    
    return [];
  },

  // 解析final chat消息
  parseFinalChatMessage(rows) {
    const finalChatRows = rows.filter(row => 
      row?.type === 'event' && 
      row?.event === 'chat' && 
      row?.payload?.state === 'final' && 
      row?.payload?.message?.role === 'assistant'
    );
    
    const finalRow = finalChatRows[finalChatRows.length - 1];
    if (!finalRow) return '';
    
    const content = finalRow.payload?.message?.content;
    if (Array.isArray(content)) {
      return content
        .filter(item => item?.type === 'text' && item?.text)
        .map(item => item.text)
        .join('');
    }
    
    if (typeof content === 'string') return content;
    
    return '';
  },

  // 解析assistant stream消息
  parseAssistantStreamMessage(rows) {
    const assistantRows = rows.filter(row => 
      row?.type === 'event' && 
      row?.event === 'agent' && 
      row?.payload?.stream === 'assistant'
    );
    
    const last = assistantRows[assistantRows.length - 1];
    return last?.payload?.data?.text || last?.payload?.data?.delta || '';
  },

  // 获取本轮次的 runId
  getCurrentRunId(rows, sendAt) {
    const starts = rows.filter(row => 
      row?.event === 'agent' && 
      row?.payload?.stream === 'lifecycle' && 
      row?.payload?.data?.phase === 'start' && 
      Number(row?.payload?.ts || 0) >= sendAt - 3000
    );
    
    if (!starts.length) return '';
    
    // 按时间排序，取最新的
    starts.sort((a, b) => Number(b.payload.ts || 0) - Number(a.payload.ts || 0));
    return starts[0]?.payload?.runId || '';
  },

  // 解析OpenClaw回复
  parseOpenClawReply(response, options = {}) {
    const { sendAt = 0, sessionKey = '' } = options;
    const rows = this.extractEventRows(response);
    
    if (DEBUG_OPENCLAW) {
      console.log('[OpenClaw] extracted rows count:', rows.length);
    }
    
    // 编码调试：查找 role=user 的消息
    const userRows = rows.filter(row => 
      row?.type === 'event' && 
      row?.event === 'chat' && 
      row?.payload?.message?.role === 'user'
    );
    if (userRows.length) {
      const userContent = userRows[userRows.length - 1]?.payload?.message?.content;
      const userText = Array.isArray(userContent) 
        ? userContent.map(c => c?.text).join('') 
        : userContent;
      if (DEBUG_OPENCLAW) {
        console.log('[EncodingDebug] OpenClaw received user message:', userText);
      }
    } else {
      console.debug('[EncodingDebug] no user message event found, skip user echo check');
    }
    
    if (!rows.length) {
      return {
        text: '',
        hasEvents: false,
        raw: response
      };
    }
    
    // 获取本轮 runId
    const currentRunId = sendAt > 0 ? this.getCurrentRunId(rows, sendAt) : '';
    if (DEBUG_OPENCLAW) {
      console.log('[OpenClaw] currentRunId:', currentRunId);
    }
    
    // 如果有 runId，按 runId 过滤 rows
    let filteredRows = rows;
    if (currentRunId) {
      filteredRows = rows.filter(row => {
        const rowRunId = row?.payload?.runId;
        return !rowRunId || rowRunId === currentRunId;
      });
      if (DEBUG_OPENCLAW) {
        console.log('[OpenClaw] filtered rows for current run:', filteredRows.length);
      }
    }
    
    // 优先解析 final chat 消息
    const finalText = this.parseFinalChatMessage(filteredRows);
    if (finalText) {
      if (DEBUG_OPENCLAW) {
        console.log('[OpenClaw] parsed final chat:', finalText);
      }
      return {
        text: finalText,
        hasEvents: true,
        isFinal: true,
        runId: currentRunId,
        raw: response
      };
    }
    
    // 如果没有 final，则解析 assistant stream
    const streamText = this.parseAssistantStreamMessage(filteredRows);
    if (streamText) {
      if (DEBUG_OPENCLAW) {
        console.log('[OpenClaw] parsed stream:', streamText);
      }
      return {
        text: streamText,
        hasEvents: true,
        isFinal: false,
        runId: currentRunId,
        raw: response
      };
    }
    
    return {
      text: '',
      hasEvents: true,
      isFinal: false,
      raw: response
    };
  },

  // 解析事件（重写，使用新逻辑）
  parseEvents(response, requestId, idempotencyKey) {
    const parsed = this.parseOpenClawReply(response);
    console.log('[OpenClaw] parsed reply:', parsed);
    
    if (!parsed.hasEvents) {
      return { raw: response };
    }
    
    if (parsed.text) {
      return {
        success: true,
        data: parsed.text,
        isFinal: parsed.isFinal
      };
    }
    
    // 有事件但无法解析
    return {
      success: false,
      msg: '收到设备事件，但暂时无法解析为标准回复',
      raw: response
    };
  },

  // 提取事件内容
  extractContent(event) {
    if (!event) return null;
    
    const content = event.data || event.content || event.message || event.payload || 
                   event.result || event.response || event.body;
    
    if (content) {
      if (typeof content === 'object') {
        return content.message || content.text || content.response || JSON.stringify(content);
      }
      return content;
    }
    
    if (typeof event === 'string') {
      return event;
    }
    
    return null;
  },

  // 睡眠
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// 导出到全局
window.OpenClawChatService = OpenClawChatService;