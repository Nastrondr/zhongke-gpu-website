/**
 * navigation.js - 页面导航工具层
 *
 * 统一封装页面跳转和返回操作
 * 未来迁移微信小程序时，只需替换底层实现，上层调用无需改变
 */

const Navigation = {
  /**
   * 跳转到指定页面（保留当前页历史）
   * @param {string} url - 目标页面路径
   */
  goTo(url) {
    if (!url) {
      console.error('[Navigation] goTo: url is required');
      return;
    }
    window.location.href = url;
  },

  /**
   * 跳转到指定页面（替换当前页历史，无法返回）
   * @param {string} url - 目标页面路径
   */
  replaceTo(url) {
    if (!url) {
      console.error('[Navigation] replaceTo: url is required');
      return;
    }
    window.location.replace(url);
  },

  /**
   * 返回上一页
   * @param {number} delta - 返回的页面数，默认为1
   */
  goBack(delta = 1) {
    if (window.history.length > 1) {
      window.history.go(-delta);
    } else {
      // 如果没有历史记录，默认返回首页
      this.goTo('mobile-app.html');
    }
  },

  /**
   * 返回首页
   */
  goHome() {
    this.goTo('mobile-app.html');
  },

  /**
   * 获取当前页面完整路径
   * @returns {string}
   */
  getCurrentPath() {
    return window.location.pathname;
  },

  /**
   * 获取当前页面文件名
   * @returns {string}
   */
  getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1);
  },

  /**
   * 打开新窗口/标签页
   * @param {string} url - 目标页面路径
   * @param {string} name - 窗口名称
   */
  openNewTab(url, name = '_blank') {
    if (!url) {
      console.error('[Navigation] openNewTab: url is required');
      return;
    }
    window.open(url, name);
  }
};

// 导出到全局
window.Navigation = Navigation;
