/**
 * userService.js - 用户相关 Service 层
 *
 * 职责：
 * - 整合 Storage.Auth 运行时状态（登录态、用户信息）
 * - 提供统一的用户状态查询与登录登出接口
 * - 读取 window.UserMock 获取 mock 数据
 *
 * 页面以后应调用此服务，而不是直接读 mock/user.js 或 Storage.Auth
 */

const UserService = {
  /**
   * 检查用户是否已登录
   * @returns {boolean}
   */
  isLoggedIn() {
    return Storage.Auth.isLoggedIn();
  },

  /**
   * 获取当前登录用户信息
   * @returns {Object|null}
   */
  getCurrentUser() {
    const user = Storage.Auth.getCurrentUser();
    if (user) {
      return {
        username: user,
        accountData: Storage.Auth.getAccountData()
      };
    }
    return null;
  },

  /**
   * 获取用户 profile（不含敏感信息）
   * @returns {Promise<Object>}
   */
  async getUserProfile() {
    const currentUser = this.getCurrentUser();
    if (currentUser && window.UserMock) {
      const profile = await window.UserMock.getUserProfile();
      return {
        ...profile,
        username: currentUser.username
      };
    }
    if (window.UserMock) {
      return await window.UserMock.getUserProfile();
    }
    return { username: '未登录', accountId: '', avatar: '?' };
  },

  /**
   * 获取用户权限列表
   * @returns {Promise<Object>}
   */
  async getPermissions() {
    if (window.UserMock) {
      return await window.UserMock.getPermissions();
    }
    return {};
  },

  /**
   * 检查用户是否有指定权限
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (window.UserMock) {
      return window.UserMock.hasPermission(permission);
    }
    return false;
  },

  /**
   * 执行登录（由登录页调用）
   * @param {Object} accountData - 账号完整数据
   * @param {boolean} rememberMe - 是否记住登录
   * @returns {boolean}
   */
  login(accountData, rememberMe) {
    if (rememberMe) {
      Storage.Auth.setLoggedIn(true, false);
      Storage.Auth.setCurrentUser(accountData.username, false);
      Storage.Auth.setAccountData(accountData);
      Storage.set('auth_login_user', accountData.username);
    } else {
      Storage.Auth.setLoggedIn(true, true);
      Storage.Auth.setCurrentUser(accountData.username, true);
      Storage.setSession('auth_account_data', accountData);
    }
    return true;
  },

  /**
   * 执行登出
   */
  logout() {
    Storage.Auth.logout();
  },

  /**
   * 获取账号绑定状态
   * @returns {string|null} - none/pending/bound
   */
  getBindStatus() {
    const accountData = Storage.Auth.getAccountData();
    return accountData ? accountData.bindStatus : null;
  }
};

window.UserService = UserService;
