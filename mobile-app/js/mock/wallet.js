/**
 * wallet.js - 词元钱包相关 Mock 数据
 *
 * 本文件存放词元钱包相关的 mock 数据
 * 后续接入真实后端时，只需修改 getWalletData 等方法的实现
 *
 * 使用方式：通过 <script> 引入后，数据挂在 window.WalletMock 上
 */

window.WalletMock = {
  balance: 2.56,
  balanceUnit: 'M',
  balanceConvert: '¥2.56',

  todayIncome: 12.8,
  todayIncomeUnit: 'K',

  todayExpense: 45.2,
  todayExpenseUnit: 'K',

  weekIncome: 8.2,
  weekExpense: 0.45,

  incomeTrend: [8.2, 9.5, 7.8, 10.2, 9.8, 11.5, 12.8],
  expenseTrend: [35, 42, 28, 48, 38, 52, 45],

  expenseBreakdown: [
    { name: 'DeepSeek-V3', amount: '18.1K', percent: 35 },
    { name: 'FinBERT', amount: '12.2K', percent: 24 },
    { name: 'Fin-T5', amount: '8.9K', percent: 17 },
    { name: '其他', amount: '4.1K', percent: 8 }
  ],

  incomeSources: [
    { name: '任务奖励', amount: '12.6K' },
    { name: '签到奖励', amount: '9.4K' },
    { name: '邀请奖励', amount: '8.1K' }
  ],

  todayHourlyData: [0.6, 0.5, 0.4, 0.5, 1.0, 1.5, 1.8, 2.8, 3.2, 2.5, 2.2, 2.8, 3.0, 3.6, 3.8, 3.2, 2.8, 2.5, 2.2, 1.8, 1.5, 1.2, 1.0, 0.6],

  productionBalance: 45.2,
  productionBalanceUnit: 'K',
  productionConvert: '¥0.05',

  productionToday: 2.56,
  productionTodayUnit: 'M',

  async getWalletData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          balance: this.balance,
          balanceUnit: this.balanceUnit,
          balanceConvert: this.balanceConvert,
          todayIncome: this.todayIncome,
          todayIncomeUnit: this.todayIncomeUnit,
          todayExpense: this.todayExpense,
          todayExpenseUnit: this.todayExpenseUnit,
          incomeTrend: [...this.incomeTrend],
          expenseTrend: [...this.expenseTrend]
        });
      }, 300);
    });
  },

  async getBalance() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          balance: this.balance,
          unit: this.balanceUnit,
          convert: this.balanceConvert
        });
      }, 200);
    });
  },

  async getTodayStats() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          income: { value: this.todayIncome, unit: this.todayIncomeUnit },
          expense: { value: this.todayExpense, unit: this.todayExpenseUnit }
        });
      }, 200);
    });
  },

  async getIncomeTrend() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.incomeTrend]);
      }, 200);
    });
  },

  async getExpenseTrend() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.expenseTrend]);
      }, 200);
    });
  },

  async getExpenseBreakdown() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.expenseBreakdown]);
      }, 200);
    });
  }
};
