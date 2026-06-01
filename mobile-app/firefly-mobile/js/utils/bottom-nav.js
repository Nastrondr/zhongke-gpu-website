// 获取当前文件名
function getCurrentFilename() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  if (!filename || filename === '') {
    return 'home.html';
  }
  // 如果文件名没有扩展名，默认为 home.html
  if (!filename.includes('.')) {
    return 'home.html';
  }
  return filename;
}

// 底部导航配置
const bottomNavConfig = {
  items: [
    { id: 'home', page: 'home.html', label: '首页', icon: 'home', target: 'page-home' },
    { id: 'apps', page: 'home.html', label: '应用', icon: 'apps', target: 'page-apps' },
    { id: 'whale', page: 'whale-chat.html', label: '聊天', icon: 'whale' },
    { id: 'profile', page: 'home.html', label: '我的', icon: 'user', target: 'page-profile' }
  ]
};

// 页面到 tab 的映射
const pageToTabMap = {
  'index.html': 'home',
  'home.html': 'home',
  'whale-chat.html': 'whale',
  'profile.html': 'profile',
  'user.html': 'profile'
};

// tab id 到索引的映射
const tabIdToIndexMap = {
  'home': 0,
  'apps': 1,
  'whale': 2,
  'profile': 3
};

// 图标 SVG（两套：线性 inactive，面性 active）
const navIcons = {
  home: {
    inactive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
    active: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>`
  },
  apps: {
    inactive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" ry="1.5"/>
    </svg>`,
    active: `<svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" ry="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" ry="1.5"/>
    </svg>`
  },
  whale: {
    inactive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`,
    active: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`
  },
  user: {
    inactive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
    active: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`
  }
};

// 当前激活的 tab 索引
let currentActiveIndex = 0;

// 初始化底部导航
function initBottomNav() {
  console.log('[BottomNav] initBottomNav called, readyState:', document.readyState);
  
  const filename = getCurrentFilename();
  
  // 以下页面不显示底部导航栏（次级页面）
  const noNavPages = [
    'device-chat.html', 'whale-chat.html',
    'device.html', 'model-skill.html', 'model-switch.html', 'skill-execute.html', 'mobile-diagnosis.html',
    'task-center.html', 'token-production.html', 'topup.html', 'token-overview.html', 'token-consumption.html',
    'connection-center.html', 'account-binding.html'
  ];
  if (noNavPages.includes(filename)) {
    console.log('[BottomNav]', filename, '- skip init');
    return;
  }
  
  // 防止重复创建
  if (document.getElementById('bottomNav')) {
    console.warn('[BottomNav] already exists, skip init');
    return;
  }
  
  console.log('[BottomNav] Creating bottom nav HTML');
  
  // 创建底部导航 HTML
  createBottomNavHTML();
  
  console.log('[BottomNav] Setting current active tab');
  
  // 普通页面初始化
  setCurrentActiveTab();
  addPageEnterAnimation();
  bindNavEvents();
  
  console.log('[BottomNav] Initialization complete');
}

// 创建底部导航 HTML
function createBottomNavHTML() {
  const navHTML = `
    <nav class="bottom-nav" id="bottomNav">
      <div class="bottom-nav-highlight" id="navHighlight"></div>
      <div class="bottom-nav-items">
        ${bottomNavConfig.items.map((item, index) => `
          <button class="bottom-nav-item" data-index="${index}" data-page="${item.page || ''}">
            <span class="nav-icon nav-icon-inactive">${navIcons[item.icon].inactive}</span>
            <span class="nav-icon nav-icon-active">${navIcons[item.icon].active}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;
  
  // 插入到 body 末尾
  const navContainer = document.createElement('div');
  navContainer.innerHTML = navHTML;
  document.body.appendChild(navContainer.firstElementChild);
}

// 设置当前激活的 tab
function setCurrentActiveTab() {
  const filename = getCurrentFilename();
  console.log('[BottomNav] setCurrentActiveTab called, filename:', filename);
  
  let tabId = pageToTabMap[filename] || 'home';
  
  // 如果在home.html，优先检查sessionStorage，然后检查URL参数
  if (filename === 'home.html') {
    const savedTab = sessionStorage.getItem('currentTab');
    console.log('[BottomNav] sessionStorage currentTab:', savedTab);
    
    if (savedTab) {
      tabId = savedTab;
      console.log('[BottomNav] Using saved tab from sessionStorage:', tabId);
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      console.log('[BottomNav] URL tab param:', tabParam);
      if (tabParam) {
        tabId = tabParam;
        console.log('[BottomNav] Using tab from URL param:', tabId);
      }
    }
  }
  
  console.log('[BottomNav] Determined tabId:', tabId);
  console.log('[BottomNav] tabIdToIndexMap has property:', tabIdToIndexMap.hasOwnProperty(tabId));
  console.log('[BottomNav] tabIdToIndexMap value:', tabIdToIndexMap[tabId]);
  
  // 使用 tabIdToIndexMap 直接获取索引
  if (tabIdToIndexMap.hasOwnProperty(tabId)) {
    currentActiveIndex = tabIdToIndexMap[tabId];
    console.log('[BottomNav] Found index for tabId:', currentActiveIndex);
  } else {
    // 如果找不到，遍历配置查找
    bottomNavConfig.items.forEach((item, index) => {
      if (item.id === tabId) {
        currentActiveIndex = index;
        console.log('[BottomNav] Found index via fallback:', index);
      }
    });
  }
  
  console.log('[BottomNav] Final currentActiveIndex:', currentActiveIndex);
  
  // 初始化时立即设置位置，不触发动画
  console.log('[BottomNav] Calling updateNavState with index:', currentActiveIndex, 'immediate: true');
  updateNavState(currentActiveIndex, true);
}

// 更新导航状态
function updateNavState(index, immediate = false) {
  console.log('[BottomNav] updateNavState called with index:', index, 'immediate:', immediate);
  
  const nav = document.getElementById('bottomNav');
  const navItems = document.querySelectorAll('.bottom-nav-item');
  const highlight = document.getElementById('navHighlight');

  navItems.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });

  if (!nav || !highlight || !navItems[index]) return;

  const navRect = nav.getBoundingClientRect();
  const itemRect = navItems[index].getBoundingClientRect();

  // 根据文字长度计算胶囊宽度
  let highlightWidth = 78;
  const label = navItems[index].querySelector('.nav-label');
  if (label && label.offsetWidth > 0) {
    highlightWidth = Math.max(78, label.offsetWidth + 50);
    highlightWidth = Math.min(100, highlightWidth);
  }

  const highlightLeft = 
    itemRect.left - navRect.left + (itemRect.width - highlightWidth) / 2;

  // 确保高亮胶囊不溢出导航栏
  const maxLeft = navRect.width - highlightWidth - 10;
  const minLeft = 10;
  const clampedLeft = Math.max(minLeft, Math.min(maxLeft, highlightLeft));

  console.log('[BottomNav] Setting highlight position:', { highlightWidth, clampedLeft });

  if (immediate) {
    // 初始化时：完全禁用过渡，立即设置位置，然后淡入显示
    highlight.style.transition = 'none';
    highlight.style.width = `${highlightWidth}px`;
    highlight.style.transform = `translateX(${clampedLeft}px)`;
    highlight.style.opacity = '0';
    highlight.style.visibility = 'visible';
    
    // 强制重排
    highlight.offsetHeight;
    
    // 使用 requestAnimationFrame 确保位置设置完成后再显示
    requestAnimationFrame(() => {
      highlight.style.transition = 'opacity 180ms ease';
      highlight.style.opacity = '1';
      
      requestAnimationFrame(() => {
        // 恢复完整的 transition
        highlight.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), width 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease';
      });
    });
  } else {
    // 正常动画
    highlight.style.visibility = 'visible';
    highlight.style.opacity = '1';
    highlight.style.width = `${highlightWidth}px`;
    highlight.style.transform = `translateX(${clampedLeft}px)`;
  }
}

// 绑定导航点击事件
function bindNavEvents() {
  const navItems = document.querySelectorAll('.bottom-nav-item');
  
  navItems.forEach((item, index) => {
    item.addEventListener('click', () => handleNavClick(item, index));
  });
}

// 显示加载弹窗
function showLoadingPopup(message = '正在加载...') {
  // 移除已存在的弹窗
  const existingPopup = document.getElementById('nav-loading-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // 创建加载弹窗
  const popup = document.createElement('div');
  popup.id = 'nav-loading-popup';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 99999;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: rgba(26, 26, 26, 0.95);
    padding: 20px 32px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  `;
  
  // 加载动画
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 24px;
    height: 24px;
    border: 2px solid rgba(97, 62, 234, 0.2);
    border-top-color: #613eea;
    border-radius: 50%;
    animation: nav-spin 0.6s linear infinite;
  `;
  
  const text = document.createElement('div');
  text.textContent = message;
  text.style.cssText = `
    color: #fff;
    font-size: 15px;
  `;
  
  content.appendChild(spinner);
  content.appendChild(text);
  popup.appendChild(content);
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes nav-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(popup);
  
  return popup;
}

// 隐藏加载弹窗
function hideLoadingPopup() {
  const popup = document.getElementById('nav-loading-popup');
  if (popup) {
    popup.remove();
  }
}

// 处理导航点击
function handleNavClick(item, index) {
  const config = bottomNavConfig.items[index];
  const currentPath = getCurrentFilename();
  
  // 如果是当前 tab，不做操作
  if (index === currentActiveIndex && config.id !== 'whale') {
    return;
  }
  
  // 如果是聊天tab，显示加载弹窗后跳转
  if (config.id === 'whale') {
    // 1. 更新状态到whale tab
    updateNavState(index);
    currentActiveIndex = index;
    
    // 2. 显示加载弹窗
    showLoadingPopup('正在加载萤火虫...');
    
    // 3. 延迟300ms后跳转
    setTimeout(() => {
      window.location.href = config.page;
    }, 300);
    return;
  }
  
  // 先更新 UI
  updateNavState(index);
  currentActiveIndex = index;
  
  // 判断是不是在 home.html 内切换
  if (config.page === currentPath && config.target) {
    // 在 home.html 内切换页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
      if (page.id === config.target) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });
    // 更新 sessionStorage
    sessionStorage.setItem('currentTab', config.id);
  } else if (config.page) {
    // 跳转到其他页面前保存状态
    if (config.page === 'home.html' && config.target) {
      sessionStorage.setItem('currentTab', config.id);
    } else if (config.page !== 'home.html') {
      // 离开home.html时清除sessionStorage
      sessionStorage.removeItem('currentTab');
    }
    
    // 返回home.html时清除入口加载标记
    if (config.page === 'home.html') {
      sessionStorage.removeItem('fromAgentEntryLoading');
    }
    
    // 跳转到其他页面
    setTimeout(() => {
      if (config.page === 'home.html' && config.target) {
        window.location.href = config.page + '?tab=' + config.target.replace('page-', '');
      } else {
        window.location.href = config.page;
      }
    }, 160);
  }
}

// 添加页面进入动画
function addPageEnterAnimation() {
  const mainContent = document.querySelector('.page-content, main, .app-container');
  if (mainContent) {
    mainContent.classList.add('page-enter');
  }
}

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBottomNav);
} else {
  initBottomNav();
}

// 页面隐藏时隐藏 loading 弹窗（禁止触发 show，只能 hide）
window.addEventListener('pagehide', function() {
  console.log('[BottomNav] pagehide: hide loading popup only, do not show');
  hideLoadingPopup();
});

// 页面显示时清理任何残留 loading
window.addEventListener('pageshow', function() {
  console.log('[BottomNav] pageshow: cleanup if needed');
  hideLoadingPopup();
});

// visibilitychange 只能 hide，不能 show
window.addEventListener('visibilitychange', function() {
  if (document.visibilityState === 'hidden') {
    console.log('[BottomNav] visibility hidden: hide loading popup');
    hideLoadingPopup();
  }
});

// popstate 只能 hide，不能 show
window.addEventListener('popstate', function() {
  console.log('[BottomNav] popstate: hide loading popup');
  hideLoadingPopup();
});
