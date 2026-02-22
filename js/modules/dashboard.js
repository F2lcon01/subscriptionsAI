/**
 * SubTracker — Dashboard Module
 * Renders dashboard statistics, upcoming renewals, and category breakdown
 * PRD Section 6.1: Dashboard Statistics
 */

const Dashboard = (function() {
  'use strict';

  /**
   * Render the dashboard content
   */
  function render() {
    var container = document.querySelector('#page-dashboard .page__body');
    if (!container) return;

    var stats = SubscriptionService.getStats();
    var subs = SubscriptionService.getAll();

    if (subs.length === 0) {
      container.innerHTML = _emptyStateHTML();
      I18n.translatePage();
      _bindEmptyStateEvents();
      return;
    }

    container.innerHTML = _dashboardHTML(stats);
    I18n.translatePage();

    // Stagger stat card animations
    var statCards = container.querySelectorAll('.stat-card');
    statCards.forEach(function(card, index) {
      card.classList.add('card-animate', 'stagger-' + Math.min(index + 1, 9));
    });

    // Animate number counters
    _animateCounters();
  }

  function _emptyStateHTML() {
    return '' +
      '<div class="empty-state">' +
        '<div class="empty-state__icon">📊</div>' +
        '<h3 class="empty-state__title" data-i18n="dashboard.empty_title">Welcome to اشتراكاتي!</h3>' +
        '<p class="empty-state__text" data-i18n="dashboard.empty_text">Start by adding your first subscription to track your expenses.</p>' +
        '<button class="btn btn--primary empty-state__btn" id="dashboard-add-btn" style="margin-top:var(--space-6)">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span data-i18n="subscription.add_first">Add Your First Subscription</span>' +
        '</button>' +
      '</div>';
  }

  function _dashboardHTML(stats) {
    var currency = _getUserCurrency();

    return '' +
      // Stats Cards Row
      '<div class="stats-grid">' +
        _statCard('stats.monthly_total', _formatCurrency(stats.monthlyTotal, currency), 'monthly', '💰') +
        _statCard('stats.yearly_total', _formatCurrency(stats.yearlyTotal, currency), 'yearly', '📅') +
        _statCard('stats.active_count', stats.activeCount.toString(), 'active', '✅') +
        _statCard('stats.trial_count', stats.trialCount.toString(), 'trial', '🧪') +
      '</div>' +

      // Upcoming Renewals
      '<div class="dashboard-section">' +
        '<div class="dashboard-section__header">' +
          '<h3 class="dashboard-section__title" data-i18n="dashboard.upcoming">Upcoming Renewals</h3>' +
          '<span class="dashboard-section__badge">' + stats.upcoming.length + '</span>' +
        '</div>' +
        '<div class="dashboard-section__body">' +
          (stats.upcoming.length > 0 ? _upcomingListHTML(stats.upcoming, currency) : _noUpcomingHTML()) +
        '</div>' +
      '</div>' +

      // Most Expensive
      (stats.mostExpensive ? _mostExpensiveHTML(stats.mostExpensive, currency) : '') +

      // Category Breakdown
      (Object.keys(stats.categories).length > 0 ? _categoryBreakdownHTML(stats.categories, currency, stats.monthlyTotal) : '') +

      // Paused Subscriptions count
      (stats.pausedCount > 0 ?
        '<div class="dashboard-info">' +
          '<span class="dashboard-info__icon">⏸️</span>' +
          '<span data-i18n="dashboard.paused_count">Paused subscriptions</span>: ' +
          '<strong>' + stats.pausedCount + '</strong>' +
        '</div>' : '');
  }

  function _statCard(i18nKey, value, type, icon) {
    return '' +
      '<div class="stat-card stat-card--' + type + '">' +
        '<div class="stat-card__icon">' + icon + '</div>' +
        '<div class="stat-card__content">' +
          '<span class="stat-card__value" data-counter>' + value + '</span>' +
          '<span class="stat-card__label" data-i18n="' + i18nKey + '"></span>' +
        '</div>' +
      '</div>';
  }

  function _upcomingListHTML(upcoming, currency) {
    var html = '<div class="upcoming-list">';
    upcoming.forEach(function(sub) {
      var days = SubscriptionService.getDaysRemaining(sub);
      var color = SubscriptionService.getProgressColor(days);
      html += '' +
        '<div class="upcoming-item">' +
          '<div class="upcoming-item__icon" style="background:' + (sub.color || '#7C3AED') + '">' +
            '<span>' + (sub.icon || '📦') + '</span>' +
          '</div>' +
          '<div class="upcoming-item__info">' +
            '<span class="upcoming-item__name">' + _escapeHTML(sub.name) + '</span>' +
            '<span class="upcoming-item__date">' + _formatDate(sub.nextRenewalDate) + '</span>' +
          '</div>' +
          '<div class="upcoming-item__end">' +
            '<span class="upcoming-item__amount">' + _formatCurrency(sub.yourShare || sub.amount, currency) + '</span>' +
            '<span class="upcoming-item__days upcoming-item__days--' + color + '">' +
              days + ' ' + I18n.t('common.days') +
            '</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  function _noUpcomingHTML() {
    return '<p class="dashboard-section__empty" data-i18n="dashboard.no_upcoming">No upcoming renewals this week</p>';
  }

  function _mostExpensiveHTML(sub, currency) {
    var monthly = sub.yourShare || sub.amount;
    return '' +
      '<div class="dashboard-section">' +
        '<div class="dashboard-section__header">' +
          '<h3 class="dashboard-section__title" data-i18n="dashboard.most_expensive">Most Expensive</h3>' +
        '</div>' +
        '<div class="dashboard-section__body">' +
          '<div class="most-expensive">' +
            '<span class="most-expensive__icon" style="background:' + (sub.color || '#7C3AED') + '">' + (sub.icon || '📦') + '</span>' +
            '<span class="most-expensive__name">' + _escapeHTML(sub.name) + '</span>' +
            '<span class="most-expensive__amount">' + _formatCurrency(monthly, currency) + '<small>/' + I18n.t('common.month') + '</small></span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function _categoryBreakdownHTML(categories, currency, total) {
    var html = '' +
      '<div class="dashboard-section">' +
        '<div class="dashboard-section__header">' +
          '<h3 class="dashboard-section__title" data-i18n="dashboard.categories">Categories</h3>' +
        '</div>' +
        '<div class="dashboard-section__body">' +
          '<div class="category-list">';

    var catList = SubscriptionService.getCategories();
    var catMap = {};
    catList.forEach(function(c) { catMap[c.id] = c; });

    Object.keys(categories).forEach(function(catId) {
      var cat = categories[catId];
      var catInfo = catMap[catId] || { icon: '📦' };
      var percent = total > 0 ? Math.round((cat.total / total) * 100) : 0;

      html += '' +
        '<div class="category-item">' +
          '<div class="category-item__start">' +
            '<span class="category-item__icon">' + catInfo.icon + '</span>' +
            '<span class="category-item__name" data-i18n="category.' + catId + '">' + catId + '</span>' +
            '<span class="category-item__count">(' + cat.count + ')</span>' +
          '</div>' +
          '<div class="category-item__end">' +
            '<div class="category-item__bar">' +
              '<div class="category-item__bar-fill" style="width:' + percent + '%"></div>' +
            '</div>' +
            '<span class="category-item__amount">' + _formatCurrency(cat.total, currency) + '</span>' +
            '<span class="category-item__percent">' + percent + '%</span>' +
          '</div>' +
        '</div>';
    });

    html += '</div></div></div>';
    return html;
  }

  // =============================================
  // HELPERS
  // =============================================

  function _getUserCurrency() {
    var stats = SubscriptionService.getStats();
    return stats.currency || 'SAR';
  }

  function _formatCurrency(amount, currency) {
    var currencies = SubscriptionService.getCurrencies();
    var curr = currencies.find(function(c) { return c.code === currency; });
    var symbol = curr ? curr.symbol : currency;
    var formatted = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (I18n.isRTL()) {
      return formatted + ' ' + symbol;
    }
    return symbol + ' ' + formatted;
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '—';
    var date = new Date(dateStr);
    var lang = I18n.getLang();
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  function _escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function _animateCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    counters.forEach(function(el) {
      var text = el.textContent;
      var match = text.match(/[\d,.]+/);
      if (!match) return;
      var target = parseFloat(match[0].replace(/,/g, ''));
      if (isNaN(target) || target === 0) return;

      var prefix = text.substring(0, text.indexOf(match[0]));
      var suffix = text.substring(text.indexOf(match[0]) + match[0].length);
      var hasDecimal = match[0].includes('.');
      var duration = 800;
      var start = performance.now();

      function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = target * eased;
        var formatted = hasDecimal
          ? current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          : Math.round(current).toLocaleString();
        el.textContent = prefix + formatted + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  function _bindEmptyStateEvents() {
    var addBtn = document.getElementById('dashboard-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        if (typeof SubscriptionModal !== 'undefined') {
          SubscriptionModal.open();
        }
      });
    }
  }

  return {
    render: render
  };
})();
