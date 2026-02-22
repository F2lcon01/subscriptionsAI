/**
 * SubTracker — Subscription Service
 * Handles all Firestore CRUD operations for subscriptions
 * PRD Section 12.2: Firestore Schema
 */

const SubscriptionService = (function() {
  'use strict';

  /* ============================================
     POPULAR SERVICES DATABASE
     Quick-select when adding a subscription
     ============================================ */
  const POPULAR_SERVICES = [
    { id: 'netflix', name: 'Netflix', icon: '🎬', category: 'entertainment', color: '#E50914', url: 'https://netflix.com' },
    { id: 'spotify', name: 'Spotify', icon: '🎵', category: 'entertainment', color: '#1DB954', url: 'https://spotify.com' },
    { id: 'youtube', name: 'YouTube Premium', icon: '▶️', category: 'entertainment', color: '#FF0000', url: 'https://youtube.com' },
    { id: 'apple_music', name: 'Apple Music', icon: '🎧', category: 'entertainment', color: '#FC3C44', url: 'https://music.apple.com' },
    { id: 'disney', name: 'Disney+', icon: '🏰', category: 'entertainment', color: '#113CCF', url: 'https://disneyplus.com' },
    { id: 'shahid', name: 'Shahid VIP', icon: '📺', category: 'entertainment', color: '#0D7A3E', url: 'https://shahid.mbc.net' },
    { id: 'anghami', name: 'Anghami', icon: '🎶', category: 'entertainment', color: '#A238FF', url: 'https://anghami.com' },
    { id: 'adobe', name: 'Adobe Creative Cloud', icon: '🎨', category: 'work', color: '#FF0000', url: 'https://adobe.com' },
    { id: 'figma', name: 'Figma', icon: '✏️', category: 'work', color: '#F24E1E', url: 'https://figma.com' },
    { id: 'notion', name: 'Notion', icon: '📝', category: 'work', color: '#000000', url: 'https://notion.so' },
    { id: 'chatgpt', name: 'ChatGPT Plus', icon: '🤖', category: 'work', color: '#10A37F', url: 'https://chat.openai.com' },
    { id: 'claude', name: 'Claude Pro', icon: '🧠', category: 'work', color: '#CC785C', url: 'https://claude.ai' },
    { id: 'github', name: 'GitHub Pro', icon: '💻', category: 'work', color: '#333333', url: 'https://github.com' },
    { id: 'microsoft365', name: 'Microsoft 365', icon: '📊', category: 'work', color: '#0078D4', url: 'https://microsoft.com' },
    { id: 'google_one', name: 'Google One', icon: '☁️', category: 'work', color: '#4285F4', url: 'https://one.google.com' },
    { id: 'icloud', name: 'iCloud+', icon: '🍎', category: 'work', color: '#3693F3', url: 'https://icloud.com' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦', category: 'work', color: '#0061FF', url: 'https://dropbox.com' },
    { id: 'gym', name: 'Gym Membership', icon: '💪', category: 'other', color: '#FF6B35', url: '' },
    { id: 'vpn', name: 'VPN Service', icon: '🔒', category: 'other', color: '#4A90D9', url: '' },
    { id: 'playstation', name: 'PlayStation Plus', icon: '🎮', category: 'entertainment', color: '#003087', url: 'https://playstation.com' },
    { id: 'xbox', name: 'Xbox Game Pass', icon: '🟢', category: 'entertainment', color: '#107C10', url: 'https://xbox.com' },
    { id: 'udemy', name: 'Udemy', icon: '📚', category: 'education', color: '#A435F0', url: 'https://udemy.com' },
    { id: 'coursera', name: 'Coursera Plus', icon: '🎓', category: 'education', color: '#0056D2', url: 'https://coursera.org' },
    { id: 'twitter', name: 'X Premium', icon: '𝕏', category: 'social', color: '#000000', url: 'https://x.com' },
    { id: 'linkedin', name: 'LinkedIn Premium', icon: '💼', category: 'social', color: '#0A66C2', url: 'https://linkedin.com' }
  ];

  const CATEGORIES = [
    { id: 'entertainment', icon: '🎬' },
    { id: 'work', icon: '💼' },
    { id: 'education', icon: '📚' },
    { id: 'social', icon: '💬' },
    { id: 'other', icon: '📦' }
  ];

  const CURRENCIES = [
    { code: 'SAR', symbol: 'ر.س' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AED', symbol: 'د.إ' },
    { code: 'KWD', symbol: 'د.ك' },
    { code: 'BHD', symbol: 'د.ب' },
    { code: 'QAR', symbol: 'ر.ق' },
    { code: 'OMR', symbol: 'ر.ع' },
    { code: 'EGP', symbol: 'ج.م' },
    { code: 'TRY', symbol: '₺' }
  ];

  let _subscriptions = [];
  let _unsubscribe = null;
  let _listeners = [];

  /**
   * Initialize real-time listener for user's subscriptions
   */
  function init() {
    var user = auth.currentUser;
    if (!user) return;

    // Unsubscribe from previous listener if exists
    if (_unsubscribe) _unsubscribe();

    _unsubscribe = db.collection('users').doc(user.uid)
      .collection('subscriptions')
      .orderBy('createdAt', 'desc')
      .onSnapshot(function(snapshot) {
        _subscriptions = [];
        snapshot.forEach(function(doc) {
          _subscriptions.push(Object.assign({ id: doc.id }, doc.data()));
        });
        _notifyListeners();
      }, function(err) {
        console.error('Subscriptions listener error:', err);
      });
  }

  /**
   * Stop listening for changes
   */
  function destroy() {
    if (_unsubscribe) {
      _unsubscribe();
      _unsubscribe = null;
    }
    _subscriptions = [];
  }

  /**
   * Add a new subscription
   * @param {Object} data - Subscription data
   * @returns {Promise<string>} Document ID
   */
  async function add(data) {
    var user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    var doc = {
      name: data.name || '',
      url: data.url || '',
      amount: parseFloat(data.amount) || 0,
      currency: data.currency || 'SAR',
      billingCycle: data.billingCycle || 'monthly',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      nextRenewalDate: _calculateNextRenewal(data.startDate, data.billingCycle),
      category: data.category || 'other',
      icon: data.icon || '📦',
      color: data.color || '#3498DB',
      status: data.isTrial ? 'trial' : 'active',
      isTrial: data.isTrial || false,
      trialEndDate: data.trialEndDate || null,
      notifyDaysBefore: data.notifyDaysBefore || 3,
      notes: data.notes || '',
      subscriptionType: data.subscriptionType || 'individual',
      totalCost: parseFloat(data.totalCost) || parseFloat(data.amount) || 0,
      yourShare: parseFloat(data.yourShare) || parseFloat(data.amount) || 0,
      sharedWith: data.sharedWith || [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    var ref = await db.collection('users').doc(user.uid)
      .collection('subscriptions').add(doc);

    return ref.id;
  }

  /**
   * Update an existing subscription
   * @param {string} id - Subscription document ID
   * @param {Object} data - Fields to update
   */
  async function update(id, data) {
    var user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    // Recalculate next renewal if dates changed
    if (data.startDate || data.billingCycle) {
      var existing = getById(id);
      var startDate = data.startDate || (existing && existing.startDate);
      var cycle = data.billingCycle || (existing && existing.billingCycle);
      if (startDate && cycle) {
        data.nextRenewalDate = _calculateNextRenewal(startDate, cycle);
      }
    }

    await db.collection('users').doc(user.uid)
      .collection('subscriptions').doc(id).update(data);
  }

  /**
   * Delete a subscription
   * @param {string} id - Subscription document ID
   */
  async function remove(id) {
    var user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    await db.collection('users').doc(user.uid)
      .collection('subscriptions').doc(id).delete();
  }

  /**
   * Pause a subscription
   * @param {string} id
   */
  async function pause(id) {
    await update(id, {
      status: 'paused',
      pausedAt: new Date().toISOString()
    });
  }

  /**
   * Reactivate a paused subscription
   * @param {string} id
   */
  async function reactivate(id) {
    await update(id, {
      status: 'active',
      pausedAt: null
    });
  }

  /**
   * Convert trial to paid subscription
   * @param {string} id
   */
  async function convertTrial(id) {
    await update(id, {
      status: 'active',
      isTrial: false,
      trialEndDate: null
    });
  }

  /**
   * Get all subscriptions (cached)
   * @returns {Array}
   */
  function getAll() {
    return _subscriptions;
  }

  /**
   * Get active subscriptions
   * @returns {Array}
   */
  function getActive() {
    return _subscriptions.filter(function(s) {
      return s.status === 'active';
    });
  }

  /**
   * Get paused subscriptions
   * @returns {Array}
   */
  function getPaused() {
    return _subscriptions.filter(function(s) {
      return s.status === 'paused';
    });
  }

  /**
   * Get trial subscriptions
   * @returns {Array}
   */
  function getTrials() {
    return _subscriptions.filter(function(s) {
      return s.status === 'trial' || s.isTrial;
    });
  }

  /**
   * Get a subscription by ID
   * @param {string} id
   * @returns {Object|null}
   */
  function getById(id) {
    return _subscriptions.find(function(s) { return s.id === id; }) || null;
  }

  /**
   * Calculate dashboard statistics
   * @returns {Object}
   */
  function getStats() {
    var active = getActive();
    var trials = getTrials();
    var paused = getPaused();

    var monthlyTotal = 0;
    var yearlyTotal = 0;

    active.forEach(function(sub) {
      var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
      monthlyTotal += monthly;
    });

    yearlyTotal = monthlyTotal * 12;

    // Find most expensive
    var mostExpensive = null;
    var highestMonthly = 0;
    active.forEach(function(sub) {
      var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
      if (monthly > highestMonthly) {
        highestMonthly = monthly;
        mostExpensive = sub;
      }
    });

    // Upcoming renewals (next 7 days)
    var now = new Date();
    var weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    var upcoming = active.filter(function(sub) {
      if (!sub.nextRenewalDate) return false;
      var renewalDate = new Date(sub.nextRenewalDate);
      return renewalDate >= now && renewalDate <= weekFromNow;
    }).sort(function(a, b) {
      return new Date(a.nextRenewalDate) - new Date(b.nextRenewalDate);
    });

    // Category breakdown
    var categories = {};
    active.forEach(function(sub) {
      var cat = sub.category || 'other';
      if (!categories[cat]) categories[cat] = { count: 0, total: 0 };
      categories[cat].count++;
      categories[cat].total += _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
    });

    return {
      activeCount: active.length,
      trialCount: trials.length,
      pausedCount: paused.length,
      totalCount: _subscriptions.length,
      monthlyTotal: Math.round(monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(yearlyTotal * 100) / 100,
      mostExpensive: mostExpensive,
      upcoming: upcoming,
      categories: categories
    };
  }

  /**
   * Calculate days remaining until next renewal
   * @param {Object} sub - Subscription object
   * @returns {number} Days remaining (-1 if no date)
   */
  function getDaysRemaining(sub) {
    var dateStr = sub.isTrial ? sub.trialEndDate : sub.nextRenewalDate;
    if (!dateStr) return -1;
    var target = new Date(dateStr);
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get progress percentage (0-100) for renewal countdown
   * @param {Object} sub
   * @returns {number}
   */
  function getProgressPercent(sub) {
    var days = getDaysRemaining(sub);
    if (days < 0) return 100;
    var totalDays = _getCycleDays(sub.billingCycle);
    if (sub.isTrial && sub.trialEndDate && sub.startDate) {
      var start = new Date(sub.startDate);
      var end = new Date(sub.trialEndDate);
      totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }
    if (totalDays <= 0) return 100;
    var elapsed = totalDays - days;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  }

  /**
   * Get progress bar color based on days remaining
   * @param {number} daysRemaining
   * @returns {string} 'green' | 'yellow' | 'red'
   */
  function getProgressColor(daysRemaining) {
    if (daysRemaining <= 3) return 'red';
    if (daysRemaining <= 7) return 'yellow';
    return 'green';
  }

  /**
   * Register a change listener
   * @param {Function} callback
   */
  function onChange(callback) {
    if (typeof callback === 'function') {
      _listeners.push(callback);
    }
  }

  /**
   * Get popular services list
   * @returns {Array}
   */
  function getPopularServices() {
    return POPULAR_SERVICES;
  }

  /**
   * Get categories list
   * @returns {Array}
   */
  function getCategories() {
    return CATEGORIES;
  }

  /**
   * Get currencies list
   * @returns {Array}
   */
  function getCurrencies() {
    return CURRENCIES;
  }

  // =============================================
  // PRIVATE HELPERS
  // =============================================

  function _calculateNextRenewal(startDate, billingCycle) {
    if (!startDate) return null;
    var start = new Date(startDate);
    var now = new Date();
    now.setHours(0, 0, 0, 0);

    var next = new Date(start);

    while (next <= now) {
      switch (billingCycle) {
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
        case 'semi-annual':
          next.setMonth(next.getMonth() + 6);
          break;
        case 'yearly':
          next.setFullYear(next.getFullYear() + 1);
          break;
        default:
          next.setMonth(next.getMonth() + 1);
      }
    }

    return next.toISOString().split('T')[0];
  }

  function _toMonthly(amount, billingCycle) {
    switch (billingCycle) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'semi-annual': return amount / 6;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  }

  function _getCycleDays(billingCycle) {
    switch (billingCycle) {
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'semi-annual': return 180;
      case 'yearly': return 365;
      default: return 30;
    }
  }

  function _notifyListeners() {
    _listeners.forEach(function(cb) {
      try { cb(_subscriptions); } catch(e) { console.error('Subscription listener error:', e); }
    });
  }

  return {
    init: init,
    destroy: destroy,
    add: add,
    update: update,
    remove: remove,
    pause: pause,
    reactivate: reactivate,
    convertTrial: convertTrial,
    getAll: getAll,
    getActive: getActive,
    getPaused: getPaused,
    getTrials: getTrials,
    getById: getById,
    getStats: getStats,
    getDaysRemaining: getDaysRemaining,
    getProgressPercent: getProgressPercent,
    getProgressColor: getProgressColor,
    onChange: onChange,
    getPopularServices: getPopularServices,
    getCategories: getCategories,
    getCurrencies: getCurrencies
  };
})();
