// Toast 通知工具
// 用法: Toast.show('操作成功', 'success'), Toast.show('加载中...', 'loading')

const Toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 2500) {
    this.init();

    const toast = document.createElement('div');
    const bgColors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
      loading: '#6B7280'
    };
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
      loading: ''
    };

    toast.style.cssText = `
      padding: 12px 20px;
      background: ${bgColors[type] || bgColors.info};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      max-width: 280px;
      text-align: center;
    `;

    toast.innerHTML = type === 'loading'
      ? `<span style="width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span> ${message}`
      : `<span>${icons[type] || ''}</span> ${message}`;

    this.container.appendChild(toast);

    // 触发动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // 自动移除
    if (type !== 'loading') {
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    }

    return toast;
  },

  // 隐藏所有 toast
  hideAll() {
    if (!this.container) return;
    this.container.innerHTML = '';
  },

  // Loading 状态
  loading(message = '加载中...') {
    return this.show(message, 'loading', 0);
  },

  success(message, duration = 2500) {
    return this.show(message, 'success', duration);
  },

  error(message, duration = 3000) {
    return this.show(message, 'error', duration);
  },

  warning(message, duration = 2500) {
    return this.show(message, 'warning', duration);
  },

  info(message, duration = 2500) {
    return this.show(message, 'info', duration);
  }
};

// 按钮加载状态工具
const ButtonLoading = {
  // 保存按钮原始状态
  _originalStates: new WeakMap(),

  // 显示按钮加载状态
  show(button, loadingText = '处理中...') {
    if (!button) return;

    // 保存原始状态
    if (!this._originalStates.has(button)) {
      this._originalStates.set(button, {
        text: button.innerHTML,
        disabled: button.disabled
      });
    }

    // 设置加载状态
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: btn-spin 0.6s linear infinite;"></span>
        ${loadingText}
      </span>
    `;
    button.classList.add('btn-loading');

    // 添加旋转动画
    if (!document.getElementById('btn-loading-style')) {
      const style = document.createElement('style');
      style.id = 'btn-loading-style';
      style.textContent = `
        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
        .btn-loading {
          opacity: 0.8;
          cursor: not-allowed;
        }
      `;
      document.head.appendChild(style);
    }
  },

  // 隐藏按钮加载状态
  hide(button) {
    if (!button) return;

    const original = this._originalStates.get(button);
    if (original) {
      button.disabled = original.disabled;
      button.innerHTML = original.text;
      button.classList.remove('btn-loading');
    }
  },

  // 完成后显示成功状态
  success(button, successText = '成功', duration = 1500) {
    if (!button) return;

    const original = this._originalStates.get(button);
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">✓</span>
        ${successText}
      </span>
    `;
    button.classList.add('btn-success');

    setTimeout(() => {
      if (original) {
        button.disabled = original.disabled;
        button.innerHTML = original.text;
        button.classList.remove('btn-success');
      }
    }, duration);
  },

  // 完成后显示错误状态
  error(button, errorText = '失败', duration = 2000) {
    if (!button) return;

    const original = this._originalStates.get(button);
    button.disabled = true;
    button.innerHTML = `
      <span style="display: inline-flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">✕</span>
        ${errorText}
      </span>
    `;
    button.classList.add('btn-error');

    setTimeout(() => {
      if (original) {
        button.disabled = original.disabled;
        button.innerHTML = original.text;
        button.classList.remove('btn-error');
      }
    }, duration);
  },

  // 清除所有按钮状态
  clearAll() {
    // WeakMap 需要手动清理，这里只是移除样式
  }
};

// 添加按钮成功/错误状态样式
const btnStateStyle = document.createElement('style');
btnStateStyle.textContent = `
  .btn-success {
    background: #10B981 !important;
    opacity: 1 !important;
  }
  .btn-error {
    background: #EF4444 !important;
    opacity: 1 !important;
  }
`;
document.head.appendChild(btnStateStyle);

// 添加旋转动画样式
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

// 导出到全局
window.Toast = Toast;
window.ButtonLoading = ButtonLoading;
