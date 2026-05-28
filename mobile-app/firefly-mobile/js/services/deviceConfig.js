/**
 * DeviceConfig - 设备连接配置
 * 
 * 用于外置设备连接信息，避免硬编码在 HTML 中
 * 可创建 local-device-config.js 覆盖此配置
 */

const DeviceConfig = {
  // 当前环境：development | staging | production
  env: 'staging',

  // 测试环境设备连接
  staging: {
    deviceLink: 'http://30103215.nat123.top:41696',
    token: '29a71586190952b0b107c63121d9fc112348b031f18565c0',
    wsUrl: 'ws://192.168.8.196:18789'
  },

  // 生产环境设备连接（需修改为真实地址）
  production: {
    deviceLink: 'https://your-device.zhisuancf.cn',
    token: 'YOUR_TOKEN_HERE',
    wsUrl: 'ws://YOUR_WS_URL'
  },

  // 开发环境设备连接
  development: {
    deviceLink: 'http://localhost:8080',
    token: 'dev-token',
    wsUrl: 'ws://localhost:8080'
  },

  /**
   * 获取当前配置
   */
  getConfig() {
    return this[this.env] || this.development;
  },

  /**
   * 获取完整设备链接
   */
  getDeviceLink() {
    const config = this.getConfig();
    return `${config.deviceLink}/?token=${config.token}`;
  },

  /**
   * 获取 WebSocket URL
   */
  getWsUrl() {
    return this.getConfig().wsUrl;
  }
};

// 尝试加载本地配置覆盖
try {
  if (typeof window !== 'undefined' && window.localDeviceConfig) {
    Object.assign(DeviceConfig, window.localDeviceConfig);
  }
} catch (e) {
  // 忽略跨域错误
}

window.DeviceConfig = DeviceConfig;