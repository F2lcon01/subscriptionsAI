/**
 * SubTracker — Subscription List Module
 * Renders subscription cards with progress bars, filters, and actions
 * PRD Section 6.1: Active Subscriptions List
 */

const SubscriptionList = (function() {
  'use strict';

  let _currentFilter = 'all'; // 'all' | 'active' | 'trial' | 'paused'

  /**
   * Render the subscriptions page content
   */
  function render() {
    var container = document.querySelector('#page-subscriptions .page__body');
    if (!container) return;

    var subs = SubscriptionService.getAll();

    if (subs.length === 0) {
      container.innerHTML = _emptyStateHTML();
      I18n.translatePage();
      _bindEmptyEvents();
      return;
    }

    container.innerHTML = _listHTML(subs);
    I18n.translatePage();
    _bindListEvents();
  }

  function _emptyStateHTML() {
    return '' +
      '<div class="empty-state">' +
        '<div class="empty-state__icon">📋</div>' +
        '<h3 class="empty-state__title" data-i18n="subscriptions.empty_title">No subscriptions yet</h3>' +
        '<p class="empty-state__text" data-i18n="subscriptions.empty_text">Add your first subscription to get started.</p>' +
        '<button class="btn btn--primary empty-state__btn" id="subs-add-btn" style="margin-top:var(--space-6)">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span data-i18n="subscription.add_first">Add Your First Subscription</span>' +
        '</button>' +
      '</div>';
  }

  function _listHTML(subs) {
    var stats = SubscriptionService.getStats();

    // Filter subscriptions
    var filtered = _filterSubs(subs);

    var html = '' +
      // Header with add button and filter
      '<div class="subs-header">' +
        '<div class="subs-filters">' +
          _filterBtn('all', I18n.t('filter.all'), stats.totalCount) +
          _filterBtn('active', I18n.t('filter.active'), stats.activeCount) +
          _filterBtn('trial', I18n.t('filter.trials'), stats.trialCount) +
          _filterBtn('paused', I18n.t('filter.paused'), stats.pausedCount) +
        '</div>' +
        '<button class="btn btn--primary" id="add-sub-btn">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>' +
          '<span data-i18n="subscription.add_btn">Add Subscription</span>' +
        '</button>' +
      '</div>';

    if (filtered.length === 0) {
      html += '<p class="subs-empty-filter" data-i18n="subscriptions.no_filter_results">No subscriptions match this filter.</p>';
    } else {
      html += '<div class="subs-grid">';
      filtered.forEach(function(sub) {
        html += _cardHTML(sub);
      });
      html += '</div>';
    }

    return html;
  }

  function _filterBtn(filter, label, count) {
    return '<button class="filter-btn ' + (filter === _currentFilter ? 'filter-btn--active' : '') + '" data-filter="' + filter + '">' +
      label + ' <span class="filter-btn__count">' + count + '</span>' +
    '</button>';
  }

  function _cardHTML(sub) {
    var days = SubscriptionService.getDaysRemaining(sub);
    var progress = SubscriptionService.getProgressPercent(sub);
    var progressColor = SubscriptionService.getProgressColor(days);
    var isPaused = sub.status === 'paused';
    var isTrial = sub.status === 'trial' || sub.isTrial;
    var currency = sub.currency || 'SAR';
    var amount = sub.yourShare || sub.amount || 0;

    var currencies = SubscriptionService.getCurrencies();
    var curr = currencies.find(function(c) { return c.code === currency; });
    var symbol = curr ? curr.symbol : currency;

    var amountDisplay = amount.toFixed(2);
    var cycleLabel = I18n.t('cycle.' + (sub.billingCycle || 'monthly')) || sub.billingCycle;

    return '' +
      '<div class="sub-card ' + (isPaused ? 'sub-card--paused' : '') + ' ' + (isTrial ? 'sub-card--trial' : '') + '" data-sub-id="' + sub.id + '">' +
        // Status badge
        (isTrial ? '<span class="sub-card__badge sub-card__badge--trial" data-i18n="subscription.trial_badge">TRIAL</span>' : '') +
        (isPaused ? '<span class="sub-card__badge sub-card__badge--paused" data-i18n="subscription.paused_badge">PAUSED</span>' : '') +

        // Card header: icon + name + actions
        '<div class="sub-card__header">' +
          '<div class="sub-card__icon" style="background:' + (sub.color || '#3498DB') + '">' +
            '<span>' + (sub.icon || '📦') + '</span>' +
          '</div>' +
          '<div class="sub-card__info">' +
            '<h4 class="sub-card__name">' + _escapeHTML(sub.name) + '</h4>' +
            '<span class="sub-card__category" data-i18n="category.' + (sub.category || 'other') + '">' + (sub.category || 'other') + '</span>' +
          '</div>' +
          '<button class="sub-card__menu-btn" data-action="menu" aria-label="More options">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>' +
          '</button>' +
          // Card dropdown menu
          '<div class="sub-card__dropdown" hidden>' +
            '<button class="sub-card__dropdown-item" data-action="edit">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '<span data-i18n="common.edit">Edit</span>' +
            '</button>' +
            (isPaused ?
              '<button class="sub-card__dropdown-item" data-action="reactivate">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' +
                '<span data-i18n="subscription.reactivate">Reactivate</span>' +
              '</button>' :
              '<button class="sub-card__dropdown-item" data-action="pause">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>' +
                '<span data-i18n="subscription.pause">Pause</span>' +
              '</button>'
            ) +
            (isTrial ?
              '<button class="sub-card__dropdown-item" data-action="convert">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                '<span data-i18n="subscription.convert_to_paid">Convert to Paid</span>' +
              '</button>' : '') +
            '<button class="sub-card__dropdown-item sub-card__dropdown-item--danger" data-action="delete">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
              '<span data-i18n="common.delete">Delete</span>' +
            '</button>' +
          '</div>' +
        '</div>' +

        // Amount
        '<div class="sub-card__amount">' +
          '<span class="sub-card__price">' + symbol + ' ' + amountDisplay + '</span>' +
          '<span class="sub-card__cycle">/ ' + cycleLabel + '</span>' +
        '</div>' +

        // Progress bar
        '<div class="sub-card__progress">' +
          '<div class="progress-bar">' +
            '<div class="progress-bar__fill progress-bar__fill--' + progressColor + '" style="width:' + progress + '%"></div>' +
          '</div>' +
          '<div class="sub-card__progress-info">' +
            (isTrial && sub.trialEndDate ?
              '<span class="sub-card__trial-countdown">' +
                (days > 0 ? days + ' ' + I18n.t('common.days_left') : I18n.t('subscription.trial_expired')) +
              '</span>' :
              '<span>' + (days >= 0 ? days + ' ' + I18n.t('common.days_left') : '—') + '</span>'
            ) +
            '<span class="sub-card__renewal-date">' + _formatDate(sub.nextRenewalDate) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // =============================================
  // EVENTS
  // =============================================

  function _bindListEvents() {
    // Add button
    var addBtn = document.getElementById('add-sub-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        SubscriptionModal.open();
      });
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _currentFilter = this.getAttribute('data-filter');
        render();
      });
    });

    // Card actions (event delegation)
    var grid = document.querySelector('.subs-grid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        var card = e.target.closest('.sub-card');
        if (!card) return;
        var subId = card.getAttribute('data-sub-id');

        // Menu button
        var menuBtn = e.target.closest('[data-action="menu"]');
        if (menuBtn) {
          e.stopPropagation();
          _toggleDropdown(card);
          return;
        }

        // Dropdown actions
        var actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          var action = actionBtn.getAttribute('data-action');
          _handleAction(action, subId);
          return;
        }

        // Click on card itself opens edit
        SubscriptionModal.edit(subId);
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.sub-card__dropdown') && !e.target.closest('[data-action="menu"]')) {
        document.querySelectorAll('.sub-card__dropdown').forEach(function(d) {
          d.hidden = true;
        });
      }
    });
  }

  function _bindEmptyEvents() {
    var addBtn = document.getElementById('subs-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        SubscriptionModal.open();
      });
    }
  }

  function _toggleDropdown(card) {
    // Close all other dropdowns
    document.querySelectorAll('.sub-card__dropdown').forEach(function(d) {
      if (d !== card.querySelector('.sub-card__dropdown')) {
        d.hidden = true;
      }
    });
    var dropdown = card.querySelector('.sub-card__dropdown');
    if (dropdown) dropdown.hidden = !dropdown.hidden;
  }

  async function _handleAction(action, subId) {
    // Close dropdown
    document.querySelectorAll('.sub-card__dropdown').forEach(function(d) { d.hidden = true; });

    switch(action) {
      case 'edit':
        SubscriptionModal.edit(subId);
        break;
      case 'pause':
        try {
          await SubscriptionService.pause(subId);
          Toast.success(I18n.t('subscription.paused_msg'));
        } catch(e) { Toast.error(I18n.t('toast.error')); }
        break;
      case 'reactivate':
        try {
          await SubscriptionService.reactivate(subId);
          Toast.success(I18n.t('subscription.reactivated'));
        } catch(e) { Toast.error(I18n.t('toast.error')); }
        break;
      case 'convert':
        try {
          await SubscriptionService.convertTrial(subId);
          Toast.success(I18n.t('subscription.converted'));
        } catch(e) { Toast.error(I18n.t('toast.error')); }
        break;
      case 'delete':
        if (confirm(I18n.t('subscription.delete_confirm'))) {
          try {
            await SubscriptionService.remove(subId);
            Toast.success(I18n.t('subscription.deleted'));
          } catch(e) { Toast.error(I18n.t('toast.error')); }
        }
        break;
    }
  }

  // =============================================
  // HELPERS
  // =============================================

  function _filterSubs(subs) {
    switch(_currentFilter) {
      case 'active': return subs.filter(function(s) { return s.status === 'active'; });
      case 'trial': return subs.filter(function(s) { return s.status === 'trial' || s.isTrial; });
      case 'paused': return subs.filter(function(s) { return s.status === 'paused'; });
      default: return subs;
    }
  }

  function _formatDate(dateStr) {
    if (!dateStr) return '—';
    var date = new Date(dateStr);
    var lang = I18n.getLang();
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short', day: 'numeric'
    });
  }

  function _escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return {
    render: render
  };
})();
