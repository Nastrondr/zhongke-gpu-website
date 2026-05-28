/**
 * devices.js - 设备相关 Mock 数据
 *
 * 本文件存放设备相关的 mock 数据
 * 后续接入真实后端时，只需修改 getDeviceList 等方法的实现
 * 
 * API 响应格式 (rentPage 接口):
 * {
 *   "success": true,
 *   "rows": [{ id, uuid, name, sn, mac, iotDeviceUuid, routeDeviceId, status, ... }]
 * }
 */

export const MOCK_DEVICES = [
  {
    id: '246',
    uuid: 'dev-uuid-00246',
    name: '数字大脑 02',
    sn: 'LX-02-B7H9',
    mac: '00:1B:44:11:3A:B7',
    iotDeviceUuid: 'iot-dev-00246',
    routeDeviceId: '11',
    productId: '5',
    status: 'running',
    manageState: 'active',
    firmwareVersion: '1.0.5',
    hardwareVersion: '2.0',
    activedDate: '2026-04-20 10:30:00',
    bindTime: '2026-04-20 10:30:00',
    type: '数字大脑',
    model: 'FinClaw 2.0',
    skills: 4,
    statusText: '在线',
    isOnline: true
  },
  {
    id: '245',
    uuid: 'dev-uuid-00245',
    name: '数字大脑 01',
    sn: 'LX-01-A3C5',
    mac: '00:1B:44:11:3A:A3',
    iotDeviceUuid: 'iot-dev-00245',
    routeDeviceId: '10',
    productId: '5',
    status: 'running',
    manageState: 'active',
    firmwareVersion: '1.0.3',
    hardwareVersion: '2.0',
    activedDate: '2026-04-18 15:20:00',
    bindTime: '2026-04-18 15:20:00',
    type: '数字大脑',
    model: 'FinClaw 1.0',
    skills: 2,
    statusText: '在线',
    isOnline: true
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
