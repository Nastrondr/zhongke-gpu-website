/**
 * 设备状态管理服务
 * 统一管理设备状态，为接入后端做准备
 */

// 调试开关（生产环境设为 false）
const DEBUG_DEVICE = false;

const DeviceManager = {
  // 设备状态常量
  STATUS: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    BUSY: 'busy',
    ERROR: 'error',
    PENDING: 'pending'
  },

  // 设备任务状态
  TASK_STATUS: {
    IDLE: '空闲中',
    RUNNING: '运行中',
    ARCHIVING: '文档归档中',
    SUMMARIZING: '资讯总结中',
    SYNCING: '数据同步中',
    SWITCHING: '模型切换中'
  },

  // 标记是否已获取真实API数据
  hasRealData: false,

  // 默认设备数据（模拟后端数据）
  defaultDevice: {
    id: 'XY-01-A8F3',
    name: '萤火虫-数字大脑 01',
    status: 'online', // online, offline, busy, error
    isOnline: true,
    taskStatus: '空闲中',
    currentModel: 'FinBERT',
    deviceCount: 1,
    onlineCount: 1,
    bindStatus: 'bound', // none, pending, bound
    lastSeen: new Date().toISOString(),
    networkStatus: 'strong',
    skills: 3
  },

  /**
   * 初始化设备管理器
   */
  init() {
    // 如果没有设备数据，设置默认数据
    if (!Storage.Device.getCurrentDevice()) {
      this.setDevice(this.defaultDevice);
    }
    console.log('[DeviceManager] 初始化完成');
  },

  /**
   * 获取设备列表（从真实API）
   * @returns {Promise<Array>}
   */
  async getDevices() {
    try {
      // 检查 Api 是否可用
      if (typeof window.Api === 'undefined' || !window.Api || !window.Api.Device) {
        console.warn('[DeviceManager] Api 未定义，从缓存读取设备');
        const cached = Storage.Device.getDeviceList();
        return cached || [];
      }
      
      // 从登录缓存获取userId
      const user = Storage.Auth.getCurrentUser();
      const userId = user?.userId || user?.id;
      
      if (!userId) {
        console.error('[DeviceManager] 获取设备列表失败: 未找到userId');
        throw new Error('未找到userId');
      }

      // 构建最小分页请求体
      const requestBody = {
        pageNumber: 1,
        pageSize: 10
      };

      // 调用四象接口
      const response = await Api.Device.getList(userId, requestBody);

      if (DEBUG_DEVICE) {
        console.log('[Trial] device list raw response:', response);
      }

      if (response && (response.success === true || response.code === '0' || response.code === 0)) {
        // 从PageWrapperDeviceDTO中提取设备数组
        const devices = response.data?.rows || response.rows || [];

        if (DEBUG_DEVICE) {
          console.log('[Trial] devices array:', devices);
          console.log('[Trial] first device keys:', Object.keys(devices[0] || {}));
        }

        // 缓存到 Storage
        if (devices.length > 0) {
          Storage.Device.setCurrentDevice(devices[0]);
          Storage.Device.setDeviceList(devices);
          this.hasRealData = true;
        }

        return devices.map(device => this._normalizeDevice(device, devices.length));
      }

      if (DEBUG_DEVICE) {
        console.log('[Trial] API returned but success not true, response:', response);
      }
    } catch (error) {
      console.error('[DeviceManager] 获取设备列表失败:', error);
    }

    // DEV ONLY: 如果是开发测试token，不使用默认设备兜底，直接返回空
    const token = Storage.Auth.getToken();
    if (token && token.startsWith('dev-')) {
      console.log('[DeviceManager] DEV MODE: returning empty device list');
      return [];
    }

    // fallback 到缓存的设备
    const cached = Storage.Device.getDeviceList();
    if (cached && cached.length > 0) {
      return cached;
    }
    const current = Storage.Device.getCurrentDevice();
    if (current) {
      return [current];
    }

    // 没有真实设备和缓存，返回空数组
    return [];
  },

  /**
 * 统一设备字段映射（从四象API数据到前端格式）
 * @param {Object} device - 四象API返回的设备数据
 * @param {number} totalCount - 设备总数
 * @returns {Object}
 */
  _normalizeDevice(device, totalCount = 1) {
    // 判断设备是否在线: status 为 running/online/active 时认为在线
    const status = device.status ? device.status.toLowerCase() : 'offline';
    const isOnline = ['running', 'online', 'active'].includes(status);
    
    // 解析设备唯一标识（用于小龙虾连接）
    const resolvedDeviceUuid = device.iotDeviceUuid || device.uuid || device.routeDeviceUuid || device.routeDeviceId || '';
    
    return {
      deviceId: device.id || device.sn || '',
      id: device.id || '',
      name: device.name || '未知设备',
      type: device.type || '',
      sn: device.sn || '',
      uuid: device.uuid || '',
      // 设备唯一标识 (用于小龙虾连接)
      iotDeviceUuid: device.iotDeviceUuid || '',
      routeDeviceUuid: device.routeDeviceUuid || '',
      routeDeviceId: device.routeDeviceId || '',
      // 统一的设备标识（用于小龙虾连接）
      resolvedDeviceUuid: resolvedDeviceUuid,
      // 设备状态: API 返回 status 为 running/online/active 表示在线
      isOnline: isOnline,
      // 原始状态值
      status: status,
      // manageState 字段
      manageState: device.manageState || '',
      // 在线时间
      onlineTime: device.onlineTime || '',
      offlineTime: device.offlineTime || '',
      // 任务状态（后端暂无），统一 fallback
      taskStatus: '空闲中',
      // AI模型（后端model字段是产品型号，非AI模型）
      currentModel: '--',
      // 信号/电量百分比
      networkStatus: device.percentage ? `${device.percentage}%` : '--',
      // 租用开始时间
      bindTime: device.rentStartDate || '',
      // 租用到期时间
      rentEndDate: device.rentEndDate || '',
      // 最近在线时间
      lastSeen: device.onlineTime ? new Date(device.onlineTime).toISOString() : '',
      // 固件版本
      firmwareVersion: device.firmwareVersion || '--',
      // 硬件版本
      hardwareVersion: device.hardwareVersion || '--',
      // 设备地址
      address: device.address || '--',
      // 绑定状态
      bindStatus: device.bindStatus || 'bound',
      // 技能数量（后端暂无）
      skills: 0,
      // 设备统计
      deviceCount: totalCount,
      onlineCount: 1
    };
  },

  /**
   * 获取当前设备数据
   * @returns {Object} 设备数据
   */
  getDevice() {
    // 优先使用 Storage 中的真实设备，不使用 defaultDevice 兜底
    const device = Storage.Device.getCurrentDevice();
    if (device && device.id) {
      return device;
    }
    // 只有在 Storage 中完全没有设备时才返回空（不再使用 defaultDevice）
    return null;
  },

  /**
   * 设置设备数据
   * @param {Object} deviceData 设备数据
   */
  setDevice(deviceData) {
    Storage.Device.setCurrentDevice(deviceData);
    // 触发设备状态更新事件
    window.dispatchEvent(new CustomEvent('deviceStatusChanged', {
      detail: deviceData
    }));
  },

  /**
   * 更新设备状态
   * @param {string} status 状态值
   */
  updateStatus(status) {
    const device = this.getDevice();
    device.status = status;
    device.isOnline = status === this.STATUS.ONLINE || status === this.STATUS.BUSY;
    device.lastSeen = new Date().toISOString();
    this.setDevice(device);
  },

  /**
   * 更新设备任务状态
   * @param {string} taskStatus 任务状态
   */
  updateTaskStatus(taskStatus) {
    const device = this.getDevice();
    device.taskStatus = taskStatus;
    device.status = taskStatus === this.TASK_STATUS.IDLE ? this.STATUS.ONLINE : this.STATUS.BUSY;
    this.setDevice(device);
  },

  /**
   * 更新当前模型
   * @param {string} model 模型名称
   */
  updateModel(model) {
    const device = this.getDevice();
    device.currentModel = model;
    this.setDevice(device);
  },

  /**
   * 获取设备状态显示文本
   * @param {Object} device 设备数据
   * @returns {string} 状态文本
   */
  getStatusText(device) {
    if (!device) return '未绑定';
    if (!device.isOnline) return '离线';
    return '在线';
  },

  /**
   * 获取设备状态颜色变量
   * @param {Object} device 设备数据
   * @returns {string} CSS 颜色变量
   */
  getStatusColor(device) {
    if (!device || !device.isOnline) return 'var(--text-tertiary)';
    if (device.status === this.STATUS.BUSY) return 'var(--warning)';
    if (device.status === this.STATUS.ERROR) return 'var(--error)';
    return 'var(--success)';
  },

  /**
   * 获取设备状态样式类
   * @param {Object} device 设备数据
   * @returns {string} CSS 类名
   */
  getStatusClass(device) {
    if (!device || !device.isOnline) return 'offline';
    if (device.status === this.STATUS.BUSY) return 'busy';
    if (device.status === this.STATUS.ERROR) return 'error';
    return 'online';
  },

  /**
   * 渲染首页设备卡
   */
  renderHomeDeviceCard() {
    const device = this.getDevice();

    // 更新设备名称
    const nameEl = document.getElementById('deviceNameDisplay');
    if (nameEl) {
      nameEl.textContent = device.name;
    }

    // 更新状态胶囊
    const statusPill = document.getElementById('deviceStatusPill');
    const statusDot = document.getElementById('deviceStatusDot');
    const statusText = document.getElementById('deviceStatusText');

    if (statusPill && statusDot && statusText) {
      const statusClass = this.getStatusClass(device);
      statusPill.className = `status-pill ${statusClass}`;
      statusDot.style.background = this.getStatusColor(device);
      statusText.textContent = this.getStatusText(device);
      statusText.style.color = this.getStatusColor(device);
    }

    // 更新设备统计
    const countEl = document.querySelector('.device-count');
    if (countEl) {
      countEl.textContent = `共 ${device.deviceCount} 台设备 · ${device.onlineCount} 台在线`;
    }

    // 更新任务
    const taskEl = document.querySelector('.current-task');
    if (taskEl) {
      taskEl.textContent = device.taskStatus;
    }

    // 更新算力消耗
    const modelEl = document.querySelector('.current-model');
    if (modelEl) {
      if (device.tcBalance !== undefined && device.tcBalance !== null) {
        modelEl.textContent = this._formatTcValue(device.tcBalance);
      } else {
        modelEl.textContent = '--';
      }
    }

    // 更新首页设备卡片扩展信息
    const networkStatusEl = document.getElementById('homeNetworkStatus');
    if (networkStatusEl) {
      this.updateNetworkSignal(networkStatusEl, device.percentage);
    }

    const deviceSnEl = document.getElementById('homeDeviceSn');
    if (deviceSnEl) {
      const sn = device.sn || device.deviceId || '--';
      deviceSnEl.textContent = sn.length > 8 ? sn.substring(0, 8) + '...' : sn;
    }

    const rentEndEl = document.getElementById('homeRentEnd');
    if (rentEndEl) {
      if (device.rentEndDate) {
        const date = new Date(device.rentEndDate);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        rentEndEl.textContent = `${month}-${day}`;
      } else {
        rentEndEl.textContent = '--';
      }
    }
  },

  /**
   * 渲染设备页状态
   */
  renderDevicePage() {
    const device = this.getDevice();

    // 更新设备名称
    const nameEl = document.querySelector('.device-name');
    if (nameEl) {
      nameEl.textContent = device.name;
    }

    // 更新设备ID（优先显示序列号 sn）
    const idEl = document.querySelector('.device-id');
    if (idEl) {
      idEl.textContent = device.sn || device.deviceId || '--';
    }

    // 更新状态 - 使用ID选择器
    const statusEl = document.getElementById('devicePageStatus');
    if (statusEl) {
      statusEl.textContent = this.getStatusText(device);
      statusEl.style.color = device.isOnline ? 'white' : 'rgba(255,255,255,0.5)';
      statusEl.className = `status-value ${this.getStatusClass(device)}`;
    }

    // 更新当前任务 - 使用ID选择器
    const taskEl = document.getElementById('devicePageTask');
    if (taskEl) {
      taskEl.textContent = device.taskStatus;
    }

    // 更新使用模型 - 使用ID选择器
    const modelEl = document.getElementById('devicePageModel');
    if (modelEl) {
      const arrowSvg = modelEl.querySelector('svg');
      modelEl.textContent = device.currentModel + ' ';
      if (arrowSvg) {
        modelEl.appendChild(arrowSvg);
      }
    }

    // 更新信号强度显示
    const signalEl = document.querySelector('.device-signal');
    if (signalEl) {
      // 根据设备在线状态和信号百分比设置信号强度
      let signalLevel = 'offline';
      if (device.isOnline) {
        const percent = parseInt(device.percentage) || 0;
        if (percent >= 76) signalLevel = 'strong';
        else if (percent >= 26) signalLevel = 'medium';
        else signalLevel = 'weak';
      }
      signalEl.setAttribute('data-signal', signalLevel);
    }

    // 更新设备详情扩展信息
    const snEl = document.getElementById('devicePageSn');
    if (snEl) {
      snEl.textContent = device.sn || device.deviceId || '--';
    }

    const rentEndEl = document.getElementById('devicePageRentEnd');
    if (rentEndEl) {
      rentEndEl.textContent = device.rentEndDate ? this._formatDate(device.rentEndDate) : '--';
    }

    const firmwareEl = document.getElementById('devicePageFirmware');
    if (firmwareEl) {
      firmwareEl.textContent = device.firmwareVersion || '--';
    }

    const hardwareEl = document.getElementById('devicePageHardware');
    if (hardwareEl) {
      hardwareEl.textContent = device.hardwareVersion || '--';
    }

    const addressEl = document.getElementById('devicePageAddress');
    if (addressEl) {
      addressEl.textContent = device.address || '--';
    }
  },

  /**
   * 格式化日期
   * @param {string} dateStr - 日期字符串
   * @returns {string} 格式化后的日期
   */
  _formatDate(dateStr) {
    if (!dateStr) return '--';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateStr;
    }
  },

  /**
   * 渲染我的页设备状态
   */
  renderProfilePage() {
    const device = this.getDevice();
    const deviceStatusEl = document.getElementById('deviceStatus');

    if (deviceStatusEl) {
      if (device.bindStatus === 'bound') {
        const statusClass = this.getStatusClass(device);
        deviceStatusEl.className = `status-pill ${statusClass}`;
        deviceStatusEl.innerHTML = `
          <span style="width: 5px; height: 5px; background: currentColor; border-radius: 50%;"></span>
          ${device.isOnline ? '已绑定' : '离线'}
        `;
        deviceStatusEl.style.color = this.getStatusColor(device);
      } else {
        const statusMap = { none: '未绑定', pending: '绑定中' };
        deviceStatusEl.className = 'status-pill';
        deviceStatusEl.textContent = statusMap[device.bindStatus] || '未知';
        deviceStatusEl.style.color = 'var(--text-tertiary)';
      }
    }
  },

  /**
   * 获取设备详情（从真实API）
   * @param {string} deviceId - 设备ID
   * @returns {Promise<Object>}
   */
  async getDeviceDetail(deviceId) {
    try {
      const response = await Api.Device.getDetail(deviceId);
      console.log('[DeviceManager] 设备详情响应:', response);

      if (response.success && response.data) {
        const device = this._normalizeDevice(response.data);
        this.setDevice(device);
        return device;
      }
    } catch (error) {
      console.error('[DeviceManager] 获取设备详情失败:', error);
    }
    return null;
  },

  /**
   * 获取设备事件列表
   * @param {string} deviceId - 设备ID
   * @param {number} pageNum - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>}
   */
  async getDeviceEvents(deviceId, pageNum = 1, pageSize = 10) {
    try {
      const requestBody = { pageNumber: pageNum, pageSize };
      const response = await Api.Device.getEvents(deviceId, requestBody);
      console.log('[DeviceManager] 设备事件响应:', response);

      if (response.success) {
        return response.data?.rows || [];
      }
    } catch (error) {
      console.error('[DeviceManager] 获取设备事件失败:', error);
    }
    return [];
  },

  /**
   * 获取设备算力消耗记录
   * @param {string} deviceId - 设备ID
   * @param {number} pageNum - 页码
   * @param {number} pageSize - 每页数量
   * @returns {Promise<Array>}
   */
  async getDeviceTcRecords(deviceId, pageNum = 1, pageSize = 10) {
    try {
      const requestBody = { pageNumber: pageNum, pageSize };
      const response = await Api.Device.getTcPage(deviceId, requestBody);
      console.log('[DeviceManager] 设备算力记录响应:', response);

      if (response && (response.success === true || response.code === '0' || response.code === 0)) {
        const rows = response.data?.rows || response.rows || [];
        return rows;
      }
    } catch (error) {
      console.error('[DeviceManager] 获取设备算力记录失败:', error);
    }
    return [];
  },

  /**
   * 执行设备操作
   * @param {string} deviceId - 设备ID
   * @param {string} action - 操作类型 (restart/reboot/scan/sync/diagnose)
   * @returns {Promise<Object>}
   */
  async doDeviceAction(deviceId, action) {
    try {
      const response = await Api.Device.doAction(deviceId, action);
      console.log(`[DeviceManager] 设备操作(${action})响应:`, response);
      return response;
    } catch (error) {
      console.error(`[DeviceManager] 设备操作(${action})失败:`, error);
      throw error;
    }
  },

  /**
   * 解绑设备
   * @param {string} deviceId - 设备ID
   * @returns {Promise<Object>}
   */
  async unbindDevice(deviceId) {
    try {
      const response = await Api.Device.unbindRentUser(deviceId);
      console.log('[DeviceManager] 解绑设备响应:', response);
      return response;
    } catch (error) {
      console.error('[DeviceManager] 解绑设备失败:', error);
      throw error;
    }
  },

  /**
   * 绑定承租用户设备
   * @param {Object} bindData - 绑定数据
   * @param {string} bindData.deviceId - 设备ID
   * @param {string} bindData.userId - 用户ID
   * @returns {Promise<Object>}
   */
  async bindDevice(bindData) {
    try {
      const response = await Api.Device.bindRentUser(bindData);
      console.log('[DeviceManager] 绑定设备响应:', response);
      return response;
    } catch (error) {
      console.error('[DeviceManager] 绑定设备失败:', error);
      throw error;
    }
  },

  /**
   * 模拟设备状态变化（用于测试）
   */
  simulateStatusChange() {
    const device = this.getDevice();
    const statuses = [this.STATUS.ONLINE, this.STATUS.OFFLINE, this.STATUS.BUSY];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    this.updateStatus(randomStatus);
    console.log('[DeviceManager] 模拟状态变化:', randomStatus);
  },

  /**
   * 更新网络信号指示器
   * @param {HTMLElement} container - 信号格容器元素
   * @param {number|string} percentage - 信号百分比 0-100
   */
  updateNetworkSignal(container, percentage) {
    if (!container) return;

    const percent = parseInt(percentage) || 0;
    const bars = container.querySelectorAll('.signal-bar');

    if (bars.length === 0) return;

    // 根据百分比计算信号强度
    // 0-25%: 1格, 26-50%: 2格, 51-75%: 3格, 76-100%: 4格
    let activeBars = 1;
    if (percent >= 76) activeBars = 4;
    else if (percent >= 51) activeBars = 3;
    else if (percent >= 26) activeBars = 2;

    // 信号颜色：强(绿)、中(黄)、弱(红/灰)
    const strongColor = 'var(--success, #10B981)';
    const mediumColor = percent >= 26 ? 'var(--warning, #F59E0B)' : 'var(--text-tertiary, #94A3B8)';
    const weakColor = 'var(--text-tertiary, #94A3B8)';

    bars.forEach((bar, index) => {
      if (index < activeBars) {
        // 活跃的信号格
        if (activeBars >= 3) {
          bar.style.background = strongColor;
        } else if (activeBars === 2) {
          bar.style.background = mediumColor;
        } else {
          bar.style.background = weakColor;
        }
        bar.style.opacity = '1';
      } else {
        // 不活跃的信号格
        bar.style.background = 'var(--text-tertiary, #94A3B8)';
        bar.style.opacity = '0.3';
      }
    });
  },

  /**
   * 格式化算力消耗值
   * @param {number} value - 算力余额数值
   * @returns {string}
   */
  _formatTcValue(value) {
    if (value === undefined || value === null) return '--';
    const num = Number(value);
    if (isNaN(num)) return '--';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(1);
  },

  /**
   * 获取设备技能列表（从小龙虾API）
   * @param {string} deviceId - 设备ID
   * @returns {Promise<Array>}
   */
  async getDeviceSkills(deviceId) {
    try {
      if (!deviceId) {
        console.warn('[DeviceManager] getDeviceSkills: deviceId is null');
        return [];
      }

      const response = await Api.OPENCLAW.listSkills(deviceId);
      console.log('[DeviceManager] 设备技能响应:', response);

      // 提取技能数组
      let skills = [];
      if (response.payload && Array.isArray(response.payload.skills)) {
        skills = response.payload.skills;
      } else if (response.data && response.data.payload && Array.isArray(response.data.payload.skills)) {
        skills = response.data.payload.skills;
      }

      // 过滤掉已停用的技能，并返回前4个
      const activeSkills = skills.filter(skill => !skill.disabled).slice(0, 4);
      return activeSkills;
    } catch (error) {
      console.error('[DeviceManager] 获取设备技能失败:', error);
      // 返回假数据作为fallback
      return [
        { skillKey: 'document', name: '文档处理', disabled: false },
        { skillKey: 'data', name: '数据分析', disabled: false },
        { skillKey: 'image', name: '图像识别', disabled: false },
        { skillKey: 'voice', name: '语音识别', disabled: false }
      ];
    }
  }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  DeviceManager.init();
});

// 导出到全局
window.DeviceManager = DeviceManager;

// 监听存储变化，同步更新
window.addEventListener('storage', (e) => {
  if (e.key === 'device_current') {
    console.log('[DeviceManager] 设备数据已更新');
    // 重新渲染当前页面
    DeviceManager.renderHomeDeviceCard();
    DeviceManager.renderDevicePage();
    DeviceManager.renderProfilePage();
  }
});
