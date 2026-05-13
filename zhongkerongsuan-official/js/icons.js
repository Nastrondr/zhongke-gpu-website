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
  // 检查图标是否存在
  if (!lucide[iconName]) {
    console.warn(`Icon ${iconName} not found in Lucide`);
    return null;
  }
  
  try {
    // 创建SVG元素
    const iconSvg = lucide[iconName]({
      size: context === 'nav' ? 20 : context === 'card' ? 32 : 16,
      stroke: 'var(--primary)',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      fill: 'none'
    });
    
    // 添加类名
    iconSvg.classList.add('lucide-icon');
    
    // 添加过渡效果
    iconSvg.style.transition = 'var(--transition)';
    
    return iconSvg;
  } catch (error) {
    console.error(`Error creating icon ${iconName}:`, error);
    return null;
  }
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