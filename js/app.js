/**
 * SubTracker — Main Application Entry Point
 * Initializes all modules and binds global event listeners
 */

const App = (function() {
  'use strict';

  /**
   * Initialize the application
   * Order matters: Theme → i18n → Auth → UI bindings
   */
  async function init() {
    try {
      // 1. Initialize theme (already partially done in <head> script)
      Theme.init();

      // 2. Initialize i18n (load translations)
      await I18n.init();
    } catch (err) {
      console.error('App init error (non-critical):', err);
    }

    // 3. Initialize authentication (shows auth or app) — MUST always run
    AuthService.init();

    // 4. Bind global UI event listeners
    _bindGlobalEvents();

    // 5. Re-render pages when language changes
    I18n.onChange(function() {
      _renderCurrentPage();
    });
  }

  /**
   * Called when a user is authenticated and app is shown
   * Initializes subscriptions and renders pages
   */
  function onAppReady() {
    // Initialize subscription real-time listener
    SubscriptionService.init();

    // Listen for subscription data changes → re-render pages
    SubscriptionService.onChange(function() {
      _renderCurrentPage();
    });

    // Render the current page
    _renderCurrentPage();
  }

  /**
   * Called when user logs out
   */
  function onAppDestroy() {
    SubscriptionService.destroy();
  }

  // =============================================
  // PAGE RENDERING
  // =============================================

  function _renderCurrentPage() {
    var page = Router.getCurrentPage();
    if (!page) {
      // Router not ready yet, default to dashboard
      page = 'dashboard';
    }
    switch(page) {
      case 'dashboard':
        Dashboard.render();
        break;
      case 'subscriptions':
        SubscriptionList.render();
        break;
      case 'settings':
        Settings.render();
        break;
    }
  }

  // =============================================
  // GLOBAL EVENT BINDINGS
  // =============================================

  function _bindGlobalEvents() {
    // Theme toggle (header)
    var themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        Theme.toggle();
      });
    }

    // Language toggle (header)
    var langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', function() {
        I18n.toggleLang();
      });
    }

    // Mobile sidebar toggle
    var menuBtn = document.getElementById('menu-toggle-btn');
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
      menuBtn.addEventListener('click', function() {
        _toggleSidebar(sidebar, overlay);
      });

      overlay.addEventListener('click', function() {
        _closeSidebar(sidebar, overlay);
      });
    }

    // Close sidebar when a link is clicked (mobile)
    document.querySelectorAll('.sidebar__link').forEach(function(link) {
      link.addEventListener('click', function() {
        if (window.innerWidth < 768) {
          _closeSidebar(sidebar, overlay);
        }
      });
    });

    // User menu dropdown
    var userMenuBtn = document.getElementById('user-menu-btn');
    var userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var isHidden = userDropdown.hidden;
        userDropdown.hidden = !isHidden;
      });

      // Close dropdown on outside click
      document.addEventListener('click', function(e) {
        if (!userDropdown.hidden && !userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.hidden = true;
        }
      });

      // Close dropdown on Escape
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !userDropdown.hidden) {
          userDropdown.hidden = true;
          userMenuBtn.focus();
        }
      });
    }

    // Logout button
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        userDropdown.hidden = true;
        App.onAppDestroy();
        AuthService.logout();
      });
    }

    // Close sidebar on window resize to desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth >= 768 && sidebar) {
        sidebar.classList.remove('sidebar--open');
        if (overlay) {
          overlay.hidden = true;
          overlay.classList.remove('sidebar-overlay--visible');
        }
      }
    });

    // Listen for hash changes to re-render pages
    window.addEventListener('hashchange', function() {
      // Small delay to let router update first
      setTimeout(_renderCurrentPage, 50);
    });
  }

  // =============================================
  // SIDEBAR HELPERS
  // =============================================

  function _toggleSidebar(sidebar, overlay) {
    var isOpen = sidebar.classList.contains('sidebar--open');
    if (isOpen) {
      _closeSidebar(sidebar, overlay);
    } else {
      _openSidebar(sidebar, overlay);
    }
  }

  function _openSidebar(sidebar, overlay) {
    sidebar.classList.add('sidebar--open');
    overlay.hidden = false;
    requestAnimationFrame(function() {
      overlay.classList.add('sidebar-overlay--visible');
    });
  }

  function _closeSidebar(sidebar, overlay) {
    sidebar.classList.remove('sidebar--open');
    overlay.classList.remove('sidebar-overlay--visible');
    setTimeout(function() {
      overlay.hidden = true;
    }, 300);
  }

  return {
    init: init,
    onAppReady: onAppReady,
    onAppDestroy: onAppDestroy
  };
})();

/* ============================================
   BOOT — Start the application when DOM is ready
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  App.init().catch(function(err) {
    console.error('App boot failed:', err);
    // Fallback: hide loading overlay and show auth section
    var overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.hidden = true;
    var authSection = document.getElementById('auth-section');
    if (authSection) authSection.hidden = false;
  });
});
