/**
 * SubTracker — Mini-Apps / Tools Page
 * Password health, calculator, quick links, expense splitter
 * PRD Section 6.5: Mini-Apps
 */

const MiniApps = (function() {
  'use strict';

  function render() {
    var container = document.getElementById('page-tools');
    if (!container) return;

    container.innerHTML = '' +
      '<div class="tools">' +
        '<h1 class="tools__title" data-i18n="tools.title">' + I18n.t('tools.title') + '</h1>' +
        '<div class="tools__grid">' +
          _renderToolCard('password-health', '🔒', 'tools.password_health', 'tools.password_health_desc') +
          _renderToolCard('calculator', '🧮', 'tools.calculator', 'tools.calculator_desc') +
          _renderToolCard('quick-links', '🔗', 'tools.quick_links', 'tools.quick_links_desc') +
          _renderToolCard('splitter', '✂️', 'tools.splitter', 'tools.splitter_desc') +
        '</div>' +
        '<div class="tools__panel" id="tools-panel" hidden></div>' +
      '</div>';

    container.querySelectorAll('.tools__card').forEach(function(card) {
      card.addEventListener('click', function() {
        container.querySelectorAll('.tools__card').forEach(function(c) { c.classList.remove('active'); });
        card.classList.add('active');
        _openTool(card.dataset.tool);
      });
    });
  }

  function _renderToolCard(id, icon, titleKey, descKey) {
    return '<div class="tools__card" data-tool="' + id + '">' +
      '<span class="tools__card-icon">' + icon + '</span>' +
      '<h3 class="tools__card-title">' + I18n.t(titleKey) + '</h3>' +
      '<p class="tools__card-desc">' + I18n.t(descKey) + '</p>' +
    '</div>';
  }

  function _openTool(toolId) {
    var panel = document.getElementById('tools-panel');
    panel.hidden = false;

    switch (toolId) {
      case 'password-health': _renderPasswordHealth(panel); break;
      case 'calculator': _renderCalculator(panel); break;
      case 'quick-links': _renderQuickLinks(panel); break;
      case 'splitter': _renderSplitter(panel); break;
    }
  }

  // ============================
  // Password Health Check
  // ============================
  function _renderPasswordHealth(panel) {
    var subs = SubscriptionService.getAll();
    var withCreds = subs.filter(function(s) { return s.credentials && s.credentials.username; });

    if (withCreds.length === 0) {
      panel.innerHTML = '<div class="tools__empty">' +
        '<p>' + I18n.t('tools.no_credentials') + '</p>' +
      '</div>';
      return;
    }

    var results = withCreds.map(function(sub) {
      var cred = sub.credentials;
      var issues = [];

      if (cred.password) {
        if (cred.password.length < 8) issues.push(I18n.t('tools.pw_too_short'));
        if (!/[A-Z]/.test(cred.password)) issues.push(I18n.t('tools.pw_no_uppercase'));
        if (!/[0-9]/.test(cred.password)) issues.push(I18n.t('tools.pw_no_number'));
        if (!/[^A-Za-z0-9]/.test(cred.password)) issues.push(I18n.t('tools.pw_no_special'));
      }

      if (!sub.credentialsEncrypted) {
        issues.push(I18n.t('tools.pw_not_encrypted'));
      }

      return {
        name: sub.name,
        icon: sub.icon || '📦',
        username: cred.username,
        score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25),
        issues: issues,
        encrypted: !!sub.credentialsEncrypted
      };
    });

    var avgScore = Math.round(results.reduce(function(s, r) { return s + r.score; }, 0) / results.length);
    var scoreColor = avgScore >= 75 ? '#10B981' : avgScore >= 50 ? '#F59E0B' : '#EF4444';

    panel.innerHTML = '' +
      '<div class="tools__password-health">' +
        '<div class="tools__score-ring" style="--score-color:' + scoreColor + '">' +
          '<span class="tools__score-value">' + avgScore + '</span>' +
          '<span class="tools__score-label">' + I18n.t('tools.health_score') + '</span>' +
        '</div>' +
        '<div class="tools__results">' +
          results.map(function(r) {
            var statusColor = r.score >= 75 ? '#10B981' : r.score >= 50 ? '#F59E0B' : '#EF4444';
            return '<div class="tools__result-item">' +
              '<span class="tools__result-icon">' + r.icon + '</span>' +
              '<div class="tools__result-info">' +
                '<strong>' + r.name + '</strong>' +
                '<span style="color:var(--color-text-secondary)">' + r.username + '</span>' +
                (r.issues.length > 0
                  ? '<ul class="tools__issues">' + r.issues.map(function(i) { return '<li>' + i + '</li>'; }).join('') + '</ul>'
                  : '<span style="color:#10B981">' + I18n.t('tools.pw_strong') + '</span>') +
              '</div>' +
              '<span class="tools__result-badge" style="background:' + statusColor + '">' + r.score + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
  }

  // ============================
  // Subscription Calculator
  // ============================
  function _renderCalculator(panel) {
    var active = SubscriptionService.getActive();
    var stats = SubscriptionService.getStats();

    panel.innerHTML = '' +
      '<div class="tools__calculator">' +
        '<h3>' + I18n.t('tools.what_if') + '</h3>' +
        '<p class="tools__calc-current">' + I18n.t('tools.current_monthly') + ': <strong>' + stats.monthlyTotal.toFixed(2) + ' ' + stats.currency + '</strong></p>' +
        '<div class="tools__calc-list">' +
          active.map(function(sub) {
            var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
            return '<label class="tools__calc-item">' +
              '<input type="checkbox" class="tools__calc-check" data-amount="' + monthly + '" checked>' +
              '<span class="tools__calc-name">' + (sub.icon || '📦') + ' ' + sub.name + '</span>' +
              '<span class="tools__calc-amount">' + monthly.toFixed(2) + ' ' + (sub.currency || 'SAR') + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<div class="tools__calc-result">' +
          '<span>' + I18n.t('tools.new_monthly') + ': </span>' +
          '<strong id="calc-new-total">' + stats.monthlyTotal.toFixed(2) + ' ' + stats.currency + '</strong>' +
          '<span class="tools__calc-savings" id="calc-savings"></span>' +
        '</div>' +
      '</div>';

    panel.querySelectorAll('.tools__calc-check').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var total = 0;
        panel.querySelectorAll('.tools__calc-check:checked').forEach(function(c) {
          total += parseFloat(c.dataset.amount);
        });
        document.getElementById('calc-new-total').textContent = total.toFixed(2) + ' ' + stats.currency;
        var saved = stats.monthlyTotal - total;
        var savingsEl = document.getElementById('calc-savings');
        if (saved > 0) {
          savingsEl.textContent = I18n.t('tools.you_save') + ' ' + saved.toFixed(2) + ' ' + stats.currency + ' / ' + I18n.t('reports.months');
          savingsEl.style.color = '#10B981';
        } else {
          savingsEl.textContent = '';
        }
      });
    });
  }

  // ============================
  // Quick Links Hub
  // ============================
  function _renderQuickLinks(panel) {
    var subs = SubscriptionService.getAll();
    var withUrl = subs.filter(function(s) { return s.url; });

    panel.innerHTML = '' +
      '<div class="tools__quick-links">' +
        '<h3>' + I18n.t('tools.manage_subscriptions') + '</h3>' +
        (withUrl.length === 0
          ? '<p class="tools__empty-text">' + I18n.t('tools.no_links') + '</p>'
          : '<div class="tools__links-grid">' +
              withUrl.map(function(sub) {
                return '<a href="' + sub.url + '" target="_blank" rel="noopener" class="tools__link-card">' +
                  '<span class="tools__link-icon">' + (sub.icon || '🔗') + '</span>' +
                  '<span class="tools__link-name">' + sub.name + '</span>' +
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>' +
                '</a>';
              }).join('') +
            '</div>') +
      '</div>';
  }

  // ============================
  // Expense Splitter
  // ============================
  function _renderSplitter(panel) {
    var subs = SubscriptionService.getAll();
    var shared = subs.filter(function(s) {
      return s.subscriptionType === 'family' || s.subscriptionType === 'shared';
    });

    panel.innerHTML = '' +
      '<div class="tools__splitter">' +
        '<h3>' + I18n.t('tools.expense_splitter') + '</h3>' +
        (shared.length === 0
          ? '<p class="tools__empty-text">' + I18n.t('tools.no_shared') + '</p>'
          : shared.map(function(sub) {
              var totalCost = sub.amount;
              var members = sub.familyMembers || 2;
              var equalShare = (totalCost / members).toFixed(2);
              return '<div class="tools__split-card">' +
                '<div class="tools__split-header">' +
                  '<span>' + (sub.icon || '📦') + ' ' + sub.name + '</span>' +
                  '<span>' + totalCost.toFixed(2) + ' ' + (sub.currency || 'SAR') + '</span>' +
                '</div>' +
                '<div class="tools__split-body">' +
                  '<span>' + I18n.t('tools.members') + ': ' + members + '</span>' +
                  '<span>' + I18n.t('tools.per_person') + ': <strong>' + equalShare + ' ' + (sub.currency || 'SAR') + '</strong></span>' +
                '</div>' +
              '</div>';
            }).join('')) +

        '<div class="tools__split-custom" style="margin-block-start:var(--space-5)">' +
          '<h4>' + I18n.t('tools.custom_split') + '</h4>' +
          '<div class="tools__split-form">' +
            '<input type="number" class="input" id="split-amount" placeholder="' + I18n.t('tools.total_amount') + '">' +
            '<input type="number" class="input" id="split-people" placeholder="' + I18n.t('tools.num_people') + '" min="2" value="2">' +
            '<button class="btn btn--primary" id="split-calc-btn">' + I18n.t('tools.calculate') + '</button>' +
          '</div>' +
          '<div id="split-result"></div>' +
        '</div>' +
      '</div>';

    var calcBtn = document.getElementById('split-calc-btn');
    if (calcBtn) {
      calcBtn.addEventListener('click', function() {
        var amount = parseFloat(document.getElementById('split-amount').value);
        var people = parseInt(document.getElementById('split-people').value);
        if (amount > 0 && people >= 2) {
          var share = (amount / people).toFixed(2);
          document.getElementById('split-result').innerHTML =
            '<p class="tools__split-result">' + I18n.t('tools.each_pays') + ': <strong>' + share + '</strong></p>';
        }
      });
    }
  }

  function _toMonthly(amount, cycle) {
    switch (cycle) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'semi-annual': return amount / 6;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  }

  return {
    render: render
  };
})();
