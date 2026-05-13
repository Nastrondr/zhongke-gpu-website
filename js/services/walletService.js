/**
 * walletService.js - 词元钱包相关 Service 层
 *
 * 职责：
 * - 提供钱包余额、收支、趋势等数据查询
 * - 读取 window.WalletMock 获取 mock 数据
 *
 * 页面以后应调用此服务，而不是直接读 mock/wallet.js
 */

const WalletService = {
  /**
   * 获取完整钱包数据
   * @returns {Promise<Object>}
   */
  async getWalletData() {
    if (window.WalletMock) {
      return await window.WalletMock.getWalletData();
    }
    return null;
  },

  /**
   * 获取余额信息
   * @returns {Promise<Object>}
   */
  async getBalance() {
    if (window.WalletMock) {
      return await window.WalletMock.getBalance();
    }
    return null;
  },

  /**
   * 获取今日收支统计
   * @returns {Promise<Object>}
   */
  async getTodayStats() {
    if (window.WalletMock) {
      return await window.WalletMock.getTodayStats();
    }
    return null;
  },

  /**
   * 获取收入趋势数据
   * @returns {Promise<Array>}
   */
  async getIncomeTrend() {
    if (window.WalletMock) {
      return await window.WalletMock.getIncomeTrend();
    }
    return [];
  },

  /**
   * 获取消耗趋势数据
   * @returns {Promise<Array>}
   */
  async getExpenseTrend() {
    if (window.WalletMock) {
      return await window.WalletMock.getExpenseTrend();
    }
    return [];
  },

  /**
   * 获取消耗细分数据
   * @returns {Promise<Array>}
   */
  async getExpenseBreakdown() {
    if (window.WalletMock) {
      return await window.WalletMock.getExpenseBreakdown();
    }
    return [];
  },

  /**
   * 获取生产量（词元生产相关）
   * @returns {Object}
   */
  getProductionData() {
    if (window.WalletMock) {
      return {
        balance: window.WalletMock.productionBalance,
        unit: window.WalletMock.productionBalanceUnit,
        convert: window.WalletMock.productionConvert,
        today: window.WalletMock.productionToday,
        todayUnit: window.WalletMock.productionTodayUnit
      };
    }
    return null;
  },

  /**
   * 格式化金额显示
   * @param {number} value
   * @param {string} unit
   * @returns {string}
   */
  formatAmount(value, unit) {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value + (unit || '');
  }
};

window.WalletService = WalletService;
