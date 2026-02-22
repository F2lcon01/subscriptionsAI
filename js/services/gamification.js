/**
 * SubTracker — Gamification System
 * XP, levels, badges, streaks, and subscription score
 * PRD Section 6.4: Gamification System
 */

const Gamification = (function() {
  'use strict';

  const ACTIONS = {
    ADD_SUB: { xp: 20, key: 'add_sub' },
    DAILY_LOGIN: { xp: 10, key: 'daily_login' },
    EXPORT_DATA: { xp: 15, key: 'export' },
    REVIEW_ALL: { xp: 25, key: 'review_all' },
    CANCEL_SUB: { xp: 30, key: 'cancel_sub' },
    SET_BUDGET: { xp: 25, key: 'set_budget' }
  };

  const LEVELS = [
    { level: 1, name: 'beginner', nameAr: 'مبتدئ', xpRequired: 0, icon: '🌱' },
    { level: 2, name: 'tracker', nameAr: 'متتبع', xpRequired: 100, icon: '📋' },
    { level: 3, name: 'manager', nameAr: 'منظّم', xpRequired: 300, icon: '⭐' },
    { level: 4, name: 'expert', nameAr: 'خبير', xpRequired: 700, icon: '💎' },
    { level: 5, name: 'master', nameAr: 'أسطورة', xpRequired: 1500, icon: '👑' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_sub', icon: '🏆', nameKey: 'achievement.first_sub', condition: function(s) { return s.length >= 1; } },
    { id: 'five_subs', icon: '⭐', nameKey: 'achievement.five_subs', condition: function(s) { return s.length >= 5; } },
    { id: 'ten_subs', icon: '🌟', nameKey: 'achievement.ten_subs', condition: function(s) { return s.length >= 10; } },
    { id: 'organizer', icon: '📁', nameKey: 'achievement.organizer', condition: function(s) {
      return s.length > 0 && s.every(function(sub) { return sub.category && sub.category !== 'other'; });
    }},
    { id: 'saver', icon: '💰', nameKey: 'achievement.saver', condition: function(s, stats) {
      return s.filter(function(sub) { return sub.status === 'paused'; }).length >= 1;
    }},
    { id: 'guardian', icon: '🔒', nameKey: 'achievement.guardian', condition: function(s) {
      return s.filter(function(sub) { return sub.credentials && sub.credentials.username; }).length >= 3;
    }},
    { id: 'multi_currency', icon: '🌍', nameKey: 'achievement.multi_currency', condition: function(s) {
      var currencies = new Set(s.map(function(sub) { return sub.currency; }));
      return currencies.size >= 2;
    }},
    { id: 'family_plan', icon: '👨‍👩‍👧‍👦', nameKey: 'achievement.family_plan', condition: function(s) {
      return s.some(function(sub) { return sub.subscriptionType === 'family' || sub.subscriptionType === 'shared'; });
    }}
  ];

  let _profile = null;

  /**
   * Initialize gamification — load profile
   */
  async function init() {
    var user = auth.currentUser;
    if (!user) return;

    var doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists && doc.data().gamification) {
      _profile = doc.data().gamification;
    } else {
      _profile = { xp: 0, level: 1, achievements: [], lastLogin: null, streak: 0 };
    }

    // Check daily login
    _checkDailyLogin();
  }

  /**
   * Add XP for an action
   */
  async function addXP(actionKey) {
    if (!_profile) await init();
    var action = ACTIONS[actionKey];
    if (!action) return;

    _profile.xp = (_profile.xp || 0) + action.xp;
    _profile.level = getLevel(_profile.xp).level;

    await _saveProfile();
  }

  /**
   * Get profile data
   */
  function getProfile() {
    return _profile || { xp: 0, level: 1, achievements: [], streak: 0 };
  }

  /**
   * Get level info from XP
   */
  function getLevel(xp) {
    var level = LEVELS[0];
    for (var i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpRequired) {
        level = LEVELS[i];
        break;
      }
    }
    var nextLevel = LEVELS[Math.min(level.level, LEVELS.length - 1)];
    var progress = nextLevel.xpRequired > level.xpRequired
      ? ((xp - level.xpRequired) / (nextLevel.xpRequired - level.xpRequired)) * 100
      : 100;
    return {
      level: level.level,
      name: level.name,
      nameAr: level.nameAr,
      icon: level.icon,
      xp: xp,
      nextLevelXP: nextLevel.xpRequired,
      progress: Math.min(100, Math.round(progress))
    };
  }

  /**
   * Check earned achievements
   */
  function getAchievements() {
    var subs = SubscriptionService.getAll();
    var stats = SubscriptionService.getStats();
    var earned = [];

    ACHIEVEMENTS.forEach(function(badge) {
      if (badge.condition(subs, stats)) {
        earned.push({
          id: badge.id,
          icon: badge.icon,
          name: I18n.t(badge.nameKey)
        });
      }
    });

    return earned;
  }

  /**
   * Calculate Subscription Score (0-100)
   */
  function getSubscriptionScore() {
    var subs = SubscriptionService.getAll();
    if (subs.length === 0) return { total: 0, organization: 0, costEfficiency: 0, security: 0, awareness: 0 };

    var active = SubscriptionService.getActive();

    // Organization (25%): categorized, has dates, no missing info
    var categorized = subs.filter(function(s) { return s.category && s.category !== 'other'; }).length;
    var organization = Math.min(100, (categorized / Math.max(1, subs.length)) * 100);

    // Cost Efficiency (25%): annual billing, shared costs
    var annual = active.filter(function(s) { return s.billingCycle === 'yearly' || s.billingCycle === 'quarterly'; }).length;
    var shared = active.filter(function(s) { return s.subscriptionType !== 'individual'; }).length;
    var costEfficiency = Math.min(100, ((annual + shared) / Math.max(1, active.length)) * 100);

    // Security (25%): credentials stored, not in plaintext
    var withCreds = subs.filter(function(s) { return s.credentials && s.credentials.username; }).length;
    var encrypted = subs.filter(function(s) { return s.credentialsEncrypted; }).length;
    var security = withCreds > 0 ? (encrypted / withCreds) * 100 : 50;

    // Awareness (25%): has notes, has URL
    var detailed = subs.filter(function(s) { return s.notes || s.url; }).length;
    var awareness = Math.min(100, (detailed / Math.max(1, subs.length)) * 100);

    var total = Math.round((organization * 0.25 + costEfficiency * 0.25 + security * 0.25 + awareness * 0.25));

    return {
      total: total,
      organization: Math.round(organization),
      costEfficiency: Math.round(costEfficiency),
      security: Math.round(security),
      awareness: Math.round(awareness)
    };
  }

  /**
   * Get all LEVELS
   */
  function getLevels() {
    return LEVELS;
  }

  // =============================================
  // PRIVATE
  // =============================================

  async function _checkDailyLogin() {
    if (!_profile) return;
    var today = new Date().toISOString().split('T')[0];
    if (_profile.lastLogin !== today) {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yesterdayStr = yesterday.toISOString().split('T')[0];

      if (_profile.lastLogin === yesterdayStr) {
        _profile.streak = (_profile.streak || 0) + 1;
      } else {
        _profile.streak = 1;
      }

      _profile.lastLogin = today;
      _profile.xp = (_profile.xp || 0) + ACTIONS.DAILY_LOGIN.xp;
      _profile.level = getLevel(_profile.xp).level;
      await _saveProfile();
    }
  }

  async function _saveProfile() {
    var user = auth.currentUser;
    if (!user || !_profile) return;

    try {
      await db.collection('users').doc(user.uid).update({
        gamification: _profile
      });
    } catch (e) {
      console.warn('Gamification save failed:', e);
    }
  }

  return {
    init: init,
    addXP: addXP,
    getProfile: getProfile,
    getLevel: getLevel,
    getAchievements: getAchievements,
    getSubscriptionScore: getSubscriptionScore,
    getLevels: getLevels,
    ACTIONS: ACTIONS
  };
})();
