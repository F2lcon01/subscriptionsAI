/**
 * SubTracker — Crypto Service
 * AES-256-GCM encryption with PBKDF2 key derivation
 * Uses Web Crypto API for client-side credential encryption
 * PRD Section 21: Security — Password Encryption Flow
 */

const CryptoService = (function() {
  'use strict';

  const SALT_LENGTH = 16;
  const IV_LENGTH = 12;
  const ITERATIONS = 100000;
  const KEY_LENGTH = 256;
  const HASH_ITERATIONS = 200000;

  let _masterKeyCache = null;
  let _masterPasswordVerified = false;

  /**
   * Derive an AES-256-GCM key from a password + salt
   */
  async function _deriveKey(password, salt) {
    var encoder = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Hash a master password for storage verification
   */
  async function _hashPassword(password, salt) {
    var encoder = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    var bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt, iterations: HASH_ITERATIONS, hash: 'SHA-256' },
      keyMaterial, KEY_LENGTH
    );
    return _bufferToBase64(new Uint8Array(bits));
  }

  /**
   * Encrypt plaintext with master password
   * @returns {string} base64(salt + iv + ciphertext)
   */
  async function encrypt(plaintext, masterPassword) {
    if (!plaintext) return '';

    var encoder = new TextEncoder();
    var salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    var iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    var key = _masterKeyCache;
    if (!key) {
      key = await _deriveKey(masterPassword, salt);
    }

    var encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine salt + iv + ciphertext into single buffer
    var combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return _bufferToBase64(combined);
  }

  /**
   * Decrypt encrypted text with master password
   * @param {string} encryptedB64 - base64(salt + iv + ciphertext)
   * @returns {string} plaintext
   */
  async function decrypt(encryptedB64, masterPassword) {
    if (!encryptedB64) return '';

    try {
      var combined = _base64ToBuffer(encryptedB64);
      var salt = combined.slice(0, SALT_LENGTH);
      var iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      var ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

      var key = await _deriveKey(masterPassword, salt);

      var decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error('Decryption failed:', err);
      throw new Error('decryption_failed');
    }
  }

  /**
   * Check if user has set up a master password
   */
  async function hasMasterPassword() {
    var user = auth.currentUser;
    if (!user) return false;

    var doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) return false;
    var data = doc.data();
    return !!(data && data.masterPasswordHash);
  }

  /**
   * Set up master password for first time
   */
  async function setupMasterPassword(password) {
    var user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    var salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    var hash = await _hashPassword(password, salt);

    await db.collection('users').doc(user.uid).update({
      masterPasswordHash: hash,
      masterPasswordSalt: _bufferToBase64(salt)
    });

    _masterPasswordVerified = true;
    _masterKeyCache = null; // Will be derived per-operation with proper salt
  }

  /**
   * Verify master password against stored hash
   */
  async function verifyMasterPassword(password) {
    var user = auth.currentUser;
    if (!user) return false;

    var doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) return false;
    var data = doc.data();

    if (!data.masterPasswordHash || !data.masterPasswordSalt) return false;

    var salt = _base64ToBuffer(data.masterPasswordSalt);
    var hash = await _hashPassword(password, salt);

    if (hash === data.masterPasswordHash) {
      _masterPasswordVerified = true;
      return true;
    }
    return false;
  }

  /**
   * Check if master password is verified in this session
   */
  function isVerified() {
    return _masterPasswordVerified;
  }

  /**
   * Clear cached key and verification state
   */
  function clearCache() {
    _masterKeyCache = null;
    _masterPasswordVerified = false;
  }

  /**
   * Show master password prompt modal
   * @returns {Promise<string|null>} master password or null if cancelled
   */
  function promptMasterPassword(isSetup) {
    return new Promise(function(resolve) {
      var existingModal = document.getElementById('master-password-modal');
      if (existingModal) existingModal.remove();

      var title = isSetup ? I18n.t('crypto.setup_title') : I18n.t('crypto.verify_title');
      var subtitle = isSetup ? I18n.t('crypto.setup_subtitle') : I18n.t('crypto.verify_subtitle');
      var btnText = isSetup ? I18n.t('crypto.setup_btn') : I18n.t('crypto.verify_btn');

      var modal = document.createElement('div');
      modal.id = 'master-password-modal';
      modal.className = 'modal';
      modal.innerHTML = '' +
        '<div class="modal__backdrop" id="mp-backdrop"></div>' +
        '<div class="modal__content" style="max-width:420px">' +
          '<div class="modal__header">' +
            '<h2 class="modal__title">' + title + '</h2>' +
            '<button class="modal__close" id="mp-close">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
            '</button>' +
          '</div>' +
          '<p style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin-block-end:var(--space-4)">' + subtitle + '</p>' +
          '<div class="form-group">' +
            '<label class="form-group__label">' + I18n.t('crypto.master_password') + '</label>' +
            '<input type="password" class="form-group__input" id="mp-password" autocomplete="off" placeholder="••••••••">' +
            '<div class="form-group__error" id="mp-error" hidden></div>' +
          '</div>' +
          (isSetup ? '' +
            '<div class="form-group" style="margin-block-start:var(--space-3)">' +
              '<label class="form-group__label">' + I18n.t('crypto.confirm_password') + '</label>' +
              '<input type="password" class="form-group__input" id="mp-confirm" autocomplete="off" placeholder="••••••••">' +
            '</div>' : '') +
          '<div style="display:flex;gap:var(--space-3);margin-block-start:var(--space-5)">' +
            '<button class="btn btn--primary" id="mp-submit" style="flex:1">' + btnText + '</button>' +
            '<button class="btn btn--ghost" id="mp-cancel">' + I18n.t('common.cancel') + '</button>' +
          '</div>' +
        '</div>';

      document.body.appendChild(modal);
      requestAnimationFrame(function() { modal.classList.add('modal--visible'); });

      var pwdInput = document.getElementById('mp-password');
      var errorDiv = document.getElementById('mp-error');
      setTimeout(function() { pwdInput.focus(); }, 100);

      function close(result) {
        modal.classList.remove('modal--visible');
        modal.classList.add('modal--closing');
        setTimeout(function() { modal.remove(); }, 250);
        resolve(result);
      }

      document.getElementById('mp-close').onclick = function() { close(null); };
      document.getElementById('mp-cancel').onclick = function() { close(null); };
      document.getElementById('mp-backdrop').onclick = function() { close(null); };

      document.getElementById('mp-submit').onclick = async function() {
        var pwd = pwdInput.value.trim();
        if (!pwd || pwd.length < 4) {
          errorDiv.textContent = I18n.t('crypto.password_too_short');
          errorDiv.hidden = false;
          return;
        }

        if (isSetup) {
          var confirm = document.getElementById('mp-confirm').value.trim();
          if (pwd !== confirm) {
            errorDiv.textContent = I18n.t('auth.error.password_mismatch');
            errorDiv.hidden = false;
            return;
          }
          try {
            await setupMasterPassword(pwd);
            close(pwd);
          } catch (e) {
            errorDiv.textContent = I18n.t('crypto.setup_error');
            errorDiv.hidden = false;
          }
        } else {
          var valid = await verifyMasterPassword(pwd);
          if (valid) {
            close(pwd);
          } else {
            errorDiv.textContent = I18n.t('crypto.wrong_password');
            errorDiv.hidden = false;
          }
        }
      };

      // Enter key submits
      modal.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') document.getElementById('mp-submit').click();
        if (e.key === 'Escape') close(null);
      });
    });
  }

  /**
   * Get master password (prompts if not verified)
   * @returns {Promise<string|null>}
   */
  async function getMasterPassword() {
    var hasMP = await hasMasterPassword();
    if (!hasMP) {
      return promptMasterPassword(true);
    }
    if (_masterPasswordVerified && _cachedMasterPwd) {
      return _cachedMasterPwd;
    }
    var pwd = await promptMasterPassword(false);
    if (pwd) _cachedMasterPwd = pwd;
    return pwd;
  }

  var _cachedMasterPwd = null;

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  function _bufferToBase64(buffer) {
    var binary = '';
    for (var i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  function _base64ToBuffer(base64) {
    var binary = atob(base64);
    var buffer = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
  }

  return {
    encrypt: encrypt,
    decrypt: decrypt,
    hasMasterPassword: hasMasterPassword,
    setupMasterPassword: setupMasterPassword,
    verifyMasterPassword: verifyMasterPassword,
    isVerified: isVerified,
    clearCache: function() {
      clearCache();
      _cachedMasterPwd = null;
    },
    promptMasterPassword: promptMasterPassword,
    getMasterPassword: getMasterPassword
  };
})();
