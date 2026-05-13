/**
 * API 端点定义
 * 统一管理所有 API 路由，便于后端对接和维护
 */

const ApiEndpoints = {
  // 认证相关
  auth: {
    login: { method: 'POST', path: '/open/api/v1/login' },
    logout: { method: 'POST', path: '/auth/logout' },
    register: { method: 'POST', path: '/auth/register' },
    refreshToken: { method: 'POST', path: '/auth/refresh' },
    verifyCode: { method: 'POST', path: '/auth/verify-code' },
    sendCode: { method: 'POST', path: '/auth/send-code' }
  },

  // 用户相关
  user: {
    profile: { method: 'GET', path: '/user/profile' },
    updateProfile: { method: 'PUT', path: '/user/profile' },
    permissions: { method: 'GET', path: '/user/permissions' },
    bindStatus: { method: 'GET', path: '/user/bind-status' },
    accountBinding: { method: 'POST', path: '/user/account-binding' }
  },

  // 设备相关（四象平台 API）
  device: {
    // 获取用户租用设备列表
    list: { method: 'POST', path: '/manage/api/v1/devices/endUsers/:userId/rentPage' },
    // 获取设备详情
    detail: { method: 'GET', path: '/manage/api/v1/devices/:id' },
    // 获取设备状态
    status: { method: 'GET', path: '/manage/api/v1/devices/:id/status' },
    // 获取设备事件分页
    events: { method: 'POST', path: '/manage/api/v1/devices/:id/events/page' },
    // 获取设备算力消耗分页
    tc: { method: 'POST', path: '/manage/api/v1/devices/:id/tc/page' },
    // 设备操作 (doAction)
    doAction: { method: 'POST', path: '/manage/api/v1/devices/:id/doAction/:action' },
    // 解绑承租用户
    unbindRentUser: { method: 'DELETE', path: '/manage/api/v1/devices/:id/unbindRentUser' },
    // 绑定承租用户
    bindRentUser: { method: 'POST', path: '/manage/api/v1/devices/bindRentUser' },
    // 扫码激活
    scanActivate: { method: 'POST', path: '/devices/activate/scan' },

    // 小龙虾设备命令（OPENCLAW_MANAGER 网关扩展）
    openclaw: {
      // 设备能力调用接口（正确路径）
      invork: { 
        method: 'POST', 
        path: '/manage/api/v1/devices/:id/iot/capbility/invork'
      }
    }
  },

  // 模型相关（四象 AI 平台）
  model: {
    // 获取所有模型列表（旧接口）
    list: { method: 'GET', path: '/manage/api/v1/ai/model/all' },
    // 获取模型列表（CAS 新接口）
    listCas: { method: 'GET', path: '/manage/api/v1/ai/CAS/stream/proxy/api/tags' },
    // 生成AI访问令牌
    accessToken: { method: 'POST', path: '/manage/api/v1/ai/accesstoken' },
    // AI流式推理 (provider 是变量，如 deepseek, openai 等)
    stream: { method: 'POST', path: '/manage/api/v1/ai/:provider/stream/proxy' },
    // AI流式推理(无思考过程)
    streamNoThinking: { method: 'POST', path: '/manage/api/v1/ai/:provider/stream/nothinking/proxy/v1/chat/completions' }
  },

  // 技能相关
  skill: {
    list: { method: 'GET', path: '/skills' },
    execute: { method: 'POST', path: '/skills/execute' },
    history: { method: 'GET', path: '/skills/history' },
    supported: { method: 'GET', path: '/skills/supported' }
  },

  // 任务相关
  task: {
    list: { method: 'GET', path: '/tasks' },
    detail: { method: 'GET', path: '/tasks/:id' },
    cancel: { method: 'POST', path: '/tasks/:id/cancel' },
    create: { method: 'POST', path: '/tasks' }
  },

  // 钱包相关
  wallet: {
    balance: { method: 'GET', path: '/wallet/balance' },
    overview: { method: 'GET', path: '/wallet/overview' },
    incomeTrend: { method: 'GET', path: '/wallet/income-trend' },
    expenseTrend: { method: 'GET', path: '/wallet/expense-trend' },
    expenseBreakdown: { method: 'GET', path: '/wallet/expense-breakdown' },
    records: { method: 'GET', path: '/wallet/records' },
    topup: { method: 'POST', path: '/wallet/topup' },
    topupRecords: { method: 'GET', path: '/wallet/topup-records' }
  },

  // 连接相关
  connection: {
    list: { method: 'GET', path: '/connections' },
    add: { method: 'POST', path: '/connections' },
    remove: { method: 'DELETE', path: '/connections/:id' },
    reconnect: { method: 'POST', path: '/connections/:id/reconnect' },
    dataSources: { method: 'GET', path: '/connections/data-sources' },
    capabilities: { method: 'GET', path: '/connections/capabilities' }
  },

  /**
   * 替换 URL 中的路径参数
   * @param {string} path - 路径，如 /devices/:id
   * @param {Object} params - 参数对象，如 { id: '123' }
   * @returns {string} 替换后的路径
   */
  replacePathParams(path, params) {
    let result = path;
    Object.keys(params).forEach(key => {
      result = result.replace(`:${key}`, params[key]);
    });
    return result;
  },

  /**
   * 构建完整的 URL
   * @param {string} path - API 路径
   * @returns {string} 完整的 URL
   */
  buildUrl(path) {
    const baseUrl = ApiConfig.getBaseUrl();
    return `${baseUrl}${path}`;
  }
};

window.ApiEndpoints = ApiEndpoints;