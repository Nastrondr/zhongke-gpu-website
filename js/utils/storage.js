/**
 * storage.js - 本地存储工具层
 *
 * 统一封装 localStorage/sessionStorage 操作
 * 未来迁移微信小程序时，只需替换底层实现，上层调用无需改变
 *
 * 命名空间前缀约定：
 * - app_*: 应用全局数据
 * - auth_*: 登录认证相关
 * - device_*: 设备相关
 * - model_*: 模型相关
 * - skill_*: 技能相关
 * - task_*: 任务相关
 * - wallet_*: 钱包相关
 */

const Storage = {
  /**
   * 获取数据
   * @param {string} key - 存储键名（不含前缀）
   * @param {*} defaultValue - 默认值
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (e) {
      console.error(`[Storage] get error: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * 保存数据
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值
   * @returns {boolean}
   */
  set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`[Storage] set error: ${key}`, e);
      return false;
    }
  },

  /**
   * 移除指定键
   * @param {string} key - 存储键名
   * @returns {boolean}
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[Storage] remove error: ${key}`, e);
      return false;
    }
  },

  /**
   * 清空指定前缀的所有数据
   * @param {string} prefix - 前缀名，如 'auth_' / 'device_'
   * @returns {boolean}
   */
  clearByPrefix(prefix) {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      keys.forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) {
      console.error(`[Storage] clearByPrefix error: ${prefix}`, e);
      return false;
    }
  },

  /**
   * 从 sessionStorage 获取数据
   */
  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (e) {
      console.error(`[Storage] getSession error: ${key}`, e);
      return defaultValue;
    }
  },

  /**
   * 保存到 sessionStorage
   */
  setSession(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`[Storage] setSession error: ${key}`, e);
      return false;
    }
  },

  /**
   * 移除 sessionStorage 中的指定键
   */
  removeSession(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[Storage] removeSession error: ${key}`, e);
      return false;
    }
  },

  /**
   * 清空 sessionStorage 中指定前缀的数据
   */
  clearSessionByPrefix(prefix) {
    try {
      const keys = Object.keys(sessionStorage).filter(k => k.startsWith(prefix));
      keys.forEach(k => sessionStorage.removeItem(k));
      return true;
    } catch (e) {
      console.error(`[Storage] clearSessionByPrefix error: ${prefix}`, e);
      return false;
    }
  }
};

// 认证相关快捷方法
Storage.Auth = {
  KEY: 'auth_',

  isLoggedIn() {
    const localResult = !!Storage.get(this.KEY + 'is_logged_in');
    const sessionResult = !!Storage.getSession(this.KEY + 'is_logged_in');
    return localResult || sessionResult;
  },

  setLoggedIn(value, useSession = false) {
    if (useSession) {
      return Storage.setSession(this.KEY + 'is_logged_in', value ? 'true' : 'false');
    }
    return Storage.set(this.KEY + 'is_logged_in', value ? 'true' : 'false');
  },

  getCurrentUser() {
    return Storage.get(this.KEY + 'current_user') || Storage.getSession(this.KEY + 'current_user');
  },

  setCurrentUser(username, useSession = false) {
    if (useSession) {
      return Storage.setSession(this.KEY + 'current_user', username);
    }
    return Storage.set(this.KEY + 'current_user', username);
  },

  getAccountData() {
    return Storage.get(this.KEY + 'account_data') || Storage.getSession(this.KEY + 'account_data');
  },

  setAccountData(data) {
    return Storage.set(this.KEY + 'account_data', data);
  },

  logout() {
    Storage.clearByPrefix(this.KEY);
    Storage.clearSessionByPrefix(this.KEY);
  }
};

// 设备相关快捷方法
Storage.Device = {
  KEY: 'device_',

  getCurrentDevice() {
    return Storage.get(this.KEY + 'current');
  },

  setCurrentDevice(deviceData) {
    return Storage.set(this.KEY + 'current', deviceData);
  },

  getDeviceList() {
    return Storage.get(this.KEY + 'list') || [];
  },

  setDeviceList(list) {
    return Storage.set(this.KEY + 'list', list);
  },

  addDevice(device) {
    const list = this.getDeviceList();
    list.push(device);
    return this.setDeviceList(list);
  },

  clearDevices() {
    Storage.clearByPrefix(this.KEY);
  }
};

// 模型相关快捷方法
Storage.Model = {
  KEY: 'model_',

  getCurrentModel() {
    return Storage.get(this.KEY + 'current');
  },

  setCurrentModel(modelName) {
    return Storage.set(this.KEY + 'current', modelName);
  }
};

// 导出到全局
window.Storage = Storage;
