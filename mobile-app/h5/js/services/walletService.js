/**
 * walletService.js - 词元钱包相关 Service 层
 *
 * 职责：
 * - 对接真实后端 API
 * - 提供钱包余额、收支、趋势等数据查询
 * - 保留 Mock 回退能力
 */

const WalletService = {
  /**
   * 获取完整钱包数据
   * @returns {Promise<Object>}
   */
  async getWalletData() {
    try {
      const response = await Api.Wallet.getOverview();
      if (response && (response.code === '0' || response.success)) {
        const data = response.data;
        return {
          balance: data.balance,
          unit: data.unit,
          convert: data.convert,
          todayIncome: data.todayIncome,
          todayExpense: data.todayExpense,
          totalIncome: data.totalIncome,
          totalExpense: data.totalExpense
        };
      }
    } catch (error) {
      console.error('[WalletService] 获取钱包数据失败:', error);
    }
    if (window.WalletMock) {
      return await window.WalletMock.getWalletData();
    }
    return null;
  },

  /**
   * 获取余额信息
   * @returns {Promise<Object>} { balance, display, unit }
   */
  async getBalance() {
    try {
      const response = await Api.Wallet.getBalance();
      if (response && (response.code === '0' || response.success)) {
        const data = response.data;
        return {
          balance: data.balance,
          unit: data.unit,
          display: this.formatAmount(data.balance, data.unit)
        };
      }
    } catch (error) {
      console.error('[WalletService] 获取余额失败:', error);
    }
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
    try {
      const walletData = await this.getWalletData();
      if (walletData) {
        return {
          todayIncome: walletData.todayIncome,
          todayExpense: walletData.todayExpense
        };
      }
    } catch (error) {
      console.error('[WalletService] 获取今日统计失败:', error);
    }
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
    try {
      const response = await Api.Wallet.getIncomeTrend();
      if (response && (response.code === '0' || response.success)) {
        return response.data || response.rows || [];
      }
    } catch (error) {
      console.error('[WalletService] 获取收入趋势失败:', error);
    }
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
    try {
      const response = await Api.Wallet.getExpenseTrend();
      if (response && (response.code === '0' || response.success)) {
        return response.data || response.rows || [];
      }
    } catch (error) {
      console.error('[WalletService] 获取消耗趋势失败:', error);
    }
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
    try {
      const response = await Api.Wallet.getExpenseBreakdown();
      if (response && (response.code === '0' || response.success)) {
        return response.data || response.rows || [];
      }
    } catch (error) {
      console.error('[WalletService] 获取消耗细分失败:', error);
    }
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
