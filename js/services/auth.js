/**
 * SubTracker — Authentication Service
 * Handles Firebase Auth: Email/Password + Google OAuth
 * PRD Section 14: API Design & Authentication
 */

const AuthService = (function() {
  'use strict';

  const AUTH_SECTION = 'auth-section';
  const APP_SECTION = 'app-section';

  let currentUser = null;
  let currentView = 'login'; // 'login' | 'register' | 'reset'

  /**
   * Initialize auth — listen for auth state changes
   */
  function init() {
    auth.onAuthStateChanged(function(user) {
      currentUser = user;
      if (user) {
        _showApp(user);
      } else {
        _showAuth();
      }
      // Hide loading overlay
      var overlay = document.getElementById('loading-overlay');
      if (overlay) {
        overlay.classList.add('loading-overlay--hidden');
        setTimeout(function() { overlay.hidden = true; }, 300);
      }
    });
  }

  /**
   * Register with email and password
   * @param {string} email
   * @param {string} password
   * @param {string} firstName
   * @param {string} lastName
   */
  async function register(email, password, firstName, lastName) {
    var credential = await auth.createUserWithEmailAndPassword(email, password);
    var user = credential.user;

    // Update display name
    var displayName = (firstName + ' ' + lastName).trim();
    await user.updateProfile({ displayName: displayName });

    // Create user profile in Firestore
    await db.collection('users').doc(user.uid).set({
      name: displayName,
      email: email,
      language: I18n.getLang(),
      theme: Theme.getTheme(),
      currency: 'SAR',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    Toast.success(I18n.t('toast.registered'));
    return user;
  }

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   */
  async function login(email, password) {
    var credential = await auth.signInWithEmailAndPassword(email, password);
    return credential.user;
  }

  /**
   * Sign in with Google OAuth
   */
  async function loginWithGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    var result = await auth.signInWithPopup(provider);
    var user = result.user;

    // Check if this is a new user — create Firestore profile
    if (result.additionalUserInfo && result.additionalUserInfo.isNewUser) {
      await db.collection('users').doc(user.uid).set({
        name: user.displayName || '',
        email: user.email || '',
        language: I18n.getLang(),
        theme: Theme.getTheme(),
        currency: 'SAR',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      Toast.success(I18n.t('toast.registered'));
    }

    return user;
  }

  /**
   * Send password reset email
   * @param {string} email
   */
  async function resetPassword(email) {
    await auth.sendPasswordResetEmail(email);
  }

  /**
   * Sign out
   */
  async function logout() {
    await auth.signOut();
    Toast.info(I18n.t('toast.logged_out'));
  }

  /**
   * Get the current user
   * @returns {Object|null} Firebase user object
   */
  function getUser() {
    return currentUser;
  }

  /**
   * Check if the current user signed in with email/password
   * @returns {boolean}
   */
  function isEmailUser() {
    if (!currentUser) return false;
    return currentUser.providerData.some(function(p) {
      return p.providerId === 'password';
    });
  }

  /**
   * Reauthenticate with email/password
   * @param {string} password - Current password
   */
  async function reauthenticate(password) {
    var user = auth.currentUser;
    if (!user || !user.email) throw new Error('No user');
    var credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  }

  /**
   * Change password (requires reauthentication)
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  async function changePassword(currentPassword, newPassword) {
    await reauthenticate(currentPassword);
    await auth.currentUser.updatePassword(newPassword);
  }

  /**
   * Update display name
   * @param {string} displayName
   */
  async function updateProfile(displayName) {
    var user = auth.currentUser;
    if (!user) throw new Error('No user');
    await user.updateProfile({ displayName: displayName });
    await db.collection('users').doc(user.uid).update({
      name: displayName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    currentUser = auth.currentUser;
    var nameEl = document.getElementById('user-display-name');
    if (nameEl) nameEl.textContent = displayName;
  }

  /**
   * Get the user profile from Firestore
   * @returns {Promise<Object>}
   */
  async function getUserProfile() {
    var user = auth.currentUser;
    if (!user) return null;
    var doc = await db.collection('users').doc(user.uid).get();
    return doc.exists ? doc.data() : null;
  }

  /**
   * Update user profile fields in Firestore
   * @param {Object} data - Fields to update
   */
  async function updateUserProfile(data) {
    var user = auth.currentUser;
    if (!user) throw new Error('No user');
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('users').doc(user.uid).update(data);
  }

  /**
   * Delete the current user's account and all data
   */
  async function deleteAccount() {
    var user = auth.currentUser;
    if (!user) throw new Error('No user');

    var subsSnapshot = await db.collection('users').doc(user.uid)
      .collection('subscriptions').get();
    var batch = db.batch();
    subsSnapshot.forEach(function(doc) {
      batch.delete(doc.ref);
    });
    await batch.commit();

    await db.collection('users').doc(user.uid).delete();
    await user.delete();
  }

  // =============================================
  // AUTH UI RENDERING
  // =============================================

  function _showAuth() {
    document.getElementById(APP_SECTION).hidden = true;
    document.getElementById(AUTH_SECTION).hidden = false;
    _renderAuthView();
  }

  function _showApp(user) {
    document.getElementById(AUTH_SECTION).hidden = true;
    document.getElementById(APP_SECTION).hidden = false;

    // Update user info in header
    var nameEl = document.getElementById('user-display-name');
    var emailEl = document.getElementById('user-display-email');
    if (nameEl) nameEl.textContent = user.displayName || '';
    if (emailEl) emailEl.textContent = user.email || '';

    // Welcome toast for returning users
    if (user.displayName) {
      Toast.success(I18n.t('toast.welcome', { name: user.displayName.split(' ')[0] }));
    }

    // Initialize router after app is visible
    Router.init();

    // Initialize subscriptions and render pages
    App.onAppReady();
  }

  function _renderAuthView() {
    var section = document.getElementById(AUTH_SECTION);

    if (currentView === 'login') {
      section.innerHTML = _loginHTML();
    } else if (currentView === 'register') {
      section.innerHTML = _registerHTML();
    } else if (currentView === 'reset') {
      section.innerHTML = _resetHTML();
    }

    // Translate the newly rendered HTML
    I18n.translatePage();
    _bindAuthEvents();
  }

  function _loginHTML() {
    return '' +
      '<div class="auth__controls">' +
        '<button class="header-btn" id="auth-lang-btn" aria-label="Toggle language">' +
          '<span id="auth-lang-label">' + (I18n.getLang() === 'en' ? 'عربي' : 'English') + '</span>' +
        '</button>' +
        '<button class="header-btn" id="auth-theme-btn" aria-label="Toggle theme">' +
          '<svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="5"></circle>' +
            '<line x1="12" y1="1" x2="12" y2="3"></line>' +
            '<line x1="12" y1="21" x2="12" y2="23"></line>' +
            '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
            '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
            '<line x1="1" y1="12" x2="3" y2="12"></line>' +
            '<line x1="21" y1="12" x2="23" y2="12"></line>' +
            '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
            '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
          '</svg>' +
          '<svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="auth__card">' +
        '<div class="auth__header">' +
          '<div class="auth__logo">📊</div>' +
          '<h1 class="auth__title" data-i18n="auth.login_title">Welcome Back</h1>' +
          '<p class="auth__subtitle" data-i18n="auth.login_subtitle">Sign in to manage your subscriptions</p>' +
        '</div>' +
        '<div class="auth__error" id="auth-error" role="alert"></div>' +
        '<form class="auth__form" id="login-form" novalidate>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="login-email" data-i18n="auth.email">Email Address</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>' +
              '<polyline points="22,6 12,13 2,6"></polyline>' +
            '</svg>' +
            '<input class="form-group__input" type="email" id="login-email" data-i18n-placeholder="auth.email_placeholder" placeholder="Enter your email" autocomplete="email" required>' +
            '<span class="form-group__error" id="login-email-error"></span>' +
          '</div>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="login-password" data-i18n="auth.password">Password</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
              '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
            '</svg>' +
            '<input class="form-group__input" type="password" id="login-password" data-i18n-placeholder="auth.password_placeholder" placeholder="Enter your password" autocomplete="current-password" required>' +
            '<button type="button" class="form-group__toggle" id="login-password-toggle" aria-label="Toggle password visibility">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                '<circle cx="12" cy="12" r="3"></circle>' +
              '</svg>' +
            '</button>' +
            '<span class="form-group__error" id="login-password-error"></span>' +
          '</div>' +
          '<a href="#" class="auth__forgot" id="forgot-password-link" data-i18n="auth.forgot_password">Forgot password?</a>' +
          '<button type="submit" class="btn btn--primary btn--full" id="login-submit-btn">' +
            '<span data-i18n="auth.login_btn">Sign In</span>' +
          '</button>' +
        '</form>' +
        '<div class="divider"><span data-i18n="auth.or">or</span></div>' +
        '<button class="btn btn--google btn--full" id="google-signin-btn">' +
          '<svg width="20" height="20" viewBox="0 0 24 24">' +
            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>' +
            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
            '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
          '</svg>' +
          '<span data-i18n="auth.google_btn">Continue with Google</span>' +
        '</button>' +
        '<div class="auth__footer">' +
          '<span data-i18n="auth.no_account">Don\'t have an account?</span> ' +
          '<a class="auth__footer-link" id="go-to-register" data-i18n="auth.register_link">Sign Up</a>' +
        '</div>' +
      '</div>';
  }

  function _registerHTML() {
    return '' +
      '<div class="auth__controls">' +
        '<button class="header-btn" id="auth-lang-btn" aria-label="Toggle language">' +
          '<span id="auth-lang-label">' + (I18n.getLang() === 'en' ? 'عربي' : 'English') + '</span>' +
        '</button>' +
        '<button class="header-btn" id="auth-theme-btn" aria-label="Toggle theme">' +
          '<svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="5"></circle>' +
            '<line x1="12" y1="1" x2="12" y2="3"></line>' +
            '<line x1="12" y1="21" x2="12" y2="23"></line>' +
            '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
            '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
            '<line x1="1" y1="12" x2="3" y2="12"></line>' +
            '<line x1="21" y1="12" x2="23" y2="12"></line>' +
            '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
            '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
          '</svg>' +
          '<svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="auth__card">' +
        '<div class="auth__header">' +
          '<div class="auth__logo">📊</div>' +
          '<h1 class="auth__title" data-i18n="auth.register_title">Create Account</h1>' +
          '<p class="auth__subtitle" data-i18n="auth.register_subtitle">Start tracking your subscriptions for free</p>' +
        '</div>' +
        '<div class="auth__error" id="auth-error" role="alert"></div>' +
        '<form class="auth__form" id="register-form" novalidate>' +
          '<div class="auth__name-row">' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="register-first-name" data-i18n="auth.first_name">First Name</label>' +
              '<input class="form-group__input" type="text" id="register-first-name" data-i18n-placeholder="auth.first_name_placeholder" placeholder="First name" autocomplete="given-name" required>' +
              '<span class="form-group__error" id="register-first-name-error"></span>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="register-last-name" data-i18n="auth.last_name">Last Name</label>' +
              '<input class="form-group__input" type="text" id="register-last-name" data-i18n-placeholder="auth.last_name_placeholder" placeholder="Last name" autocomplete="family-name" required>' +
              '<span class="form-group__error" id="register-last-name-error"></span>' +
            '</div>' +
          '</div>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="register-email" data-i18n="auth.email">Email Address</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>' +
              '<polyline points="22,6 12,13 2,6"></polyline>' +
            '</svg>' +
            '<input class="form-group__input" type="email" id="register-email" data-i18n-placeholder="auth.email_placeholder" placeholder="Enter your email" autocomplete="email" required>' +
            '<span class="form-group__error" id="register-email-error"></span>' +
          '</div>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="register-password" data-i18n="auth.password">Password</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
              '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
            '</svg>' +
            '<input class="form-group__input" type="password" id="register-password" data-i18n-placeholder="auth.password_placeholder" placeholder="Enter your password" autocomplete="new-password" required minlength="6">' +
            '<button type="button" class="form-group__toggle" id="register-password-toggle" aria-label="Toggle password visibility">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                '<circle cx="12" cy="12" r="3"></circle>' +
              '</svg>' +
            '</button>' +
            '<span class="form-group__error" id="register-password-error"></span>' +
          '</div>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="register-confirm-password" data-i18n="auth.confirm_password">Confirm Password</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
              '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
            '</svg>' +
            '<input class="form-group__input" type="password" id="register-confirm-password" data-i18n-placeholder="auth.confirm_password_placeholder" placeholder="Re-enter your password" autocomplete="new-password" required>' +
            '<span class="form-group__error" id="register-confirm-password-error"></span>' +
          '</div>' +
          '<button type="submit" class="btn btn--primary btn--full" id="register-submit-btn">' +
            '<span data-i18n="auth.register_btn">Create Account</span>' +
          '</button>' +
        '</form>' +
        '<div class="divider"><span data-i18n="auth.or">or</span></div>' +
        '<button class="btn btn--google btn--full" id="google-signin-btn">' +
          '<svg width="20" height="20" viewBox="0 0 24 24">' +
            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>' +
            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
            '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
          '</svg>' +
          '<span data-i18n="auth.google_btn">Continue with Google</span>' +
        '</button>' +
        '<div class="auth__footer">' +
          '<span data-i18n="auth.have_account">Already have an account?</span> ' +
          '<a class="auth__footer-link" id="go-to-login" data-i18n="auth.login_link">Sign In</a>' +
        '</div>' +
      '</div>';
  }

  function _resetHTML() {
    return '' +
      '<div class="auth__controls">' +
        '<button class="header-btn" id="auth-lang-btn" aria-label="Toggle language">' +
          '<span id="auth-lang-label">' + (I18n.getLang() === 'en' ? 'عربي' : 'English') + '</span>' +
        '</button>' +
        '<button class="header-btn" id="auth-theme-btn" aria-label="Toggle theme">' +
          '<svg class="icon-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="12" cy="12" r="5"></circle>' +
            '<line x1="12" y1="1" x2="12" y2="3"></line>' +
            '<line x1="12" y1="21" x2="12" y2="23"></line>' +
            '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
            '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
            '<line x1="1" y1="12" x2="3" y2="12"></line>' +
            '<line x1="21" y1="12" x2="23" y2="12"></line>' +
            '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
            '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
          '</svg>' +
          '<svg class="icon-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="auth__card">' +
        '<div class="auth__header">' +
          '<div class="auth__logo">🔑</div>' +
          '<h1 class="auth__title" data-i18n="auth.reset_title">Reset Password</h1>' +
          '<p class="auth__subtitle" data-i18n="auth.reset_subtitle">Enter your email to receive a reset link</p>' +
        '</div>' +
        '<div class="auth__error" id="auth-error" role="alert"></div>' +
        '<form class="auth__form" id="reset-form" novalidate>' +
          '<div class="form-group form-group--icon">' +
            '<label class="form-group__label" for="reset-email" data-i18n="auth.email">Email Address</label>' +
            '<svg class="form-group__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>' +
              '<polyline points="22,6 12,13 2,6"></polyline>' +
            '</svg>' +
            '<input class="form-group__input" type="email" id="reset-email" data-i18n-placeholder="auth.email_placeholder" placeholder="Enter your email" autocomplete="email" required>' +
            '<span class="form-group__error" id="reset-email-error"></span>' +
          '</div>' +
          '<button type="submit" class="btn btn--primary btn--full" id="reset-submit-btn">' +
            '<span data-i18n="auth.reset_btn">Send Reset Link</span>' +
          '</button>' +
        '</form>' +
        '<div class="auth__footer">' +
          '<a class="auth__footer-link" id="go-to-login" data-i18n="auth.back_to_login">Back to Sign In</a>' +
        '</div>' +
      '</div>';
  }

  // =============================================
  // EVENT BINDING
  // =============================================

  function _bindAuthEvents() {
    // Language toggle on auth pages
    var authLangBtn = document.getElementById('auth-lang-btn');
    if (authLangBtn) {
      authLangBtn.addEventListener('click', function() {
        I18n.toggleLang().then(function() {
          _renderAuthView(); // Re-render with new language
        });
      });
    }

    // Theme toggle on auth pages
    var authThemeBtn = document.getElementById('auth-theme-btn');
    if (authThemeBtn) {
      authThemeBtn.addEventListener('click', function() {
        Theme.toggle();
      });
    }

    // Google Sign-In
    var googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async function() {
        googleBtn.disabled = true;
        try {
          await loginWithGoogle();
        } catch (err) {
          _showAuthError(_mapFirebaseError(err));
          googleBtn.disabled = false;
        }
      });
    }

    // Navigation between auth views
    var goToRegister = document.getElementById('go-to-register');
    if (goToRegister) {
      goToRegister.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'register';
        _renderAuthView();
      });
    }

    var goToLogin = document.getElementById('go-to-login');
    if (goToLogin) {
      goToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'login';
        _renderAuthView();
      });
    }

    var forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        currentView = 'reset';
        _renderAuthView();
      });
    }

    // Login form submit
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        _clearErrors();

        var email = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;

        // Validation
        if (!email) return _showFieldError('login-email', I18n.t('auth.error.email_required'));
        if (!_isValidEmail(email)) return _showFieldError('login-email', I18n.t('auth.error.email_invalid'));
        if (!password) return _showFieldError('login-password', I18n.t('auth.error.password_required'));

        var submitBtn = document.getElementById('login-submit-btn');
        submitBtn.disabled = true;

        try {
          await login(email, password);
        } catch (err) {
          _showAuthError(_mapFirebaseError(err));
          submitBtn.disabled = false;
        }
      });
    }

    // Register form submit
    var registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        _clearErrors();

        var firstName = document.getElementById('register-first-name').value.trim();
        var lastName = document.getElementById('register-last-name').value.trim();
        var email = document.getElementById('register-email').value.trim();
        var password = document.getElementById('register-password').value;
        var confirmPassword = document.getElementById('register-confirm-password').value;

        // Validation
        if (!firstName) return _showFieldError('register-first-name', I18n.t('auth.error.name_required'));
        if (!lastName) return _showFieldError('register-last-name', I18n.t('auth.error.name_required'));
        if (!email) return _showFieldError('register-email', I18n.t('auth.error.email_required'));
        if (!_isValidEmail(email)) return _showFieldError('register-email', I18n.t('auth.error.email_invalid'));
        if (!password) return _showFieldError('register-password', I18n.t('auth.error.password_required'));
        if (password.length < 6) return _showFieldError('register-password', I18n.t('auth.error.password_min'));
        if (password !== confirmPassword) return _showFieldError('register-confirm-password', I18n.t('auth.error.password_mismatch'));

        var submitBtn = document.getElementById('register-submit-btn');
        submitBtn.disabled = true;

        try {
          await register(email, password, firstName, lastName);
        } catch (err) {
          _showAuthError(_mapFirebaseError(err));
          submitBtn.disabled = false;
        }
      });
    }

    // Reset form submit
    var resetForm = document.getElementById('reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        _clearErrors();

        var email = document.getElementById('reset-email').value.trim();

        if (!email) return _showFieldError('reset-email', I18n.t('auth.error.email_required'));
        if (!_isValidEmail(email)) return _showFieldError('reset-email', I18n.t('auth.error.email_invalid'));

        var submitBtn = document.getElementById('reset-submit-btn');
        submitBtn.disabled = true;

        try {
          await resetPassword(email);
          Toast.success(I18n.t('auth.reset_success'));
          currentView = 'login';
          _renderAuthView();
        } catch (err) {
          _showAuthError(_mapFirebaseError(err));
          submitBtn.disabled = false;
        }
      });
    }

    // Password visibility toggles
    _bindPasswordToggle('login-password-toggle', 'login-password');
    _bindPasswordToggle('register-password-toggle', 'register-password');
  }

  // =============================================
  // HELPERS
  // =============================================

  function _bindPasswordToggle(toggleId, inputId) {
    var toggle = document.getElementById(toggleId);
    var input = document.getElementById(inputId);
    if (!toggle || !input) return;

    toggle.addEventListener('click', function() {
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  function _showFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(inputId + '-error');
    if (input) input.parentElement.classList.add('form-group--error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function _showAuthError(message) {
    var errorEl = document.getElementById('auth-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('auth__error--visible');
    }
  }

  function _clearErrors() {
    // Clear field errors
    document.querySelectorAll('.form-group--error').forEach(function(el) {
      el.classList.remove('form-group--error');
    });
    document.querySelectorAll('.form-group__error').forEach(function(el) {
      el.textContent = '';
      el.style.display = '';
    });
    // Clear auth error
    var authError = document.getElementById('auth-error');
    if (authError) {
      authError.textContent = '';
      authError.classList.remove('auth__error--visible');
    }
  }

  function _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function _mapFirebaseError(err) {
    var code = err.code || '';
    var errorMap = {
      'auth/wrong-password': 'auth.error.wrong_password',
      'auth/user-not-found': 'auth.error.user_not_found',
      'auth/email-already-in-use': 'auth.error.email_in_use',
      'auth/too-many-requests': 'auth.error.too_many_requests',
      'auth/network-request-failed': 'auth.error.network',
      'auth/popup-closed-by-user': 'auth.error.popup_closed',
      'auth/invalid-credential': 'auth.error.wrong_password',
      'auth/invalid-email': 'auth.error.email_invalid'
    };

    var key = errorMap[code] || 'auth.error.generic';
    return I18n.t(key);
  }

  // Public API
  return {
    init: init,
    register: register,
    login: login,
    loginWithGoogle: loginWithGoogle,
    resetPassword: resetPassword,
    logout: logout,
    getUser: getUser,
    isEmailUser: isEmailUser,
    changePassword: changePassword,
    updateProfile: updateProfile,
    getUserProfile: getUserProfile,
    updateUserProfile: updateUserProfile,
    deleteAccount: deleteAccount
  };
})();
