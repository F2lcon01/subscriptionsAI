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
      '<span class="toast__message">' + _escapeHTML(message) + '</span>' +
      '<button class="toast__close" aria-label="Close">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<line x1="18" y1="6" x2="6" y2="18"></line>' +
          '<line x1="6" y1="6" x2="18" y2="18"></line>' +
        '</svg>' +
      '</button>';

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
