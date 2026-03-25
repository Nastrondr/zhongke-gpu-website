// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
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

// 响应式导航栏
function responsiveNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function() {
      navMenu.classList.toggle('show');
    });
  }
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
