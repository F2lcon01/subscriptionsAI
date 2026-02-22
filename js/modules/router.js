/**
 * SubTracker — Simple Hash Router
 * Handles page navigation within the app shell
 * Uses hash-based routing (#/dashboard, #/subscriptions, etc.)
 */

const Router = (function() {
  'use strict';

  const ROUTES = {
    '/dashboard': 'dashboard',
    '/subscriptions': 'subscriptions',
    '/calendar': 'calendar',
    '/reports': 'reports',
    '/tools': 'tools',
    '/admin': 'admin',
    '/settings': 'settings'
  };

  const DEFAULT_ROUTE = '/dashboard';
  let currentPage = null;

  /**
   * Initialize the router
   * Listens for hash changes and navigates to the current route
   */
  function init() {
    window.addEventListener('hashchange', _onHashChange);
    _onHashChange();
  }

  /**
   * Navigate to a specific route
   * @param {string} route - Route path (e.g., '/dashboard')
   */
  function navigate(route) {
    window.location.hash = route;
  }

  /**
   * Get the current page name
   * @returns {string} Current page identifier
   */
  function getCurrentPage() {
    return currentPage;
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  function _onHashChange() {
    var hash = window.location.hash.replace('#', '') || DEFAULT_ROUTE;
    var pageName = ROUTES[hash];

    // Handle dynamic shared route: /shared/{userId}/{token}
    if (!pageName && hash.startsWith('/shared/')) {
      var parts = hash.split('/');
      if (parts.length >= 4) {
        _handleSharedView(parts[2], parts[3]);
        return;
      }
    }

    if (!pageName) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    _showPage(pageName);
  }

  function _handleSharedView(userId, token) {
    SharingService.getSharedView(userId, token).then(function(data) {
      if (!data) {
        Toast.error(I18n.t('share.invalid_link'));
        navigate(DEFAULT_ROUTE);
        return;
      }
      var main = document.getElementById('main-content');
      var pages = document.querySelectorAll('.page');
      pages.forEach(function(p) { p.hidden = true; });

      var sharedPage = document.getElementById('page-shared') || document.createElement('div');
      sharedPage.id = 'page-shared';
      sharedPage.className = 'page';
      sharedPage.hidden = false;
      sharedPage.innerHTML = '<div style="padding:var(--space-5);max-width:800px;margin:0 auto">' +
        '<h2>' + data.ownerName + ' — ' + I18n.t('share.shared_view') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-block-end:var(--space-4)">' + data.subscriptions.length + ' ' + I18n.t('share.subscriptions') + '</p>' +
        data.subscriptions.map(function(s) {
          return '<div style="padding:var(--space-3);background:var(--color-surface);border-radius:var(--radius-lg);margin-block-end:var(--space-2);display:flex;justify-content:space-between">' +
            '<span>' + (s.icon || '📦') + ' ' + s.name + '</span>' +
            '<span>' + (s.yourShare || s.amount || 0).toFixed(2) + ' ' + (s.currency || 'SAR') + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
      if (!document.getElementById('page-shared')) main.appendChild(sharedPage);
    });
  }

  function _showPage(pageName) {
    if (pageName === currentPage) return;

    // Hide all pages
    var pages = document.querySelectorAll('.page');
    pages.forEach(function(page) {
      page.hidden = true;
      page.classList.remove('page--enter');
    });

    // Show target page
    var targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
      targetPage.hidden = false;
      // Trigger animation
      requestAnimationFrame(function() {
        targetPage.classList.add('page--enter');
      });
    }

    // Update sidebar active state
    var sidebarLinks = document.querySelectorAll('.sidebar__link');
    sidebarLinks.forEach(function(link) {
      link.classList.toggle('sidebar__link--active', link.getAttribute('data-page') === pageName);
    });

    // Update bottom nav active state
    var bottomNavItems = document.querySelectorAll('.bottom-nav__item');
    bottomNavItems.forEach(function(item) {
      item.classList.toggle('bottom-nav__item--active', item.getAttribute('data-page') === pageName);
    });

    currentPage = pageName;
  }

  return {
    init: init,
    navigate: navigate,
    getCurrentPage: getCurrentPage
  };
})();
