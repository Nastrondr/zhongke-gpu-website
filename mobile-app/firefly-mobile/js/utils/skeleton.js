/**
 * Skeleton 骨架屏工具
 * 用于页面内容加载时显示占位效果
 */

const Skeleton = {
  // 骨架样式
  styleId: 'skeleton-styles',

  // 初始化样式
  initStyle() {
    if (document.getElementById(this.styleId)) return;

    const style = document.createElement('style');
    style.id = this.styleId;
    style.textContent = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
      }
      .skeleton-dark {
        background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
      }
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .skeleton-text {
        height: 14px;
        margin-bottom: 8px;
      }
      .skeleton-text:last-child {
        width: 60%;
      }
      .skeleton-title {
        height: 20px;
        width: 40%;
        margin-bottom: 12px;
      }
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      .skeleton-button {
        height: 36px;
        width: 100px;
        border-radius: 8px;
      }
      .skeleton-card {
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 12px;
      }
      .skeleton-line {
        height: 12px;
        margin-bottom: 8px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  },

  // 创建文本骨架
  createText(lines = 3) {
    this.initStyle();
    const container = document.createElement('div');
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton skeleton-text';
      container.appendChild(line);
    }
    return container;
  },

  // 创建卡片骨架
  createCard(options = {}) {
    this.initStyle();
    const {
      avatar = false,
      title = true,
      lines = 3,
      avatarSize = 40
    } = options;

    const card = document.createElement('div');
    card.className = 'skeleton skeleton-card';

    if (avatar) {
      const avatarEl = document.createElement('div');
      avatarEl.className = 'skeleton skeleton-avatar';
      avatarEl.style.width = avatarSize + 'px';
      avatarEl.style.height = avatarSize + 'px';
      avatarEl.style.float = 'left';
      avatarEl.style.marginRight = '12px';
      card.appendChild(avatarEl);
    }

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'skeleton skeleton-title';
      card.appendChild(titleEl);
    }

    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton skeleton-line';
      line.style.width = (Math.random() * 30 + 70) + '%';
      card.appendChild(line);
    }

    return card;
  },

  // 创建列表骨架
  createList(count = 3, options = {}) {
    this.initStyle();
    const container = document.createElement('div');
    for (let i = 0; i < count; i++) {
      container.appendChild(this.createCard(options));
    }
    return container;
  },

  // 显示骨架屏遮罩
  showOverlay(container, options = {}) {
    const {
      opacity = 0.8,
      bgColor = 'rgba(255,255,255,0.9)'
    } = options;

    this.initStyle();

    const overlay = document.createElement('div');
    overlay.className = 'skeleton-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      opacity: ${opacity};
    `;

    const content = document.createElement('div');
    content.style.cssText = 'width: 80%; max-width: 300px;';
    content.appendChild(this.createList(2, { avatar: true, title: true, lines: 2 }));

    overlay.appendChild(content);
    container.style.position = 'relative';
    container.appendChild(overlay);

    return overlay;
  },

  // 隐藏骨架屏遮罩
  hideOverlay(overlay) {
    if (overlay && overlay.remove) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  },

  // 为元素添加骨架屏效果
  wrapWithSkeleton(element, options = {}) {
    const overlay = this.showOverlay(element, options);
    return {
      hide: () => this.hideOverlay(overlay),
      element: element,
      overlay: overlay
    };
  }
};

// 导出到全局
window.Skeleton = Skeleton;
