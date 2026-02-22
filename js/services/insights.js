/**
 * SubTracker — Smart Insights Engine
 * AI-powered financial intelligence from subscription data
 * PRD Section 6.4: Smart Insights Engine
 */

const InsightsEngine = (function() {
  'use strict';

  /**
   * Run full analysis on subscriptions
   * @returns {Object} insights data
   */
  function analyze() {
    var subs = SubscriptionService.getAll();
    var active = SubscriptionService.getActive();

    return {
      lifetimeCosts: _calcLifetimeCosts(subs),
      spendingVelocity: _calcSpendingVelocity(active),
      categoryTrends: _calcCategoryTrends(active),
      costForecast: _calcCostForecast(active),
      patterns: _detectPatterns(subs),
      costPerDay: _calcCostPerDay(active),
      avgSubscriptionAge: _calcAvgAge(active),
      totalLifetime: _calcTotalLifetime(subs)
    };
  }

  /**
   * Calculate lifetime cost for each subscription
   */
  function _calcLifetimeCosts(subs) {
    return subs.map(function(sub) {
      if (!sub.startDate) return { name: sub.name, cost: 0, months: 0 };
      var start = new Date(sub.startDate);
      var now = new Date();
      var months = Math.max(1, Math.round((now - start) / (30 * 24 * 60 * 60 * 1000)));
      var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
      return {
        id: sub.id,
        name: sub.name,
        icon: sub.icon,
        cost: Math.round(monthly * months * 100) / 100,
        months: months
      };
    }).sort(function(a, b) { return b.cost - a.cost; });
  }

  /**
   * Calculate spending velocity (trend)
   */
  function _calcSpendingVelocity(active) {
    var stats = SubscriptionService.getStats();
    var now = new Date();
    var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    var recentSubs = active.filter(function(s) {
      return s.startDate && new Date(s.startDate) >= threeMonthsAgo;
    });

    var recentMonthly = 0;
    recentSubs.forEach(function(s) {
      recentMonthly += _toMonthly(s.yourShare || s.amount, s.billingCycle);
    });

    var totalMonthly = stats.monthlyTotal;
    var olderMonthly = totalMonthly - recentMonthly;

    var velocity = olderMonthly > 0 ? ((totalMonthly - olderMonthly) / olderMonthly * 100) : 0;

    return {
      percentage: Math.round(velocity),
      direction: velocity > 5 ? 'increasing' : velocity < -5 ? 'decreasing' : 'stable',
      recentAdditions: recentSubs.length
    };
  }

  /**
   * Calculate category spending trends
   */
  function _calcCategoryTrends(active) {
    var categories = {};
    active.forEach(function(sub) {
      var cat = sub.category || 'other';
      if (!categories[cat]) categories[cat] = { count: 0, total: 0, subs: [] };
      var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
      categories[cat].count++;
      categories[cat].total += monthly;
      categories[cat].subs.push(sub.name);
    });

    var total = Object.values(categories).reduce(function(sum, c) { return sum + c.total; }, 0);
    Object.keys(categories).forEach(function(cat) {
      categories[cat].percentage = total > 0 ? Math.round(categories[cat].total / total * 100) : 0;
    });

    return categories;
  }

  /**
   * Forecast future spending
   */
  function _calcCostForecast(active) {
    var stats = SubscriptionService.getStats();
    return {
      monthly: stats.monthlyTotal,
      quarterly: Math.round(stats.monthlyTotal * 3 * 100) / 100,
      yearly: stats.yearlyTotal,
      twoYear: Math.round(stats.yearlyTotal * 2 * 100) / 100
    };
  }

  /**
   * Detect spending patterns
   */
  function _detectPatterns(subs) {
    var patterns = [];

    // Pattern: Most subscriptions added in a specific month
    var monthCounts = {};
    subs.forEach(function(s) {
      if (!s.startDate) return;
      var month = new Date(s.startDate).getMonth();
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    var peakMonth = Object.entries(monthCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
    if (peakMonth && peakMonth[1] >= 3) {
      patterns.push({
        type: 'seasonal',
        month: parseInt(peakMonth[0]),
        count: peakMonth[1]
      });
    }

    // Pattern: Clustering of renewals on specific days
    var dayCounts = {};
    subs.forEach(function(s) {
      if (!s.nextRenewalDate) return;
      var day = new Date(s.nextRenewalDate).getDate();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    var peakDay = Object.entries(dayCounts).sort(function(a, b) { return b[1] - a[1]; })[0];
    if (peakDay && peakDay[1] >= 3) {
      patterns.push({
        type: 'clustering',
        day: parseInt(peakDay[0]),
        count: peakDay[1]
      });
    }

    return patterns;
  }

  function _calcCostPerDay(active) {
    var stats = SubscriptionService.getStats();
    return Math.round(stats.monthlyTotal / 30 * 100) / 100;
  }

  function _calcAvgAge(active) {
    if (active.length === 0) return 0;
    var now = new Date();
    var totalDays = active.reduce(function(sum, s) {
      if (!s.startDate) return sum;
      return sum + (now - new Date(s.startDate)) / (24 * 60 * 60 * 1000);
    }, 0);
    return Math.round(totalDays / active.length);
  }

  function _calcTotalLifetime(subs) {
    var costs = _calcLifetimeCosts(subs);
    return costs.reduce(function(sum, c) { return sum + c.cost; }, 0);
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

  return {
    analyze: analyze
  };
})();
