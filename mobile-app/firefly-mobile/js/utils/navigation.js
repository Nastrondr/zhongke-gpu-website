/**
 * navigation.js - 页面导航工具层
 *
 * 统一封装页面跳转和返回操作
 * 未来迁移微信小程序时，只需替换底层实现，上层调用无需改变
 */

// 获取应用基础路径（支持子目录部署）
const APP_BASE_PATH = '';

const Navigation = {
  /**
   * 获取完整路径（自动添加基础路径）
   * @param {string} url - 目标页面路径
   * @returns {string}
   */
  getFullPath(url) {
    if (!url) return '';
    // 如果已经是绝对路径，直接返回
    if (url.startsWith('/')) return url;
    // 如果是相对路径，直接返回（所有页面在同一目录）
    return url;
  },

  /**
   * 显示页面跳转过渡效果
   */
  showTransition(message = '加载中...') {
    // 如果已存在，不重复创建
    let overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      return;
    }

    // 创建过渡遮罩
    overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    overlay.innerHTML = `
      <div class="transition-content">
        <div class="transition-spinner"></div>
        <div class="transition-text">${message}</div>
      </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.id = 'page-transition-style';
    style.textContent = `
      #page-transition-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        animation: transition-fade-in 0.2s ease forwards;
      }
      #page-transition-overlay.fade-out {
        animation: transition-fade-out 0.2s ease forwards;
      }
      @keyframes transition-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes transition-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .transition-content {
        text-align: center;
        color: white;
      }
      .transition-spinner {
        width: 36px;
        height: 36px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        margin: 0 auto 12px;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .transition-text {
        font-size: 14px;
        opacity: 0.9;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
  },

  /**
   * 隐藏页面跳转过渡效果
   */
  hideTransition() {
    const overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        const style = document.getElementById('page-transition-style');
        if (style) style.remove();
      }, 200);
    }
  },

  /**
   * 跳转到指定页面（保留当前页历史）- 带过渡效果
   * @param {string} url - 目标页面路径
   * @param {string} loadingText - 过渡显示的文字
   */
  goTo(url, loadingText = '跳转中...') {
    if (!url) {
      console.error('[Navigation] goTo: url is required');
      return;
    }
    this.showTransition(loadingText);
    setTimeout(() => {
      window.location.href = this.getFullPath(url);
    }, 150);
  },

  /**
   * 跳转到指定页面（替换当前页历史，无法返回）- 带过渡效果
   * @param {string} url - 目标页面路径
   * @param {string} loadingText - 过渡显示的文字
   */
  replaceTo(url, loadingText = '跳转中...') {
    if (!url) {
      console.error('[Navigation] replaceTo: url is required');
      return;
    }
    this.showTransition(loadingText);
    setTimeout(() => {
      window.location.replace(this.getFullPath(url));
    }, 150);
  },

  /**
   * 返回上一页
   * @param {number} delta - 返回的页面数，默认为1
   */
  goBack(delta = 1) {
    if (window.history.length > 1) {
      this.showTransition('返回中...');
      setTimeout(() => {
        window.history.go(-delta);
      }, 150);
    } else {
      this.goHome();
    }
  },

  /**
   * 返回首页
   */
  goHome() {
    this.goTo('home.html');
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
    window.open(this.getFullPath(url), name);
  }
};

// 导出到全局
window.Navigation = Navigation;

// 自动清理：页面加载后立即移除过渡遮罩
(function() {
  var overlay = document.getElementById('page-transition-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.remove();
  }
  var style = document.getElementById('page-transition-style');
  if (style) style.remove();
})();

// DOMContentLoaded 再执行一次确保清理
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('page-transition-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.remove();
    }
  });
}
