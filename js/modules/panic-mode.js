/**
 * SubTracker — Panic Mode / Emergency Lock
 * One-tap instant lock — hides all sensitive data
 * PRD Section 6.4: Panic Mode
 */

const PanicMode = (function() {
  'use strict';

  const LOCK_KEY = 'subtracker-panic-locked';
  const AUTOLOCK_KEY = 'subtracker-autolock-minutes';
  let _isLocked = false;
  let _lockTimer = null;
  let _activityTimer = null;

  /**
   * Initialize panic mode
   */
  function init() {
    // Check if was locked
    if (sessionStorage.getItem(LOCK_KEY) === 'true') {
      _isLocked = true;
      _showLockScreen();
    }

    // Keyboard shortcut: Ctrl+Shift+L
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        if (_isLocked) return;
        lock();
      }
    });

    // Start auto-lock timer if configured
    _startAutoLockTimer();

    // Reset activity timer on user interaction
    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(function(evt) {
      document.addEventListener(evt, function() {
        _resetActivityTimer();
      }, { passive: true });
    });
  }

  /**
   * Lock the application
   */
  function lock() {
    _isLocked = true;
    sessionStorage.setItem(LOCK_KEY, 'true');
    CryptoService.clearCache();
    _showLockScreen();
  }

  /**
   * Unlock with master password
   */
  async function unlock(masterPassword) {
    var valid = await CryptoService.verifyMasterPassword(masterPassword);
    if (valid) {
      _isLocked = false;
      sessionStorage.removeItem(LOCK_KEY);
      _hideLockScreen();
      _startAutoLockTimer();
      return true;
    }
    return false;
  }

  /**
   * Check if locked
   */
  function isLocked() {
    return _isLocked;
  }

  /**
   * Set auto-lock timer (in minutes, 0 = disabled)
   */
  function setAutoLockTimer(minutes) {
    localStorage.setItem(AUTOLOCK_KEY, minutes.toString());
    _startAutoLockTimer();
  }

  /**
   * Get auto-lock setting
   */
  function getAutoLockMinutes() {
    return parseInt(localStorage.getItem(AUTOLOCK_KEY) || '0', 10);
  }

  // =============================================
  // PRIVATE
  // =============================================

  function _showLockScreen() {
    var lockScreen = document.getElementById('panic-lock-screen');
    if (!lockScreen) {
      lockScreen = document.createElement('div');
      lockScreen.id = 'panic-lock-screen';
      lockScreen.className = 'panic-lock';
      document.body.appendChild(lockScreen);
    }

    lockScreen.innerHTML = '' +
      '<div class="panic-lock__content">' +
        '<div class="panic-lock__icon">🔒</div>' +
        '<h2 class="panic-lock__title" data-i18n="panic.lock_title">' + I18n.t('panic.lock_title') + '</h2>' +
        '<p class="panic-lock__text" data-i18n="panic.lock_text">' + I18n.t('panic.lock_text') + '</p>' +
        '<div class="form-group" style="max-width:320px;margin:var(--space-4) auto 0">' +
          '<input type="password" class="form-group__input" id="panic-password" ' +
            'placeholder="' + I18n.t('crypto.master_password') + '" autocomplete="off">' +
          '<div class="form-group__error" id="panic-error" hidden></div>' +
        '</div>' +
        '<button class="btn btn--primary" id="panic-unlock-btn" style="margin-block-start:var(--space-4)">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
          '<span data-i18n="panic.unlock_btn">' + I18n.t('panic.unlock_btn') + '</span>' +
        '</button>' +
      '</div>';

    lockScreen.hidden = false;

    // Hide app content
    var appSection = document.getElementById('app-section');
    if (appSection) appSection.style.filter = 'blur(20px)';

    // Bind events
    var unlockBtn = document.getElementById('panic-unlock-btn');
    var pwdInput = document.getElementById('panic-password');
    var errorDiv = document.getElementById('panic-error');

    setTimeout(function() { pwdInput.focus(); }, 100);

    unlockBtn.addEventListener('click', async function() {
      var pwd = pwdInput.value.trim();
      if (!pwd) return;

      unlockBtn.disabled = true;
      var success = await unlock(pwd);
      unlockBtn.disabled = false;

      if (!success) {
        errorDiv.textContent = I18n.t('crypto.wrong_password');
        errorDiv.hidden = false;
        pwdInput.value = '';
        pwdInput.focus();
      }
    });

    pwdInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') unlockBtn.click();
    });
  }

  function _hideLockScreen() {
    var lockScreen = document.getElementById('panic-lock-screen');
    if (lockScreen) lockScreen.hidden = true;

    var appSection = document.getElementById('app-section');
    if (appSection) appSection.style.filter = '';
  }

  function _startAutoLockTimer() {
    _clearTimers();
    var minutes = getAutoLockMinutes();
    if (minutes <= 0) return;
    _resetActivityTimer();
  }

  function _resetActivityTimer() {
    if (_activityTimer) clearTimeout(_activityTimer);
    var minutes = getAutoLockMinutes();
    if (minutes <= 0 || _isLocked) return;

    _activityTimer = setTimeout(function() {
      if (!_isLocked && auth.currentUser) {
        lock();
      }
    }, minutes * 60 * 1000);
  }

  function _clearTimers() {
    if (_lockTimer) clearTimeout(_lockTimer);
    if (_activityTimer) clearTimeout(_activityTimer);
    _lockTimer = null;
    _activityTimer = null;
  }

  return {
    init: init,
    lock: lock,
    unlock: unlock,
    isLocked: isLocked,
    setAutoLockTimer: setAutoLockTimer,
    getAutoLockMinutes: getAutoLockMinutes
  };
})();
