// main.js v20260325-3 - 移动端导航修复版本
console.log('main.js loaded v20260325-3');

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');

  // 导航栏高亮当前页面
  highlightCurrentPage();

  // 平滑滚动
  smoothScroll();

  // 响应式导航栏
  responsiveNav();

  // 左侧导航栏滚动高亮
  sideNavScrollHighlight();

  // 左侧导航栏收起/展开功能
  sideNavToggle();
  
  // 滚动出现效果初始化
  initScrollReveal();
});

// 导航栏高亮当前页面
function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-menu li a');

  navLinks.forEach(link => {
    // 移除所有链接的active类
    link.classList.remove('active');

    // 获取链接的路径
    const linkPath = new URL(link.href).pathname;

    // 比较路径，添加active类到当前页面的链接
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });
}

// 平滑滚动
function smoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// 响应式导航栏 - 重写版本，统一使用 pointerdown
function responsiveNav() {
  console.log('mobile nav init start');

  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  console.log('navToggle found:', !!navToggle);
  console.log('navMenu found:', !!navMenu);

  if (!navToggle || !navMenu) {
    console.log('navToggle or navMenu not found, skipping mobile nav init');
    return;
  }

  console.log('mobile nav init success');

  // 切换菜单显示/隐藏的函数
  function toggleMenu(e) {
    console.log('toggle clicked, current show class:', navMenu.classList.contains('show'));

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const isOpen = navMenu.classList.contains('show');

    if (isOpen) {
      navMenu.classList.remove('show');
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    } else {
      navMenu.classList.add('show');
      navMenu.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
    }

    console.log('menu toggled, new state - show:', navMenu.classList.contains('show'), 'is-open:', navMenu.classList.contains('is-open'));
  }

  // 统一使用 pointerdown 事件
  navToggle.addEventListener('pointerdown', function(e) {
    console.log('nav-toggle pointerdown fired');
    e.preventDefault();
    e.stopPropagation();
    toggleMenu(e);
  });

  // 键盘事件支持 - 可访问性
  navToggle.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      console.log('nav-toggle keydown:', e.key);
      e.preventDefault();
      toggleMenu(e);
    }
  });

  // 点击页面其他地方关闭菜单 - 统一使用 pointerdown
  document.addEventListener('pointerdown', function(e) {
    // 如果点击发生在 nav-toggle 或 nav-menu 内部，直接返回，不关闭菜单
    if (navToggle.contains(e.target) || navMenu.contains(e.target)) {
      return;
    }

    // 关闭菜单
    if (navMenu.classList.contains('show')) {
      console.log('closing menu by outside click');
      navMenu.classList.remove('show');
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // 菜单链接点击后自动关闭菜单
  const menuLinks = navMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      console.log('menu link clicked, closing menu');
      navMenu.classList.remove('show');
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// 滚动时导航栏效果
window.addEventListener('scroll', function() {
  const nav = document.querySelector('.nav');
  if (nav) {
    if (window.scrollY > 100) {
      nav.style.padding = '11px 0';
    } else {
      nav.style.padding = '14px 0';
    }
  }
  const header = document.querySelector('.header');
  if (header) {
    if (window.scrollY > 100) {
      header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
      header.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
  }

  // 左侧导航栏滚动高亮
  sideNavScrollHighlight();
});

// 左侧导航栏滚动高亮
function sideNavScrollHighlight() {
  const sections = document.querySelectorAll('section[id], div[id]');
  const sideNavLinks = document.querySelectorAll('.side-nav-menu li a');

  let currentSection = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop - 200) {
      currentSection = section.getAttribute('id');
    }
  });

  sideNavLinks.forEach(link => {
    link.classList.remove('active');
    const linkHref = link.getAttribute('href');
    // Check if link ends with #section-id or is exactly #section-id
    if (linkHref === `#${currentSection}` || linkHref.endsWith(`#${currentSection}`)) {
      link.classList.add('active');
    }
  });
}

// 左侧导航栏收起/展开功能
function sideNavToggle() {
  const toggleBtns = document.querySelectorAll('.side-nav-toggle');

  toggleBtns.forEach(toggleBtn => {
    const sideNav = toggleBtn.closest('.side-nav');

    if (sideNav) {
      toggleBtn.addEventListener('click', function() {
        sideNav.classList.toggle('collapsed');
      });
    }
  });
}

/* ==================== 全站统一滚动出现效果 ==================== */

// 滚动出现效果初始化
function initScrollReveal() {
  // 使用 Intersection Observer API
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 添加 is-visible 类触发动画
        entry.target.classList.add('is-visible');
        
        // 对于父元素是 reveal-up，子元素是 reveal-stagger 的情况
        // 需要给直接子元素添加 is-visible 并设置 stagger 延迟
        const staggerItems = entry.target.querySelectorAll(':scope > .reveal-stagger');
        if (staggerItems.length > 0) {
          staggerItems.forEach((item, index) => {
            // 延迟后添加 is-visible
            setTimeout(() => {
              item.classList.add('is-visible');
            }, index * 80);
          });
        }
        
        // 观察完成后停止观察，避免重复触发动画
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 观察所有需要滚动出现的元素
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-scale, .reveal-stagger');
  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // Hero 区特殊处理 - 页面加载后立即触发动画
  setTimeout(() => {
    const heroElements = document.querySelectorAll('.hero-animate, .hero-visual-animate');
    heroElements.forEach(el => {
      el.classList.add('is-visible');
    });
  }, 100);
}

// Tab/内容切换动画初始化
function initTabAnimation() {
  const tabTriggers = document.querySelectorAll('[data-tab-trigger]');
  
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const targetId = this.dataset.tabTrigger;
      const targetPanel = document.getElementById(targetId);
      
      if (targetPanel) {
        // 移除所有 tab 的激活态
        tabTriggers.forEach(t => t.classList.remove('is-selected'));
        // 隐藏所有 tab panel
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
        
        // 激活当前 tab
        this.classList.add('is-selected');
        // 显示目标 panel 并触发动画
        targetPanel.classList.add('is-active');
      }
    });
  });
}

// 初始化 Tab 动画
document.addEventListener('DOMContentLoaded', function() {
  initTabAnimation();
});
