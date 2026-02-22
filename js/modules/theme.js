/**
 * SubTracker — Theme Module
 * Dark / Light / Auto theme management
 * PRD Section 8: Theme Strategy
 *
 * Flash prevention is handled by inline <script> in <head> of index.html.
 * This module handles runtime toggling and persistence.
 */

const Theme = (function() {
  'use strict';

  const STORAGE_KEY = 'subtracker-theme';
  let currentTheme = 'light';
  let listeners = [];

  /**
   * Initialize the theme module
   * Reads saved preference or falls back to system preference
   */
  function init() {
    currentTheme = _getSavedTheme();
    _applyTheme(currentTheme);

    // Listen for system theme changes
    var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function(e) {
      // Only auto-switch if user hasn't set a manual preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        var systemTheme = e.matches ? 'dark' : 'light';
        _applyTheme(systemTheme);
        currentTheme = systemTheme;
        _notifyListeners(systemTheme);
      }
    });
  }

  /**
   * Toggle between dark and light modes
   */
  function toggle() {
    var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }

  /**
   * Set theme explicitly
   * @param {string} theme - 'dark', 'light', or 'auto'
   */
  function setTheme(theme) {
    if (theme === 'auto') {
      localStorage.removeItem(STORAGE_KEY);
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      localStorage.setItem(STORAGE_KEY, theme);
      currentTheme = theme;
    }

    // Add transition class for smooth theme change
    document.body.classList.add('theme-transitioning');
    _applyTheme(currentTheme);

    // Remove transition class after animation completes
    setTimeout(function() {
      document.body.classList.remove('theme-transitioning');
    }, 350);

    _notifyListeners(currentTheme);
  }

  /**
   * Get the current theme
   * @returns {string} 'dark' or 'light'
   */
  function getTheme() {
    return currentTheme;
  }

  /**
   * Check if dark mode is active
   * @returns {boolean}
   */
  function isDark() {
    return currentTheme === 'dark';
  }

  /**
   * Register a callback for theme changes
   * @param {Function} callback - Called with new theme string
   */
  function onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  function _getSavedTheme() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    // System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // Update meta theme-color for browser chrome
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#121212' : '#1B4F72');
    }
  }

  function _notifyListeners(theme) {
    listeners.forEach(function(cb) {
      try { cb(theme); } catch(e) { console.error('Theme listener error:', e); }
    });
  }

  return {
    init: init,
    toggle: toggle,
    setTheme: setTheme,
    getTheme: getTheme,
    isDark: isDark,
    onChange: onChange
  };
})();
