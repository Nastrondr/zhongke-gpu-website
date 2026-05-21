// 图标映射表 - 根据文字语义映射到Lucide图标
const iconMap = {
  // 产品相关
  '裸金属GPU租赁': 'Server',
  'GPU卡时销售': 'Zap',
  '服务器': 'Server',
  '算力': 'Cpu',
  'GPU': 'Monitor',
  
  // 场景相关
  '大模型训练': 'Brain',
  'AI推理部署': 'Rocket',
  '科学计算': 'Beaker',
  '高校科研': 'GraduationCap',
  '企业AI应用': 'Building',
  '创意内容生成': 'Palette',
  
  // 优势相关
  '高性能GPU资源': 'ServerCog',
  '灵活计费模式': 'DollarSign',
  '快速交付部署': 'Rocket',
  '企业级技术支持': 'Headphones',
  
  // 导航相关
  '首页': 'Home',
  '产品与服务': 'Package',
  '解决方案': 'Lightbulb',
  '资源中心': 'BookOpen',
  '关于我们': 'Users',
  '联系销售': 'Phone',
  
  // 按钮相关
  '查看产品': 'Search',
  '获取报价': 'DollarSign',
  '查看详情': 'Eye',
  '登录': 'LogIn',
  '注册': 'UserPlus',
  '返回': 'ArrowLeft'
};

// 初始化Lucide图标
function initLucideIcons() {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceAllIcons);
  } else {
    replaceAllIcons();
  }
}

// 替换所有图标
function replaceAllIcons() {
  // 检查Lucide是否加载
  if (typeof lucide === 'undefined') {
    console.error('Lucide icon library not loaded');
    return;
  }
  
  // 替换卡片图标
  replaceCardIcons();
  
  // 替换导航图标
  replaceNavIcons();
  
  // 替换按钮图标
  replaceButtonIcons();
}

// 替换卡片图标
function replaceCardIcons() {
  const cardIcons = document.querySelectorAll('.card .icon');
  
  cardIcons.forEach(iconElement => {
    const parentCard = iconElement.closest('.card');
    if (parentCard) {
      const cardTitle = parentCard.querySelector('h3')?.textContent || '';
      const iconName = getIconName(cardTitle);
      
      if (iconName) {
        replaceIcon(iconElement, iconName, 'card');
      }
    }
  });
}

// 替换导航图标
function replaceNavIcons() {
  const navLinks = document.querySelectorAll('.nav-menu li a');
  
  navLinks.forEach(link => {
    const linkText = link.textContent || '';
    const iconName = getIconName(linkText);
    
    if (iconName) {
      // 检查是否已有图标
      if (!link.querySelector('.lucide-icon')) {
        const iconElement = createIconElement(iconName, 'nav');
        if (iconElement) {
          link.insertBefore(iconElement, link.firstChild);
          // 添加间距
          iconElement.style.marginRight = '8px';
        }
      }
    }
  });
}

// 替换按钮图标
function replaceButtonIcons() {
  const buttons = document.querySelectorAll('.btn, .quote-btn, .login-btn, .purchase-btn');
  
  buttons.forEach(button => {
    const buttonText = button.textContent || '';
    const iconName = getIconName(buttonText);
    
    if (iconName) {
      // 检查是否已有图标
      if (!button.querySelector('.lucide-icon')) {
        const iconElement = createIconElement(iconName, 'button');
        if (iconElement) {
          button.insertBefore(iconElement, button.firstChild);
        }
      }
    }
  });
}

// 根据文字内容获取图标名称
function getIconName(text) {
  for (const [key, value] of Object.entries(iconMap)) {
    if (text.includes(key)) {
      return value;
    }
  }
  return null;
}

// 创建图标元素
function createIconElement(iconName, context) {
  try {
    const size = context === 'nav' ? 20 : context === 'card' ? 32 : 16;
    
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', size);
    iconSvg.setAttribute('height', size);
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('stroke', 'var(--primary)');
    iconSvg.setAttribute('stroke-width', '2');
    iconSvg.setAttribute('stroke-linecap', 'round');
    iconSvg.setAttribute('stroke-linejoin', 'round');
    
    iconSvg.innerHTML = getIconPath(iconName);
    
    iconSvg.classList.add('lucide-icon');
    iconSvg.style.transition = 'var(--transition)';
    
    return iconSvg;
  } catch (error) {
    console.error(`Error creating icon ${iconName}:`, error);
    return null;
  }
}

function getIconPath(iconName) {
  const paths = {
    Home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    Package: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    Cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="15" x2="9.01" y2="15"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    BookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    Users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    LogIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
    UserPlus: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="3" x2="12" y2="11"/><line x1="8" y1="7" x2="16" y2="7"/>',
    DollarSign: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    Server: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
    Zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    Monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    Brain: '<path d="M12 2a10 10 0 1 0 10 10H12V2z"/><circle cx="12" cy="12" r="3"/>',
    Rocket: '<path d="M12 12c-1.5 0-3 .5-4 2s-1.5 3.5-1 5 2.5 3 4 3c1 0 2-.3 3-1s1.5-2.5 1-4-1-3-2.5-3.5S13 12 12 12z"/><path d="M12 12v6"/><path d="M9 18h6"/><path d="M15 15l3 3"/><path d="M9 21l-3-3"/>',
    Beaker: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M13 2v7h5"/>',
    GraduationCap: '<path d="M22 10v6"/><path d="M12 21.75a8.25 8.25 0 0 0 8.25-8.25V10a8.5 8.5 0 0 0-17 0v3.5a8.25 8.25 0 0 0 8.25 8.25z"/><path d="M4.17 16.92a10.43 10.43 0 0 1 5.83-.92 10.43 10.43 0 0 1 5.83.92"/>',
    Building: '<path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M7 21h10"/><path d="M7 3h10"/><path d="M7 9h10"/><path d="M17 9v12"/><path d="M7 9v12"/>',
    Palette: '<path d="M21 12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2s.9-2 2-2h14c1.1 0 2 .9 2 2z"/><circle cx="8.5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="15.5" cy="12" r="1.5"/>',
    ServerCog: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/><circle cx="12" cy="18" r="3"/>',
    Headphones: '<path d="M12 1a9 9 0 0 0-9 9v3a3 3 0 0 0 3 3h1a3 3 0 0 1 3 3v1a9 9 0 0 0 9-9v-3a3 3 0 0 0-3-3h-1a3 3 0 0 1-3-3v-1z"/>',
    Lightbulb: '<path d="M6 2H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2"/><path d="M6 22H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2"/><path d="M16 16C8 16 6 10 6 3h12c0 7-2 13-10 13z"/><path d="M9.5 17c-.8 0-1.5-.7-1.5-1.5S8.7 14 9.5 14s1.5.7 1.5 1.5S10.3 17 9.5 17z"/>',
    Phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    Eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    ArrowLeft: '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>'
  };
  return paths[iconName] || '';
}

// 替换现有图标元素
function replaceIcon(element, iconName, context) {
  const iconElement = createIconElement(iconName, context);
  if (iconElement) {
    element.replaceWith(iconElement);
  }
}

// 初始化
initLucideIcons();