/**
 * API 端点定义
 * 统一管理所有 API 路由，便于后端对接和维护
 */

const ApiEndpoints = {
  // 认证相关
  auth: {
    login: { method: 'POST', path: '/auth/login' },
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

  // 设备相关
  device: {
    list: { method: 'GET', path: '/devices' },
    detail: { method: 'GET', path: '/devices/:id' },
    status: { method: 'GET', path: '/devices/:id/status' },
    bind: { method: 'POST', path: '/devices/bind' },
    unbind: { method: 'POST', path: '/devices/:id/unbind' },
    bindLink: { method: 'POST', path: '/devices/bind-link' },
    verifyBindLink: { method: 'POST', path: '/devices/verify-bind-link' },
    scan: { method: 'POST', path: '/devices/:id/scan' },
    sync: { method: 'POST', path: '/devices/:id/sync' },
    restart: { method: 'POST', path: '/devices/:id/restart' },
    diagnose: { method: 'POST', path: '/devices/:id/diagnose' }
  },

  // 模型相关
  model: {
    list: { method: 'GET', path: '/models' },
    current: { method: 'GET', path: '/models/current' },
    switch: { method: 'POST', path: '/models/switch' },
    capabilities: { method: 'GET', path: '/models/capabilities' }
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