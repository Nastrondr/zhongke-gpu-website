/**
 * API 配置文件
 * 统一管理不同环境的 API 地址和配置
 * 
 * 使用方式：
 * 1. 修改 env 变量切换环境
 * 2. 或创建 local-config.js 覆盖配置（不会被 Git 提交）
 * 
 * 接口请求示例：
 * - BaseURL: https://www.test.zhisuancf.cn/zhisuancf
 * - 接口路径: /api/v1/xxx
 * - 完整请求: https://www.test.zhisuancf.cn/zhisuancf/api/v1/xxx
 */

const ApiConfig = {
  // 当前环境：development | staging | production
  env: 'staging',

  // 开发环境（本地代理）
  development: {
    baseUrl: '/zhisuancf',
    timeout: 15000,
    enableLog: true,
    enableMockLogin: true
  },

  // 测试环境（真实测试 API）
  staging: {
    baseUrl: 'https://www.test.zhisuancf.cn/zhisuancf',
    timeout: 30000,
    enableLog: true,
    enableMockLogin: false
  },

  // 生产环境（暂不启用，等确认后配置）
  production: {
    baseUrl: '',
    timeout: 15000,
    enableLog: false,
    enableMockLogin: false
  },

  /**
   * 获取当前环境的配置
   */
  getConfig() {
    return this[this.env] || this.development;
  },

  /**
   * 获取基础 URL（不含路径）
   */
  getBaseUrl() {
    return this.getConfig().baseUrl;
  },

  /**
   * 获取完整请求 URL
   * @param {string} path - 接口路径，如 /api/v1/xxx
   */
  getFullUrl(path) {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      console.warn('[ApiConfig] Production 环境未配置 BaseURL');
      return '';
    }
    // 移除末尾斜杠，添加接口路径
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return baseUrl.replace(/\/$/, '') + normalizedPath;
  },

  /**
   * 获取请求超时时间
   */
  getTimeout() {
    return this.getConfig().timeout;
  },

  /**
   * 是否启用日志
   */
  isLogEnabled() {
    return this.getConfig().enableLog;
  }
};

// 尝试加载本地配置覆盖
try {
  if (typeof window !== 'undefined' && window.localConfig) {
    Object.assign(ApiConfig, window.localConfig);
  }
} catch (e) {
  // 忽略跨域错误
}

window.ApiConfig = ApiConfig;