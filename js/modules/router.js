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

    if (!pageName) {
      // Redirect to default if route not found
      navigate(DEFAULT_ROUTE);
      return;
    }

    _showPage(pageName);
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
