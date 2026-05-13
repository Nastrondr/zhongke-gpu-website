/**
 * themeService.js - 主题管理服务
 *
 * 职责：
 * - 管理深色/浅色/跟随系统三种主题模式
 * - 将用户选择持久化到 Storage
 * - 监听系统主题变化（当模式为 system 时）
 * - 应用主题到页面根节点 (html[data-theme])
 *
 * 页面应调用此服务，而不是直接操作 localStorage 或 DOM
 */

const ThemeManager = {
  STORAGE_KEY: 'app_theme_mode',

  MODES: {
    SYSTEM: 'system',
    LIGHT: 'light',
    DARK: 'dark'
  },

  chartInstances: [],

  /**
   * 获取当前主题模式
   * @returns {string} 'system' | 'light' | 'dark'
   */
  getMode() {
    return Storage.get(this.STORAGE_KEY) || this.MODES.SYSTEM;
  },

  /**
   * 获取实际生效的主题（resolve system 模式）
   * @returns {string} 'light' | 'dark'
   */
  getResolvedMode() {
    const mode = this.getMode();
    if (mode === this.MODES.SYSTEM) {
      return this._getSystemTheme();
    }
    return mode;
  },

  /**
   * 获取系统主题
   * @returns {string} 'light' | 'dark'
   */
  _getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.MODES.DARK;
    }
    return this.MODES.LIGHT;
  },

  /**
   * 设置主题模式
   * @param {string} mode - 'system' | 'light' | 'dark'
   */
  setMode(mode) {
    if (!Object.values(this.MODES).includes(mode)) {
      console.warn('[ThemeManager] Invalid mode:', mode);
      return;
    }
    Storage.set(this.STORAGE_KEY, mode);
    this._applyTheme();
  },

  /**
   * 应用主题到页面根节点
   */
  _applyTheme() {
    const mode = this.getMode();
    const resolvedMode = this.getResolvedMode();

    const html = document.documentElement;
    html.setAttribute('data-theme', resolvedMode);
    html.setAttribute('data-theme-mode', mode);

    this._updateChartTheme();
  },

  /**
   * 监听系统主题变化
   */
  _watchSystemTheme() {
    if (!window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.getMode() === this.MODES.SYSTEM) {
        this._applyTheme();
      }
    });
  },

  /**
   * 更新图表主题
   */
  _updateChartTheme() {
    const resolvedMode = this.getResolvedMode();
    const isDark = resolvedMode === this.MODES.DARK;

    const theme = isDark ? {
      gridColor: 'rgba(148, 163, 184, 0.10)',
      tooltipBg: '#16233D',
      tooltipTitle: '#F8FAFC',
      tooltipBody: '#CBD5E1',
      borderColor: 'rgba(96, 165, 250, 0.28)',
      tickColor: '#94A3B8'
    } : {
      gridColor: 'rgba(100, 116, 139, 0.08)',
      tooltipBg: '#FFFFFF',
      tooltipTitle: '#0F172A',
      tooltipBody: '#334155',
      borderColor: 'rgba(59, 130, 246, 0.18)',
      tickColor: '#64748B'
    };

    this.chartInstances.forEach(chart => {
      if (chart && typeof chart.update === 'function') {
        try {
          this._applyChartTheme(chart, theme);
        } catch (e) {
          console.warn('[ThemeManager] 图表主题更新失败:', e);
        }
      }
    });
  },

  /**
   * 为单个图表应用主题
   * @param {Chart} chart
   * @param {Object} theme
   */
  _applyChartTheme(chart, theme) {
    if (!chart || !chart.options) return;
    
    // 安全地更新刻度颜色
    if (chart.options.scales) {
      Object.keys(chart.options.scales).forEach(axis => {
        const scale = chart.options.scales[axis];
        if (scale && typeof scale === 'object') {
          // 确保 grid 对象存在
          if (!scale.grid) scale.grid = {};
          scale.grid.color = theme.gridColor;
          
          // 确保 ticks 对象存在
          if (!scale.ticks) scale.ticks = {};
          scale.ticks.color = theme.tickColor;
        }
      });
    }

    // 安全地更新 tooltip 样式
    if (chart.options.plugins && chart.options.plugins.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
      chart.options.plugins.tooltip.titleColor = theme.tooltipTitle;
      chart.options.plugins.tooltip.bodyColor = theme.tooltipBody;
      chart.options.plugins.tooltip.borderColor = theme.borderColor;
    }

    chart.update('none');
  },

  /**
   * 初始化主题系统
   */
  init() {
    this._watchSystemTheme();
    this._applyTheme();
  },

  /**
   * 注册图表实例以便主题更新时同步
   * @param {Chart} chart
   */
  registerChart(chart) {
    if (chart && typeof chart.update === 'function') {
      this.chartInstances.push(chart);
    }
  }
};

window.ThemeManager = ThemeManager;
