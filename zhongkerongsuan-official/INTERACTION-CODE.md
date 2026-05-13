# zhongkerongsuan-official 页面交互代码

## 1. 外部依赖

```html
<!-- CDN图标库 -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- 本地图标配置 -->
<script src="js/icons.js"></script>
```

---

## 2. icons.js - 图标映射配置

```javascript
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceAllIcons);
  } else {
    replaceAllIcons();
  }
}

// 替换所有图标
function replaceAllIcons() {
  if (typeof lucide === 'undefined') {
    console.error('Lucide icon library not loaded');
    return;
  }
  replaceCardIcons();
  replaceNavIcons();
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
      if (!link.querySelector('.lucide-icon')) {
        const iconElement = createIconElement(iconName, 'nav');
        if (iconElement) {
          link.insertBefore(iconElement, link.firstChild);
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
  if (!lucide[iconName]) {
    console.warn(`Icon ${iconName} not found in Lucide`);
    return null;
  }
  try {
    const iconSvg = lucide[iconName]({
      size: context === 'nav' ? 20 : context === 'card' ? 32 : 16,
      stroke: 'var(--primary)',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      fill: 'none'
    });
    iconSvg.classList.add('lucide-icon');
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
```

---

## 3. 移动端导航菜单脚本

**适用于：** index.html, bare-metal.html, gpu-time.html

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navActions = document.querySelector('.nav-actions');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      if (navActions) navActions.classList.toggle('active');
      navToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
    });

    navToggle.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        navMenu.classList.toggle('active');
        if (navActions) navActions.classList.toggle('active');
        navToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
      }
    });
  }
});
```

---

## 4. products.html 搜索功能

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('search-input');
  const navItems = document.querySelectorAll('.side-nav-menu li');
  const productCards = document.querySelectorAll('.card');

  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();

      // 筛选导航项
      navItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          item.style.display = 'block';
        } else {
          item.style.display = searchTerm === '' ? 'block' : 'none';
        }
      });

      // 筛选产品卡片
      productCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = searchTerm === '' ? 'block' : 'none';
        }
      });
    });

    // 输入框聚焦效果
    searchInput.addEventListener('focus', function() {
      this.style.borderColor = 'var(--primary)';
      this.style.boxShadow = '0 0 0 3px rgba(91, 92, 240, 0.1)';
      const icon = this.previousElementSibling;
      if (icon) {
        icon.style.stroke = 'var(--primary)';
      }
    });

    // 输入框失焦效果
    searchInput.addEventListener('blur', function() {
      this.style.borderColor = 'var(--border-color)';
      this.style.boxShadow = 'none';
      const icon = this.previousElementSibling;
      if (icon) {
        icon.style.stroke = 'var(--text-light)';
      }
    });
  }
});
```

---

## 5. 页面文件对应脚本一览

| 文件名 | 外部脚本 | 内联脚本 |
|--------|----------|----------|
| index.html | lucide, icons.js | 导航菜单切换 |
| products.html | lucide, icons.js | 搜索 + 导航菜单切换 |
| about.html | lucide, icons.js | 无 |
| contact.html | lucide, icons.js | 无 |
| news-policy.html | lucide, icons.js | 无 |
| computing-center.html | lucide, icons.js | 无 |
| ai.html | lucide, icons.js | 无 |
| robot.html | lucide, icons.js | 无 |
| solutions.html | lucide, icons.js | 无 |
| bare-metal.html | lucide, icons.js | 导航菜单切换 |
| gpu-time.html | lucide, icons.js | 导航菜单切换 |

---

## 6. 依赖说明

- **Lucide Icons**: 用于在页面中动态显示图标
- **icons.js**: 将中文文字映射到对应的 Lucide 图标
- 移动端菜单切换依赖 CSS 类 `.active` 控制显示/隐藏
