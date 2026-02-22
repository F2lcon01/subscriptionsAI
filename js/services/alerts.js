/**
 * SubTracker — Smart Alert Engine
 * Proactive intelligence for subscription management
 * PRD Section 6.4: Smart Alert Engine
 */

const SmartAlerts = (function() {
  'use strict';

  const DISMISSED_KEY = 'subtracker-dismissed-alerts';

  /**
   * Check all alert conditions
   * @returns {Array} alerts
   */
  function checkAll() {
    var subs = SubscriptionService.getAll();
    var active = SubscriptionService.getActive();
    var dismissed = _getDismissed();
    var alerts = [];

    alerts = alerts.concat(_detectDuplicates(active));
    alerts = alerts.concat(_detectSavingsOpportunities(active));
    alerts = alerts.concat(_detectUnused(subs));
    alerts = alerts.concat(_detectTrialExpiring(subs));
    alerts = alerts.concat(_detectHighSpending(active));

    // Filter dismissed
    return alerts.filter(function(a) {
      return !dismissed.includes(a.id);
    });
  }

  /**
   * Dismiss an alert
   */
  function dismiss(alertId) {
    var dismissed = _getDismissed();
    if (!dismissed.includes(alertId)) {
      dismissed.push(alertId);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  }

  /**
   * Detect duplicate/similar subscriptions
   */
  function _detectDuplicates(subs) {
    var alerts = [];
    var categories = {};

    subs.forEach(function(s) {
      var cat = s.category || 'other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s);
    });

    Object.keys(categories).forEach(function(cat) {
      var catSubs = categories[cat];
      if (catSubs.length >= 3) {
        var names = catSubs.map(function(s) { return s.name; }).join(', ');
        alerts.push({
          id: 'dup-' + cat,
          type: 'duplicate',
          icon: '⚠️',
          title: I18n.t('alerts.duplicate_found'),
          message: I18n.t('alerts.duplicate_desc', { count: catSubs.length, category: I18n.t('category.' + cat), names: names }),
          severity: 'warning'
        });
      }
    });

    return alerts;
  }

  /**
   * Detect savings opportunities (monthly → annual)
   */
  function _detectSavingsOpportunities(subs) {
    var alerts = [];
    var monthlySubs = subs.filter(function(s) { return s.billingCycle === 'monthly'; });

    if (monthlySubs.length >= 2) {
      var totalMonthly = monthlySubs.reduce(function(sum, s) {
        return sum + (s.yourShare || s.amount);
      }, 0);
      var potentialSaving = Math.round(totalMonthly * 12 * 0.15); // ~15% savings typical for annual

      if (potentialSaving > 0) {
        alerts.push({
          id: 'savings-annual',
          type: 'savings',
          icon: '💡',
          title: I18n.t('alerts.savings_opportunity'),
          message: I18n.t('alerts.consider_annual', { count: monthlySubs.length, saving: potentialSaving }),
          severity: 'info'
        });
      }
    }

    return alerts;
  }

  /**
   * Detect potentially unused subscriptions
   */
  function _detectUnused(subs) {
    var alerts = [];
    var sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    subs.forEach(function(sub) {
      if (sub.status !== 'active') return;
      if (!sub.startDate) return;

      var start = new Date(sub.startDate);
      if (start < sixMonthsAgo && !sub.notes && !sub.url) {
        alerts.push({
          id: 'unused-' + sub.id,
          type: 'unused',
          icon: '💤',
          title: I18n.t('alerts.unused_sub'),
          message: I18n.t('alerts.unused_desc', { name: sub.name }),
          severity: 'info',
          subId: sub.id
        });
      }
    });

    return alerts.slice(0, 3); // Max 3 unused alerts
  }

  /**
   * Detect trials about to expire
   */
  function _detectTrialExpiring(subs) {
    var alerts = [];

    subs.forEach(function(sub) {
      if (!sub.isTrial || sub.status === 'paused') return;
      var days = SubscriptionService.getDaysRemaining(sub);
      if (days >= 0 && days <= 3) {
        alerts.push({
          id: 'trial-' + sub.id,
          type: 'trial',
          icon: '⏰',
          title: I18n.t('alerts.trial_expiring'),
          message: I18n.t('alerts.trial_expiring_desc', { name: sub.name, days: days }),
          severity: 'warning',
          subId: sub.id
        });
      }
    });

    return alerts;
  }

  /**
   * Detect high spending patterns
   */
  function _detectHighSpending(subs) {
    var alerts = [];
    var stats = SubscriptionService.getStats();

    if (stats.monthlyTotal > 500) {
      alerts.push({
        id: 'high-spending',
        type: 'spending',
        icon: '📊',
        title: I18n.t('alerts.high_spending'),
        message: I18n.t('alerts.high_spending_desc', { amount: Math.round(stats.monthlyTotal) }),
        severity: 'info'
      });
    }

    return alerts;
  }

  function _getDismissed() {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  return {
    checkAll: checkAll,
    dismiss: dismiss
  };
})();
