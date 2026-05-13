/**
 * devices.js - 设备相关 Mock 数据
 *
 * 本文件存放设备相关的 mock 数据
 * 后续接入真实后端时，只需修改 getDeviceList 等方法的实现
 */

export const MOCK_DEVICES = [
  {
    id: 'LX-02-B7H9',
    name: '数字大脑 02',
    type: '数字大脑',
    status: 'online',
    statusText: '在线',
    model: 'FinClaw 2.0',
    skills: 4,
    bindTime: '2026-04-20 10:30:00'
  },
  {
    id: 'LX-01-A3C5',
    name: '数字大脑 01',
    type: '数字大脑',
    status: 'online',
    statusText: '在线',
    model: 'FinClaw 1.0',
    skills: 2,
    bindTime: '2026-04-18 15:20:00'
  }
];

export const DeviceAPI = {
  /**
   * 获取设备列表
   * @returns {Promise<Array>}
   */
  async getDeviceList() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...MOCK_DEVICES]);
      }, 500);
    });
  },

  /**
   * 根据 ID 查询设备
   * @param {string} deviceId
   * @returns {Promise<Object|null>}
   */
  async getDeviceById(deviceId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const device = MOCK_DEVICES.find(d => d.id === deviceId);
        resolve(device || null);
      }, 300);
    });
  },

  /**
   * 绑定设备
   * @param {Object} deviceData
   * @returns {Promise<Object>}
   */
  async bindDevice(deviceData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDevice = {
          ...deviceData,
          status: 'online',
          statusText: '在线',
          bindTime: new Date().toLocaleString()
        };
        MOCK_DEVICES.push(newDevice);
        resolve({ success: true, data: newDevice });
      }, 800);
    });
  }
};
