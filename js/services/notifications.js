/**
 * SubTracker — Notification Service
 * Browser push notifications + local renewal reminders
 * PRD Section 6.1: Basic Notifications
 */

const NotificationService = (function() {
  'use strict';

  let _messaging = null;
  let _checkInterval = null;

  /**
   * Initialize notification service
   */
  function init() {
    // Initialize FCM if available
    if (typeof firebase !== 'undefined' && firebase.messaging && firebase.messaging.isSupported()) {
      try {
        _messaging = firebase.messaging();
      } catch (e) {
        console.warn('FCM init failed:', e);
      }
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} 'granted' | 'denied' | 'default'
   */
  async function requestPermission() {
    if (!('Notification' in window)) return 'denied';

    var permission = await Notification.requestPermission();

    if (permission === 'granted' && _messaging) {
      try {
        var token = await _messaging.getToken({
          vapidKey: '' // Will need a VAPID key from Firebase Console
        });
        if (token) {
          await saveToken(token);
        }
      } catch (e) {
        console.warn('FCM token error:', e);
      }
    }

    return permission;
  }

  /**
   * Get current permission status
   */
  function getPermission() {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  /**
   * Save FCM token to Firestore
   */
  async function saveToken(token) {
    var user = auth.currentUser;
    if (!user || !token) return;

    await db.collection('users').doc(user.uid).update({
      fcmTokens: firebase.firestore.FieldValue.arrayUnion(token),
      notificationsEnabled: true
    });
  }

  /**
   * Check upcoming renewals and show local notifications
   */
  function checkUpcomingRenewals() {
    if (Notification.permission !== 'granted') return;

    var subs = SubscriptionService.getAll();
    var now = new Date();

    subs.forEach(function(sub) {
      if (sub.status === 'paused') return;

      var days = SubscriptionService.getDaysRemaining(sub);
      var notifyDays = sub.notifyDaysBefore || 3;

      // Notify if within the notification window
      if (days >= 0 && days <= notifyDays) {
        var notifKey = 'subtracker-notified-' + sub.id + '-' + sub.nextRenewalDate;
        if (localStorage.getItem(notifKey)) return; // Already notified

        var title = sub.isTrial
          ? I18n.t('notifications.trial_expiry_title')
          : I18n.t('notifications.renewal_title');
        var body = sub.isTrial
          ? I18n.t('notifications.trial_expiry_body', { name: sub.name, days: days })
          : I18n.t('notifications.renewal_body', { name: sub.name, days: days, amount: sub.yourShare || sub.amount });

        _showNotification(title, body);
        localStorage.setItem(notifKey, 'true');
      }
    });

    // Update badge count
    _updateBadge(subs);
  }

  /**
   * Show a local notification
   */
  function _showNotification(title, body) {
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body: body,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/icon-192.png',
        tag: 'subtracker-renewal'
      });
    } catch (e) {
      // Fallback for mobile — use SW
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(function(reg) {
          reg.showNotification(title, {
            body: body,
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-192.png'
          });
        });
      }
    }
  }

  /**
   * Update app badge with upcoming renewal count
   */
  function _updateBadge(subs) {
    if (!('setAppBadge' in navigator)) return;

    var now = new Date();
    var threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    var count = subs.filter(function(s) {
      if (s.status === 'paused') return false;
      var d = new Date(s.nextRenewalDate || s.trialEndDate);
      return d >= now && d <= threeDays;
    }).length;

    if (count > 0) {
      navigator.setAppBadge(count).catch(function() {});
    } else {
      navigator.clearAppBadge().catch(function() {});
    }
  }

  /**
   * Start periodic checking (every hour)
   */
  function startPeriodicCheck() {
    checkUpcomingRenewals();
    _checkInterval = setInterval(checkUpcomingRenewals, 60 * 60 * 1000);
  }

  /**
   * Stop periodic checking
   */
  function stopPeriodicCheck() {
    if (_checkInterval) {
      clearInterval(_checkInterval);
      _checkInterval = null;
    }
  }

  return {
    init: init,
    requestPermission: requestPermission,
    getPermission: getPermission,
    saveToken: saveToken,
    checkUpcomingRenewals: checkUpcomingRenewals,
    startPeriodicCheck: startPeriodicCheck,
    stopPeriodicCheck: stopPeriodicCheck
  };
})();
