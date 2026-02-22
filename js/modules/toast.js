/**
 * SubTracker — Toast Notification Module
 * Auto-dismissing toast messages (success, error, warning, info)
 * PRD Section 7.4: Toasts
 */

const Toast = (function() {
  'use strict';

  const CONTAINER_ID = 'toast-container';
  const AUTO_DISMISS_MS = 4000;

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
   */
  function show(message, type, duration) {
    type = type || 'info';
    duration = duration !== undefined ? duration : AUTO_DISMISS_MS;

    var container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.setAttribute('role', 'alert');

    toast.innerHTML =
      '<div class="toast__icon">' + _getIcon(type) + '</div>' +
      '<span class="toast__message">' + _escapeHTML(message) + '</span>' +
      '<button class="toast__close" aria-label="Close">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<line x1="18" y1="6" x2="6" y2="18"></line>' +
          '<line x1="6" y1="6" x2="18" y2="18"></line>' +
        '</svg>' +
      '</button>' +
      (duration > 0 ? '<div class="toast__progress" style="animation-duration:' + duration + 'ms"></div>' : '');

    // Close button handler
    var closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', function() {
      _dismiss(toast);
    });

    container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(function() {
        _dismiss(toast);
      }, duration);
    }
  }

  /**
   * Shorthand methods
   */
  function success(message, duration) {
    show(message, 'success', duration);
  }

  function error(message, duration) {
    show(message, 'error', duration);
  }

  function warning(message, duration) {
    show(message, 'warning', duration);
  }

  function info(message, duration) {
    show(message, 'info', duration);
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  function _dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast--exit');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }

  function _getIcon(type) {
    switch(type) {
      case 'success':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      case 'error':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      case 'warning':
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      default:
        return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }

  function _escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    show: show,
    success: success,
    error: error,
    warning: warning,
    info: info
  };
})();
