/**
 * 开屏动画 / 品牌展示页逻辑
 * 高端、美丽大气、丝滑 Q 弹
 */

(function() {
  'use strict';

  const SPLASH_STORAGE_KEY = 'splashShown';

  const defaultOptions = {
    duration: 2000,
    force: false
  };

  let splashElement = null;
  let isShowing = false;
  let autoHideTimer = null;

  function createSplashElement() {
    const splash = document.createElement('div');
    splash.className = 'app-splash';
    splash.setAttribute('role', 'dialog');
    splash.setAttribute('aria-label', '品牌展示');

    const whaleSvg = `
      <img src="images/yinghuochong-logo.png" alt="萤火虫" class="splash-logo">
    `;

    splash.innerHTML = `
      <button class="splash-skip" id="splashSkip">跳过</button>
      <div class="splash-bg-orb"></div>
      <div class="splash-bg-grid" style="opacity: 0.12;"></div>
      <div class="splash-content">
        <div class="splash-logo-wrap">
          ${whaleSvg}
        </div>
        <h1 class="splash-title">萤火虫</h1>
        <p class="splash-subtitle">个人数字大脑</p>
        <p class="splash-desc">让设备、模型与任务自然协同</p>
        <div class="splash-progress">
          <span></span>
        </div>
      </div>
    `;

    return splash;
  }

  function shouldShowSplash(force) {
    if (force === true) {
      return true;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('splash') === '1') {
      return true;
    }

    try {
      const shown = sessionStorage.getItem(SPLASH_STORAGE_KEY);
      return shown !== 'true';
    } catch (e) {
      return true;
    }
  }

  function markSplashShown() {
    try {
      sessionStorage.setItem(SPLASH_STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('[Splash] Failed to save splash state:', e);
    }
  }

  function hideSplash(immediate) {
    if (!splashElement || !isShowing) {
      return;
    }

    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }

    if (immediate) {
      try {
        splashElement.remove();
      } catch (e) {
        splashElement.parentNode && splashElement.parentNode.removeChild(splashElement);
      }
      splashElement = null;
      isShowing = false;
      return;
    }

    splashElement.classList.add('is-leaving');

    setTimeout(() => {
      try {
        if (splashElement && splashElement.parentNode) {
          splashElement.parentNode.removeChild(splashElement);
        }
      } catch (e) {
        // ignore
      }
      splashElement = null;
      isShowing = false;
    }, 360);
  }

  function showSplash(options) {
    options = Object.assign({}, defaultOptions, options || {});

    if (isShowing) {
      return;
    }

    if (!shouldShowSplash(options.force)) {
      return;
    }

    try {
      splashElement = createSplashElement();
      document.body.appendChild(splashElement);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          splashElement.classList.add('active');
        });
      });

      const skipBtn = splashElement.querySelector('#splashSkip');
      if (skipBtn) {
        skipBtn.addEventListener('click', function() {
          hideSplash(false);
          markSplashShown();
        }, { passive: true });
      }

      isShowing = true;

      autoHideTimer = setTimeout(() => {
        hideSplash(false);
        markSplashShown();
      }, options.duration);
    } catch (e) {
      console.warn('[Splash] Failed to show splash:', e);
      if (splashElement && splashElement.parentNode) {
        try {
          splashElement.parentNode.removeChild(splashElement);
        } catch (err) {
          // ignore
        }
      }
      splashElement = null;
      isShowing = false;
    }
  }

  window.AppSplash = {
    show: function(options) {
      try {
        showSplash(options);
      } catch (e) {
        console.warn('[Splash] init failed:', e);
      }
    },
    hide: function() {
      hideSplash(false);
    },
    shouldShow: function() {
      return shouldShowSplash(false);
    }
  };
})();