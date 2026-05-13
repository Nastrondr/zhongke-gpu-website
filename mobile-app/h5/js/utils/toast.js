// Toast 通知工具 - 统一风格
// 用法: Toast.show('操作成功', 'success'), Toast.show('加载中...', 'loading')

const Toast = {
  show(message, type = 'info', duration = 2500) {
    // 移除旧 toast
    const oldToast = document.querySelector('.app-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    const accentColors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      loading: '#6366F1'
    };
    const accent = accentColors[type] || accentColors.info;
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const isHtmlDark = document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('theme-dark');
    const isDarkMode = isDark || isHtmlDark;

    toast.className = 'app-toast app-toast--' + type;
    toast.style.cssText = `
      position: fixed;
      top: calc(16px + env(safe-area-inset-top));
      left: 50%;
      right: auto;
      bottom: auto;
      width: max-content;
      min-width: 220px;
      max-width: calc(100vw - 32px);
      margin: 0;
      transform: translate3d(-50%, -10px, 0);
      opacity: 0;
      pointer-events: none;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 16px;
      transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1), transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      --toast-accent: ${accent};
      ${isDarkMode ? `
        background: rgba(15, 23, 42, 0.95);
        color: #F8FAFC;
        border: 1px solid rgba(148, 163, 184, 0.18);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.34), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
      ` : `
        background: rgba(255, 255, 255, 0.95);
        color: #0F172A;
        border: 1px solid rgba(226, 232, 240, 0.92);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12), 0 1px 0 rgba(255, 255, 255, 0.70) inset;
      `}
    `;

    const isLoading = type === 'loading';
    const content = isLoading 
      ? `<span class="app-toast-spinner"></span> ${message}`
      : message;

    toast.innerHTML = `<span class="app-toast-message">${content}</span>`;

    // 直接挂载到 body
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate3d(-50%, 0, 0)';
      toast.style.pointerEvents = 'auto';
    });

    if (type !== 'loading') {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate3d(-50%, -10px, 0)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  },

  hideAll() {
    document.querySelectorAll('.app-toast').forEach(t => t.remove());
  },

  loading(message = '加载中...') {
    return this.show(message, 'loading', 0);
  },

  success(message, duration = 2500) {
    return this.show(message, 'success', duration);
  },

  error(message, duration = 2500) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration = 2500) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration = 2500) {
    return this.show(message, 'info', duration);
  }
};

// Button Loading 工具
const ButtonLoading = {
  set(btn, loading, text) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.classList.add('btn-loading');
      if (text) btn.dataset.originalText = btn.textContent || btn.innerText;
    } else {
      btn.classList.remove('btn-loading');
      if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    }
  }
};

// 添加按钮状态样式
const btnStateStyle = document.createElement('style');
btnStateStyle.textContent = `
  .btn-loading { opacity: 0.7; pointer-events: none; }
  .btn-loading::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 6px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .btn-success { background: #10B981 !important; }
  .btn-error { background: #EF4444 !important; opacity: 1 !important; }
`;
document.head.appendChild(btnStateStyle);

// Toast 样式
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .app-toast {
    position: fixed;
    top: calc(16px + env(safe-area-inset-top));
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translate3d(-50%, 0, 0);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .app-toast-message {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.45;
    letter-spacing: 0.01em;
    min-width: 0;
    overflow-wrap: break-word;
    white-space: normal;
    text-align: center;
  }
  .app-toast--loading .app-toast-message {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .app-toast-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(99, 102, 241, 0.24);
    border-top-color: #6366F1;
    border-radius: 999px;
    animation: appToastSpin 780ms linear infinite;
  }
  @keyframes appToastSpin { to { transform: rotate(360deg); } }
  .app-toast--success { --toast-accent: #10B981; }
  .app-toast--error { --toast-accent: #EF4444; }
  .app-toast--warning { --toast-accent: #F59E0B; }
  .app-toast--info { --toast-accent: #3B82F6; }
  .app-toast--loading { --toast-accent: #6366F1; }
`;
document.head.appendChild(toastStyle);

// 全局方法
window.Toast = Toast;
window.ButtonLoading = ButtonLoading;
window.AppToast = {
  show(message, options = {}) {
    const type = options.type || 'info';
    const duration = options.duration || 2500;
    Toast.show(message, type, duration);
  },
  success(message, duration) { Toast.success(message, duration); },
  error(message, duration) { Toast.error(message, duration); },
  warning(message, duration) { Toast.warning(message, duration); },
  info(message, duration) { Toast.info(message, duration); },
  loading(message) { Toast.loading(message); }
};