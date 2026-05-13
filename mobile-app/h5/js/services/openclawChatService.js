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

const OpenClawChatService = {
  // 配置
  config: {
    sessionKey: 'agent:main:main',
    maxPolling: 10,
    pollingInterval: 2000,
    // WebSocket 连接配置（从用户提供的 token 解码获得）
    websocketUri: 'ws://192.168.8.196:18789/chat',
    websocketToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJDbG91ZEFwaVNhbXBsZSIsImNvbXBhbnlOYW1lIjoi54ix5Zub6LGh77yI5rWZ5rGf77yJ5pm66IO956eR5oqA5pyJ6ZmQ5YWs5Y-4IiwibW9iaWxlIjoiMTgyNTgxNjkzNjciLCJpc3MiOiJESkkiLCJwcm9maWxlc0FjdGl2ZSI6IkRFViIsInVzZXJJZCI6IjI0NiIsIndvcmtzcGFjZUdyb3VwSWQiOiIyODAiLCJ3b3Jrc3BhY2VDb21wYW55SWQiOiIxNTYiLCJyZWFsTmFtZSI6Ium7hOawuOi_myIsImNvbXBhbnlJZCI6IjE1OCIsImV4cGlyZVRpbWUiOiIxNzc4MDQxMjY0Mzk1IiwibmJmIjoxNzc3NDM2NDY0LCJhcHBJZCI6IjUiLCJhcHBLZXkiOiJ6a2d6eS1jbXMiLCJleHAiOjE3ODYwNzY0NjQsImlhdCI6MTc3NzQzNjQ2NCwid29ya3NwYWNlSWQiOiIxMSJ9.YnM9u8W2ObRUwZGS53MJURPfV5C7Tg1V4dUhiSVROEc'
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

  // 等待设备回复（轮询）
  async waitForReply(deviceId, requestId, idempotencyKey, tsStart) {
    if (!deviceId) throw new Error('deviceId is required');
    
    const maxPolling = this.config.maxPolling;
    const interval = this.config.pollingInterval;
    
    for (let i = 0; i < maxPolling; i++) {
      if (i > 0) {
        await this._sleep(interval);
        console.log('[OpenClawChat] polling #' + (i + 1));
      }
      
      const response = await this.queryEvents(deviceId, tsStart, 10);
      const parsed = this.parseEvents(response, requestId, idempotencyKey);
      
      if (parsed && !parsed.raw) {
        return parsed;
      }
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
      // 1. 查询运行状态
      try {
        const runInfo = await this.queryRunInfo(deviceId);
        console.log('[OpenClawChat] queryRunInfo:', runInfo);
        // TODO: 如果状态异常，可以尝试 restart
      } catch (e) {
        console.warn('[OpenClawChat] queryRunInfo failed:', e);
      }

      // 2. 发送消息
      const tsStart = Date.now();
      const idempotencyKey = window.Api.OPENCLAW._generateUUID();
      
      const sendResponse = await this.sendChatMessage(deviceId, message);
      console.log('[OpenClawChat] sendChat:', sendResponse);

      if (!sendResponse || !sendResponse.success) {
        return { success: false, error: 'send_failed', msg: sendResponse?.msg || '发送失败' };
      }

      // 3. 等待回复
      const reply = await this.waitForReply(deviceId, null, idempotencyKey, tsStart);
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

  // 解析事件
  parseEvents(response, requestId, idempotencyKey) {
    if (!response) return { raw: response };
    
    let events = [];
    const data = response.data || response;
    
    // 提取 events 数组
    if (Array.isArray(data)) {
      events = data;
    } else if (data.rows) {
      events = data.rows;
    } else if (data.events) {
      events = data.events;
    } else if (data.list) {
      events = data.list;
    }
    
    if (!events || events.length === 0) {
      return { raw: response };
    }
    
    console.log('[OpenClawChat] events:', events);
    
    // 尝试匹配 requestId / idempotencyKey
    if (requestId || idempotencyKey) {
      const matched = events.find(e => 
        (requestId && (e.id === requestId || e.requestId === requestId || e.reqId === requestId)) ||
        (idempotencyKey && (e.idempotencyKey === idempotencyKey || e.idempotency_key === idempotencyKey))
      );
      if (matched) {
        return this.extractContent(matched);
      }
    }
    
    // 找第一条有效事件
    for (const event of events) {
      const result = this.extractContent(event);
      if (result) return result;
    }
    
    return this.extractContent(events[0]);
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