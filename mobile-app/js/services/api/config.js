/**
 * API 配置文件
 * 统一管理不同环境的 API 地址和配置
 */

const ApiConfig = {
  // 环境配置
  env: 'development', // development | staging | production

  // 开发环境
  development: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 15000,
    enableLog: true
  },

  // 测试环境
  staging: {
    baseUrl: 'https://staging-api.example.com/api',
    timeout: 15000,
    enableLog: true
  },

  // 生产环境
  production: {
    baseUrl: 'https://api.example.com/api',
    timeout: 15000,
    enableLog: false
  },

  /**
   * 获取当前环境的配置
   */
  getConfig() {
    return this[this.env] || this.development;
  },

  /**
   * 获取基础 URL
   */
  getBaseUrl() {
    return this.getConfig().baseUrl;
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
  },

  /**
   * 切换环境（可在控制台调用）
   * @param {string} env - development | staging | production
   */
  setEnv(env) {
    if (this[env]) {
      this.env = env;
      console.log(`[ApiConfig] 环境已切换为: ${env}`);
      console.log(`[ApiConfig] Base URL: ${this.getBaseUrl()}`);
    } else {
      console.error(`[ApiConfig] 无效的环境: ${env}`);
    }
  }
};

window.ApiConfig = ApiConfig;