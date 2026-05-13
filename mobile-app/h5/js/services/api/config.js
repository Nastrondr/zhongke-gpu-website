/**
 * API 配置文件
 * 统一管理不同环境的 API 地址和配置
 */

const ApiConfig = {
  // 环境配置
  env: 'production', // development | staging | production

  // 开发环境
  development: {
    baseUrl: '/zhisuancf',
    timeout: 15000,
    enableLog: true,
    enableMockLogin: false  // 开发环境关闭 Mock，使用真实 API
  },

  // 测试环境
  staging: {
    baseUrl: 'https://www.test.zhisuancf.cn/zhisuancf',
    timeout: 15000,
    enableLog: true,
    enableMockLogin: false
  },

  // 生产环境
  production: {
    baseUrl: 'https://www.test.zhisuancf.cn/zhisuancf',
    timeout: 15000,
    enableLog: false,
    enableMockLogin: false  // 生产环境必须关闭 Mock 登录
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
   * 是否启用 Mock 登录（仅开发/测试环境）
   */
  isMockLoginEnabled() {
    return this.getConfig().enableMockLogin === true;
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
      console.log(`[ApiConfig] Mock Login: ${this.isMockLoginEnabled()}`);
    } else {
      console.error(`[ApiConfig] 无效的环境: ${env}`);
    }
  },

  /**
   * 开启/关闭 Mock 登录（可在控制台调用）
   * @param {boolean} enabled
   */
  setMockLogin(enabled) {
    this.development.enableMockLogin = enabled;
    console.log(`[ApiConfig] Mock Login 已${enabled ? '开启' : '关闭'}`);
  }
};

window.ApiConfig = ApiConfig;
