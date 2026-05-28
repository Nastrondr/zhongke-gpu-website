/**
 * user.js - 用户相关 Mock 数据
 *
 * 本文件存放用户相关的 mock 数据
 * 后续接入真实后端时，只需修改 getUserProfile 等方法的实现
 *
 * 使用方式：通过 <script> 引入后，数据挂在 window.UserMock 上
 */

window.UserMock = {
  profile: {
    username: 'User_9527',
    accountId: 'ACC-XXXXX',
    email: 'user@example.com',
    avatar: 'U',
    registeredTime: '2026-01-15',
    permissions: {
      canBindDevice: true,
      canSwitchModel: true,
      canExecuteSkill: true,
      canViewWallet: true,
      canTopup: true
    }
  },

  async getUserProfile() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...this.profile });
      }, 200);
    });
  },

  async getPermissions() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...this.profile.permissions });
      }, 200);
    });
  },

  hasPermission(permission) {
    return this.profile.permissions[permission] === true;
  }
};
