/**
 * 设备状态管理服务
 * 统一管理设备状态，为接入后端做准备
 */
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

  // 默认设备数据（模拟后端数据）
  defaultDevice: {
    id: 'XY-01-A8F3',
    name: '数字大脑 01',
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
   * 获取当前设备数据
   * @returns {Object} 设备数据
   */
  getDevice() {
    return Storage.Device.getCurrentDevice() || this.defaultDevice;
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

    // 更新任务和模型
    const taskEl = document.querySelector('.current-task');
    const modelEl = document.querySelector('.current-model');

    if (taskEl) {
      taskEl.textContent = device.taskStatus;
    }
    if (modelEl) {
      modelEl.textContent = device.currentModel;
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

    // 更新设备ID
    const idEl = document.querySelector('.device-id');
    if (idEl) {
      idEl.textContent = device.id;
    }

    // 更新状态 - 使用ID选择器
    const statusEl = document.getElementById('devicePageStatus');
    if (statusEl) {
      statusEl.textContent = this.getStatusText(device);
      statusEl.style.color = device.isOnline ? 'white' : 'rgba(255,255,255,0.5)';
      // 更新状态样式类
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
      // 保留后面的箭头图标，只更新文本
      const arrowSvg = modelEl.querySelector('svg');
      modelEl.textContent = device.currentModel + ' ';
      if (arrowSvg) {
        modelEl.appendChild(arrowSvg);
      }
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
   * 从后端同步设备状态（预留接口）
   * @param {string} deviceId 设备ID
   */
  async syncFromBackend(deviceId) {
    // TODO: 接入后端API
    // const response = await fetch(`/api/devices/${deviceId}/status`);
    // const data = await response.json();
    // this.setDevice(data);

    console.log('[DeviceManager] 后端同步预留接口');
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
  }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  DeviceManager.init();
});

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
