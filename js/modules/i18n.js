/**
 * SubTracker — Internationalization (i18n) Module
 * Lightweight custom i18n system using JSON locale files
 * Supports: Arabic (RTL) + English (LTR)
 * PRD Section 19: Localization Strategy
 */

const I18n = (function() {
  'use strict';

  const STORAGE_KEY = 'subtracker-lang';
  const SUPPORTED_LANGS = ['en', 'ar'];
  const DEFAULT_LANG = 'en';

  let currentLang = DEFAULT_LANG;
  let translations = {};
  let listeners = [];

  /**
   * Initialize the i18n module
   * Loads saved language preference and fetches translations
   */
  async function init() {
    currentLang = _getSavedLang();
    await _loadTranslations(currentLang);
    _applyDirection(currentLang);
    _translatePage();
    _updateLangToggle();
  }

  /**
   * Switch language between AR and EN
   */
  async function toggleLang() {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    await setLang(newLang);
  }

  /**
   * Set language explicitly
   * @param {string} lang - Language code ('en' or 'ar')
   */
  async function setLang(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) return;
    if (lang === currentLang && Object.keys(translations).length > 0) return;

    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    await _loadTranslations(lang);
    _applyDirection(lang);
    _translatePage();
    _updateLangToggle();
    _notifyListeners(lang);
  }

  /**
   * Get a translation by key with optional interpolation
   * @param {string} key - Translation key (e.g., 'auth.login_title')
   * @param {Object} params - Optional parameters for interpolation
   * @returns {string} Translated string
   */
  function t(key, params = {}) {
    let text = translations[key] || key;

    // Interpolation: replace {{variable}} with values
    Object.keys(params).forEach(function(param) {
      text = text.replace(new RegExp('\\{\\{' + param + '\\}\\}', 'g'), params[param]);
    });

    return text;
  }

  /**
   * Get the current language
   * @returns {string} Current language code
   */
  function getLang() {
    return currentLang;
  }

  /**
   * Check if current language is RTL
   * @returns {boolean}
   */
  function isRTL() {
    return currentLang === 'ar';
  }

  /**
   * Register a callback for language changes
   * @param {Function} callback - Called with new language code
   */
  function onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  }

  /**
   * Re-translate the entire page (useful after DOM updates)
   */
  function translatePage() {
    _translatePage();
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  function _getSavedLang() {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
    // Detect browser language
    var browserLang = navigator.language || navigator.userLanguage || '';
    if (browserLang.startsWith('ar')) {
      return 'ar';
    }
    return DEFAULT_LANG;
  }

  async function _loadTranslations(lang) {
    try {
      var response = await fetch('locales/' + lang + '.json');
      if (!response.ok) throw new Error('Failed to load ' + lang + ' translations');
      translations = await response.json();
    } catch (err) {
      console.error('i18n: Error loading translations for ' + lang, err);
      // Fallback to English if Arabic fails
      if (lang !== DEFAULT_LANG) {
        await _loadTranslations(DEFAULT_LANG);
      }
    }
  }

  function _applyDirection(lang) {
    var dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }

  function _translatePage() {
    // Translate all elements with data-i18n attribute
    var elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var translated = translations[key];
      if (translated) {
        el.textContent = translated;
      }
    });

    // Translate placeholders
    var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var translated = translations[key];
      if (translated) {
        el.setAttribute('placeholder', translated);
      }
    });

    // Translate aria-labels
    var ariaLabels = document.querySelectorAll('[data-i18n-aria]');
    ariaLabels.forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      var translated = translations[key];
      if (translated) {
        el.setAttribute('aria-label', translated);
      }
    });
  }

  function _updateLangToggle() {
    var langLabel = document.getElementById('lang-label');
    if (langLabel) {
      langLabel.textContent = currentLang === 'en' ? 'عربي' : 'English';
    }
  }

  function _notifyListeners(lang) {
    listeners.forEach(function(cb) {
      try { cb(lang); } catch(e) { console.error('i18n listener error:', e); }
    });
  }

  // Public API
  return {
    init: init,
    toggleLang: toggleLang,
    setLang: setLang,
    t: t,
    getLang: getLang,
    isRTL: isRTL,
    onChange: onChange,
    translatePage: translatePage
  };
})();
