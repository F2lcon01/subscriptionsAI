/**
 * SubTracker — Settings Module
 * Renders and manages settings page: appearance, language, currency, profile, security, danger zone
 */

const Settings = (function() {
  'use strict';

  let _userProfile = null;

  /**
   * Render settings page
   */
  async function render() {
    var container = document.getElementById('settings-body');
    if (!container) return;

    // Load user profile from Firestore
    try {
      _userProfile = await AuthService.getUserProfile();
    } catch (err) {
      console.error('Settings: failed to load profile', err);
      _userProfile = null;
    }

    container.innerHTML = '<div class="settings">' +
      _appearanceSection() +
      _languageSection() +
      _currencySection() +
      _profileSection() +
      _notificationsSection() +
      _dataSection() +
      _sharingSection() +
      _panicSection() +
      _aiSection() +
      _gamificationSection() +
      _securitySection() +
      _dangerZoneSection() +
    '</div>';

    I18n.translatePage();
    _bindEvents();
  }

  // =============================================
  // SECTION RENDERERS
  // =============================================

  function _appearanceSection() {
    var saved = localStorage.getItem('subtracker-theme');
    var current = saved || 'auto';

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' +
          '<span data-i18n="settings.appearance">Appearance</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div class="settings__segment" id="theme-segment">' +
            '<button class="settings__segment-btn ' + (current === 'light' ? 'settings__segment-btn--active' : '') + '" data-theme="light" data-i18n="settings.theme_light">Light</button>' +
            '<button class="settings__segment-btn ' + (current === 'dark' ? 'settings__segment-btn--active' : '') + '" data-theme="dark" data-i18n="settings.theme_dark">Dark</button>' +
            '<button class="settings__segment-btn ' + (current === 'auto' ? 'settings__segment-btn--active' : '') + '" data-theme="auto" data-i18n="settings.theme_auto">Auto</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _languageSection() {
    var current = I18n.getLang();

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' +
          '<span data-i18n="settings.language">Language</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div class="settings__segment" id="lang-segment">' +
            '<button class="settings__segment-btn ' + (current === 'ar' ? 'settings__segment-btn--active' : '') + '" data-lang="ar" data-i18n="settings.lang_ar">العربية</button>' +
            '<button class="settings__segment-btn ' + (current === 'en' ? 'settings__segment-btn--active' : '') + '" data-lang="en" data-i18n="settings.lang_en">English</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _currencySection() {
    var savedCurrency = (_userProfile && _userProfile.currency) || 'SAR';
    var currencies = SubscriptionService.getCurrencies();
    var options = currencies.map(function(c) {
      return '<option value="' + c.code + '" ' + (c.code === savedCurrency ? 'selected' : '') + '>' + c.code + ' (' + c.symbol + ')</option>';
    }).join('');

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
          '<span data-i18n="settings.currency">Default Currency</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label" data-i18n="settings.currency">Default Currency</div>' +
            '<div class="settings__row-desc" data-i18n="settings.currency_desc">Currency used when adding a new subscription</div>' +
          '</div>' +
          '<select class="settings__select" id="settings-currency">' + options + '</select>' +
        '</div>' +
      '</div>';
  }

  function _profileSection() {
    var user = AuthService.getUser();
    var displayName = (user && user.displayName) || '';

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' +
          '<span data-i18n="settings.profile">Profile</span>' +
        '</h3>' +
        '<div class="settings__form" id="profile-form">' +
          '<div class="settings__form-row">' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="settings-name" data-i18n="settings.display_name">Display Name</label>' +
              '<input class="form-group__input" type="text" id="settings-name" data-i18n-placeholder="settings.display_name_placeholder" placeholder="Enter your name" value="' + _escapeAttr(displayName) + '">' +
              '<span class="form-group__error" id="settings-name-error"></span>' +
            '</div>' +
          '</div>' +
          '<div class="settings__form-actions">' +
            '<button class="btn btn--primary" id="save-profile-btn">' +
              '<span data-i18n="settings.profile_save_btn">Save</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _securitySection() {
    var isEmail = AuthService.isEmailUser();

    var content;
    if (isEmail) {
      content = '' +
        '<div class="settings__password-form" id="password-form">' +
          '<div class="form-group">' +
            '<label class="form-group__label" for="settings-current-password" data-i18n="settings.current_password">Current Password</label>' +
            '<input class="form-group__input" type="password" id="settings-current-password" autocomplete="current-password">' +
            '<span class="form-group__error" id="settings-current-password-error"></span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-group__label" for="settings-new-password" data-i18n="settings.new_password">New Password</label>' +
            '<input class="form-group__input" type="password" id="settings-new-password" autocomplete="new-password">' +
            '<span class="form-group__error" id="settings-new-password-error"></span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-group__label" for="settings-confirm-password" data-i18n="settings.confirm_new_password">Confirm New Password</label>' +
            '<input class="form-group__input" type="password" id="settings-confirm-password" autocomplete="new-password">' +
            '<span class="form-group__error" id="settings-confirm-password-error"></span>' +
          '</div>' +
          '<div class="settings__form-actions">' +
            '<button class="btn btn--primary" id="change-password-btn">' +
              '<span data-i18n="settings.change_password_btn">Change Password</span>' +
            '</button>' +
          '</div>' +
        '</div>';
    } else {
      content = '' +
        '<div class="settings__info">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' +
          '<span data-i18n="settings.google_account_info">You\'re signed in with Google. Password is managed through your Google account settings.</span>' +
        '</div>';
    }

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
          '<span data-i18n="settings.security">Security</span>' +
        '</h3>' +
        content +
      '</div>';
  }

  function _notificationsSection() {
    var permission = NotificationService.getPermission();
    var isGranted = permission === 'granted';

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>' +
          '<span data-i18n="settings.notifications">' + I18n.t('settings.notifications') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.push_notifications') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.push_desc') + '</div>' +
          '</div>' +
          (isGranted
            ? '<span class="settings__badge settings__badge--success">' + I18n.t('settings.enabled') + '</span>'
            : '<button class="btn btn--secondary btn--sm" id="enable-notifications-btn">' + I18n.t('settings.enable') + '</button>') +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.reminder_timing') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.reminder_timing_desc') + '</div>' +
          '</div>' +
          '<select class="settings__select" id="settings-reminder-days">' +
            '<option value="1">1 ' + I18n.t('settings.day_before') + '</option>' +
            '<option value="3" selected>3 ' + I18n.t('settings.days_before') + '</option>' +
            '<option value="7">7 ' + I18n.t('settings.days_before') + '</option>' +
            '<option value="14">14 ' + I18n.t('settings.days_before') + '</option>' +
          '</select>' +
        '</div>' +
      '</div>';
  }

  function _dataSection() {
    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
          '<span data-i18n="settings.data_management">' + I18n.t('settings.data_management') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.export_data') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.export_desc') + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:var(--space-2)">' +
            '<button class="btn btn--secondary btn--sm" id="export-csv-btn">CSV</button>' +
            '<button class="btn btn--secondary btn--sm" id="export-pdf-btn">PDF</button>' +
          '</div>' +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.import_data') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.import_desc') + '</div>' +
          '</div>' +
          '<button class="btn btn--secondary btn--sm" id="import-csv-btn">' + I18n.t('settings.import_csv') + '</button>' +
        '</div>' +
      '</div>';
  }

  function _sharingSection() {
    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
          '<span data-i18n="settings.sharing">' + I18n.t('settings.sharing') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.team_sharing') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.team_sharing_desc') + '</div>' +
          '</div>' +
          '<button class="btn btn--secondary btn--sm" id="generate-share-link-btn">' + I18n.t('settings.generate_link') + '</button>' +
        '</div>' +
        '<div id="active-share-links"></div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.social_share') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.social_share_desc') + '</div>' +
          '</div>' +
          '<button class="btn btn--secondary btn--sm" id="social-share-btn">' + I18n.t('settings.share_now') + '</button>' +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.yearly_wrapped') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.yearly_wrapped_desc') + '</div>' +
          '</div>' +
          '<button class="btn btn--secondary btn--sm" id="yearly-wrapped-btn">' + I18n.t('settings.view_wrapped') + '</button>' +
        '</div>' +
      '</div>';
  }

  function _panicSection() {
    var autoLock = PanicMode.getAutoLockMinutes();
    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' +
          '<span data-i18n="settings.panic_mode">' + I18n.t('settings.panic_mode') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.panic_shortcut') + '</div>' +
            '<div class="settings__row-desc">Ctrl + Shift + L</div>' +
          '</div>' +
          '<button class="btn btn--secondary btn--sm" id="panic-test-btn">' + I18n.t('settings.test_panic') + '</button>' +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.auto_lock') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.auto_lock_desc') + '</div>' +
          '</div>' +
          '<select class="settings__select" id="settings-auto-lock">' +
            '<option value="0" ' + (autoLock === 0 ? 'selected' : '') + '>' + I18n.t('settings.never') + '</option>' +
            '<option value="5" ' + (autoLock === 5 ? 'selected' : '') + '>5 ' + I18n.t('settings.minutes') + '</option>' +
            '<option value="15" ' + (autoLock === 15 ? 'selected' : '') + '>15 ' + I18n.t('settings.minutes') + '</option>' +
            '<option value="30" ' + (autoLock === 30 ? 'selected' : '') + '>30 ' + I18n.t('settings.minutes') + '</option>' +
          '</select>' +
        '</div>' +
      '</div>';
  }

  function _aiSection() {
    var isConfigured = AICompanion.isConfigured();
    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
          '<span data-i18n="settings.ai_companion">' + I18n.t('settings.ai_companion') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.ai_provider') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.ai_provider_desc') + '</div>' +
          '</div>' +
          '<select class="settings__select" id="settings-ai-provider">' +
            '<option value="">' + I18n.t('settings.select_provider') + '</option>' +
            '<option value="openai">OpenAI (GPT)</option>' +
            '<option value="gemini">Google Gemini</option>' +
          '</select>' +
        '</div>' +
        '<div class="settings__row" id="ai-key-row" ' + (!isConfigured ? '' : 'hidden') + '>' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.api_key') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.api_key_desc') + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:var(--space-2)">' +
            '<input type="password" class="input" id="settings-ai-key" placeholder="sk-..." style="width:200px">' +
            '<button class="btn btn--primary btn--sm" id="save-ai-key-btn">' + I18n.t('settings.save') + '</button>' +
          '</div>' +
        '</div>' +
        (isConfigured ? '<div class="settings__row"><span class="settings__badge settings__badge--success">' + I18n.t('settings.ai_configured') + '</span></div>' : '') +
      '</div>';
  }

  function _gamificationSection() {
    var profile = Gamification.getProfile();
    var levelInfo = Gamification.getLevel(profile.xp);
    var score = Gamification.getSubscriptionScore();

    return '' +
      '<div class="settings__section">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
          '<span data-i18n="settings.gamification">' + I18n.t('settings.gamification') + '</span>' +
        '</h3>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + levelInfo.icon + ' ' + I18n.t('level.' + levelInfo.name) + ' (' + I18n.t('settings.level') + ' ' + levelInfo.level + ')</div>' +
            '<div class="settings__row-desc">' + profile.xp + ' XP — ' + I18n.t('settings.next_level') + ': ' + levelInfo.nextLevelXP + ' XP</div>' +
          '</div>' +
          '<div style="width:120px;height:8px;background:var(--color-bg);border-radius:4px;overflow:hidden">' +
            '<div style="width:' + levelInfo.progress + '%;height:100%;background:var(--color-primary);border-radius:4px;transition:width 0.5s"></div>' +
          '</div>' +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.sub_score') + '</div>' +
            '<div class="settings__row-desc">' + I18n.t('settings.sub_score_desc') + '</div>' +
          '</div>' +
          '<span class="settings__badge" style="background:' + (score.total >= 70 ? '#10B981' : score.total >= 40 ? '#F59E0B' : '#EF4444') + ';color:#fff">' + score.total + '/100</span>' +
        '</div>' +
        '<div class="settings__row">' +
          '<div>' +
            '<div class="settings__row-label">' + I18n.t('settings.streak') + '</div>' +
          '</div>' +
          '<span>' + (profile.streak || 0) + ' ' + I18n.t('settings.days') + ' 🔥</span>' +
        '</div>' +
      '</div>';
  }

  function _dangerZoneSection() {
    return '' +
      '<div class="settings__section settings__section--danger">' +
        '<h3 class="settings__section-title">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
          '<span data-i18n="settings.danger_zone">Danger Zone</span>' +
        '</h3>' +
        '<p class="settings__danger-desc" data-i18n="settings.delete_account_desc">Your account and all data will be permanently deleted. This action cannot be undone.</p>' +
        '<button class="btn btn--danger" id="delete-account-btn">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
          '<span data-i18n="settings.delete_account_btn">Delete My Account</span>' +
        '</button>' +
      '</div>';
  }

  // =============================================
  // EVENT BINDING
  // =============================================

  function _bindEvents() {
    // Theme segment
    var themeSegment = document.getElementById('theme-segment');
    if (themeSegment) {
      themeSegment.addEventListener('click', function(e) {
        var btn = e.target.closest('.settings__segment-btn');
        if (!btn) return;
        var theme = btn.getAttribute('data-theme');
        Theme.setTheme(theme);
        // Update active state
        themeSegment.querySelectorAll('.settings__segment-btn').forEach(function(b) {
          b.classList.toggle('settings__segment-btn--active', b === btn);
        });
      });
    }

    // Language segment
    var langSegment = document.getElementById('lang-segment');
    if (langSegment) {
      langSegment.addEventListener('click', function(e) {
        var btn = e.target.closest('.settings__segment-btn');
        if (!btn) return;
        var lang = btn.getAttribute('data-lang');
        if (lang !== I18n.getLang()) {
          I18n.setLang(lang);
        }
      });
    }

    // Currency select
    var currencySelect = document.getElementById('settings-currency');
    if (currencySelect) {
      currencySelect.addEventListener('change', async function() {
        try {
          await AuthService.updateUserProfile({ currency: this.value });
          Toast.success(I18n.t('settings.currency_saved'));
        } catch (err) {
          console.error('Save currency error:', err);
          Toast.error(I18n.t('toast.error'));
        }
      });
    }

    // Save profile
    var saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', async function() {
        var nameInput = document.getElementById('settings-name');
        var name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
          _showFieldError('settings-name', I18n.t('auth.error.name_required'));
          return;
        }
        saveProfileBtn.disabled = true;
        try {
          await AuthService.updateProfile(name);
          Toast.success(I18n.t('settings.profile_saved'));
        } catch (err) {
          console.error('Save profile error:', err);
          Toast.error(I18n.t('toast.error'));
        }
        saveProfileBtn.disabled = false;
      });
    }

    // Change password
    var changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', async function() {
        var currentPw = document.getElementById('settings-current-password').value;
        var newPw = document.getElementById('settings-new-password').value;
        var confirmPw = document.getElementById('settings-confirm-password').value;

        // Clear previous errors
        _clearFieldErrors();

        if (!currentPw) {
          _showFieldError('settings-current-password', I18n.t('settings.error.current_password_required'));
          return;
        }
        if (!newPw) {
          _showFieldError('settings-new-password', I18n.t('settings.error.new_password_required'));
          return;
        }
        if (newPw.length < 6) {
          _showFieldError('settings-new-password', I18n.t('settings.error.password_too_short'));
          return;
        }
        if (newPw !== confirmPw) {
          _showFieldError('settings-confirm-password', I18n.t('auth.error.password_mismatch'));
          return;
        }

        changePasswordBtn.disabled = true;
        try {
          await AuthService.changePassword(currentPw, newPw);
          Toast.success(I18n.t('settings.password_changed'));
          // Clear form
          document.getElementById('settings-current-password').value = '';
          document.getElementById('settings-new-password').value = '';
          document.getElementById('settings-confirm-password').value = '';
        } catch (err) {
          console.error('Change password error:', err);
          if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            _showFieldError('settings-current-password', I18n.t('auth.error.wrong_password'));
          } else if (err.code === 'auth/requires-recent-login') {
            Toast.error(I18n.t('settings.error.reauth_required'));
          } else {
            Toast.error(I18n.t('toast.error'));
          }
        }
        changePasswordBtn.disabled = false;
      });
    }

    // Notifications
    var enableNotifBtn = document.getElementById('enable-notifications-btn');
    if (enableNotifBtn) {
      enableNotifBtn.addEventListener('click', async function() {
        await NotificationService.requestPermission();
        render();
      });
    }

    // Export CSV
    var exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', function() {
        ExportService.exportCSV();
        Gamification.addXP('EXPORT_DATA');
      });
    }

    // Export PDF
    var exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', function() {
        ExportService.exportPDF();
        Gamification.addXP('EXPORT_DATA');
      });
    }

    // Import CSV
    var importCsvBtn = document.getElementById('import-csv-btn');
    if (importCsvBtn) {
      importCsvBtn.addEventListener('click', function() {
        ImportService.renderImportModal();
      });
    }

    // Share link
    var shareLinkBtn = document.getElementById('generate-share-link-btn');
    if (shareLinkBtn) {
      shareLinkBtn.addEventListener('click', async function() {
        try {
          var url = await SharingService.generateShareLink();
          navigator.clipboard.writeText(url);
          Toast.success(I18n.t('settings.link_copied'));
          _loadShareLinks();
        } catch (e) {
          Toast.error(I18n.t('toast.error'));
        }
      });
    }
    _loadShareLinks();

    // Social share
    var socialBtn = document.getElementById('social-share-btn');
    if (socialBtn) {
      socialBtn.addEventListener('click', function() { SocialShare.renderShareModal(); });
    }

    // Yearly wrapped
    var wrappedBtn = document.getElementById('yearly-wrapped-btn');
    if (wrappedBtn) {
      wrappedBtn.addEventListener('click', function() { YearlyWrapped.renderWrapped(); });
    }

    // Panic test
    var panicTestBtn = document.getElementById('panic-test-btn');
    if (panicTestBtn) {
      panicTestBtn.addEventListener('click', function() { PanicMode.lock(); });
    }

    // Auto lock
    var autoLockSelect = document.getElementById('settings-auto-lock');
    if (autoLockSelect) {
      autoLockSelect.addEventListener('change', function() {
        PanicMode.setAutoLockTimer(parseInt(this.value));
      });
    }

    // AI provider
    var aiProviderSelect = document.getElementById('settings-ai-provider');
    if (aiProviderSelect) {
      aiProviderSelect.addEventListener('change', function() {
        var keyRow = document.getElementById('ai-key-row');
        if (keyRow) keyRow.hidden = !this.value;
      });
    }

    // Save AI key
    var saveAiBtn = document.getElementById('save-ai-key-btn');
    if (saveAiBtn) {
      saveAiBtn.addEventListener('click', async function() {
        var provider = document.getElementById('settings-ai-provider').value;
        var key = document.getElementById('settings-ai-key').value.trim();
        if (!provider || !key) {
          Toast.warning(I18n.t('settings.fill_all_fields'));
          return;
        }
        try {
          await AICompanion.setProvider(provider, key);
          Toast.success(I18n.t('settings.ai_saved'));
          render();
        } catch (e) {
          Toast.error(I18n.t('toast.error'));
        }
      });
    }

    // Delete account
    var deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async function() {
        var confirmed = confirm(I18n.t('settings.delete_confirm'));
        if (!confirmed) return;

        deleteBtn.disabled = true;
        try {
          await AuthService.deleteAccount();
          Toast.success(I18n.t('settings.account_deleted'));
        } catch (err) {
          console.error('Delete account error:', err);
          if (err.code === 'auth/requires-recent-login') {
            Toast.error(I18n.t('settings.error.reauth_required'));
          } else {
            Toast.error(I18n.t('toast.error'));
          }
          deleteBtn.disabled = false;
        }
      });
    }
  }

  // =============================================
  // HELPERS
  // =============================================

  function _showFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(inputId + '-error');
    if (input) input.parentElement.classList.add('form-group--error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function _clearFieldErrors() {
    document.querySelectorAll('#settings-body .form-group--error').forEach(function(el) {
      el.classList.remove('form-group--error');
    });
    document.querySelectorAll('#settings-body .form-group__error').forEach(function(el) {
      el.textContent = '';
      el.style.display = '';
    });
  }

  async function _loadShareLinks() {
    var container = document.getElementById('active-share-links');
    if (!container) return;
    try {
      var links = await SharingService.listShareLinks();
      if (links.length === 0) {
        container.innerHTML = '';
        return;
      }
      container.innerHTML = links.map(function(link) {
        return '<div class="settings__row" style="padding-inline-start:var(--space-4)">' +
          '<div><div class="settings__row-label" style="font-size:var(--font-size-sm)">🔗 ' + link.id.substring(0, 8) + '...</div></div>' +
          '<button class="btn btn--ghost btn--sm settings__revoke-btn" data-token="' + link.id + '">' + I18n.t('settings.revoke') + '</button>' +
        '</div>';
      }).join('');
      container.querySelectorAll('.settings__revoke-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          await SharingService.revokeShareLink(btn.dataset.token);
          Toast.success(I18n.t('settings.link_revoked'));
          _loadShareLinks();
        });
      });
    } catch (e) { /* ignore */ }
  }

  function _escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return {
    render: render
  };
})();
