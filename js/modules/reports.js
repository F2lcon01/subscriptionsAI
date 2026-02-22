/**
 * SubTracker — Monthly Reports
 * Charts and analytics for subscription spending
 * PRD Section 6.4: Reports & Analytics
 */

const Reports = (function() {
  'use strict';

  let _charts = {};

  function render() {
    var container = document.getElementById('page-reports');
    if (!container) return;

    var subs = SubscriptionService.getAll();
    var active = SubscriptionService.getActive();
    var stats = SubscriptionService.getStats();
    var insights = InsightsEngine.analyze();

    container.innerHTML = '' +
      '<div class="reports">' +
        '<div class="reports__header">' +
          '<h1 class="reports__title" data-i18n="reports.title">' + I18n.t('reports.title') + '</h1>' +
          '<div class="reports__period">' +
            '<button class="btn btn--ghost reports__period-btn active" data-period="3">' + I18n.t('reports.3months') + '</button>' +
            '<button class="btn btn--ghost reports__period-btn" data-period="6">' + I18n.t('reports.6months') + '</button>' +
            '<button class="btn btn--ghost reports__period-btn" data-period="12">' + I18n.t('reports.12months') + '</button>' +
          '</div>' +
        '</div>' +

        // Summary cards
        '<div class="reports__summary">' +
          '<div class="reports__card">' +
            '<span class="reports__card-label" data-i18n="reports.monthly_total">' + I18n.t('reports.monthly_total') + '</span>' +
            '<span class="reports__card-value">' + stats.monthlyTotal.toFixed(2) + ' ' + stats.currency + '</span>' +
          '</div>' +
          '<div class="reports__card">' +
            '<span class="reports__card-label" data-i18n="reports.yearly_total">' + I18n.t('reports.yearly_total') + '</span>' +
            '<span class="reports__card-value">' + stats.yearlyTotal.toFixed(2) + ' ' + stats.currency + '</span>' +
          '</div>' +
          '<div class="reports__card">' +
            '<span class="reports__card-label" data-i18n="reports.active_count">' + I18n.t('reports.active_count') + '</span>' +
            '<span class="reports__card-value">' + active.length + '</span>' +
          '</div>' +
          '<div class="reports__card">' +
            '<span class="reports__card-label" data-i18n="reports.daily_cost">' + I18n.t('reports.daily_cost') + '</span>' +
            '<span class="reports__card-value">' + insights.costPerDay.toFixed(2) + ' ' + stats.currency + '</span>' +
          '</div>' +
        '</div>' +

        // Charts
        '<div class="reports__charts">' +
          '<div class="reports__chart-container">' +
            '<h3 class="reports__chart-title" data-i18n="reports.spending_trend">' + I18n.t('reports.spending_trend') + '</h3>' +
            '<canvas id="chart-spending-trend"></canvas>' +
          '</div>' +
          '<div class="reports__chart-container">' +
            '<h3 class="reports__chart-title" data-i18n="reports.category_breakdown">' + I18n.t('reports.category_breakdown') + '</h3>' +
            '<canvas id="chart-category"></canvas>' +
          '</div>' +
          '<div class="reports__chart-container">' +
            '<h3 class="reports__chart-title" data-i18n="reports.top_subscriptions">' + I18n.t('reports.top_subscriptions') + '</h3>' +
            '<canvas id="chart-top-subs"></canvas>' +
          '</div>' +
        '</div>' +

        // Lifetime costs
        '<div class="reports__lifetime">' +
          '<h3 class="reports__chart-title" data-i18n="reports.lifetime_costs">' + I18n.t('reports.lifetime_costs') + '</h3>' +
          '<div class="reports__lifetime-list">' +
            insights.lifetimeCosts.slice(0, 10).map(function(item) {
              return '<div class="reports__lifetime-item">' +
                '<span class="reports__lifetime-icon">' + (item.icon || '📦') + '</span>' +
                '<span class="reports__lifetime-name">' + item.name + '</span>' +
                '<span class="reports__lifetime-months">' + item.months + ' ' + I18n.t('reports.months') + '</span>' +
                '<span class="reports__lifetime-cost">' + item.cost.toFixed(2) + ' ' + stats.currency + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +

        // Forecast
        '<div class="reports__forecast">' +
          '<h3 class="reports__chart-title" data-i18n="reports.forecast">' + I18n.t('reports.forecast') + '</h3>' +
          '<div class="reports__forecast-grid">' +
            '<div class="reports__forecast-item">' +
              '<span class="reports__forecast-period" data-i18n="reports.quarterly">' + I18n.t('reports.quarterly') + '</span>' +
              '<span class="reports__forecast-amount">' + insights.costForecast.quarterly.toFixed(2) + ' ' + stats.currency + '</span>' +
            '</div>' +
            '<div class="reports__forecast-item">' +
              '<span class="reports__forecast-period" data-i18n="reports.yearly">' + I18n.t('reports.yearly') + '</span>' +
              '<span class="reports__forecast-amount">' + insights.costForecast.yearly.toFixed(2) + ' ' + stats.currency + '</span>' +
            '</div>' +
            '<div class="reports__forecast-item">' +
              '<span class="reports__forecast-period" data-i18n="reports.two_year">' + I18n.t('reports.two_year') + '</span>' +
              '<span class="reports__forecast-amount">' + insights.costForecast.twoYear.toFixed(2) + ' ' + stats.currency + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Period button events
    container.querySelectorAll('.reports__period-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.reports__period-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        _renderCharts(active, stats, parseInt(btn.dataset.period));
      });
    });

    _renderCharts(active, stats, 3);
  }

  function _renderCharts(active, stats, months) {
    _destroyCharts();
    if (typeof Chart === 'undefined') return;

    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var textColor = isDark ? '#e2e8f0' : '#334155';
    var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;

    _renderSpendingTrend(active, stats, months, textColor, gridColor);
    _renderCategoryChart(active);
    _renderTopSubsChart(active, stats);
  }

  function _renderSpendingTrend(active, stats, months, textColor, gridColor) {
    var canvas = document.getElementById('chart-spending-trend');
    if (!canvas) return;

    var labels = [];
    var data = [];
    var now = new Date();

    for (var i = months - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString(I18n.getLocale(), { month: 'short', year: '2-digit' }));

      var monthTotal = 0;
      active.forEach(function(sub) {
        if (!sub.startDate) return;
        var start = new Date(sub.startDate);
        if (start <= d) {
          monthTotal += _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
        }
      });
      data.push(Math.round(monthTotal * 100) / 100);
    }

    _charts.trend = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: I18n.t('reports.monthly_spending'),
          data: data,
          borderColor: '#7C3AED',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#7C3AED',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: gridColor } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function _renderCategoryChart(active) {
    var canvas = document.getElementById('chart-category');
    if (!canvas) return;

    var categories = {};
    active.forEach(function(sub) {
      var cat = sub.category || 'other';
      var monthly = _toMonthly(sub.yourShare || sub.amount, sub.billingCycle);
      categories[cat] = (categories[cat] || 0) + monthly;
    });

    var catColors = {
      entertainment: '#F97316', work: '#7C3AED', education: '#14B8A6',
      social: '#EC4899', other: '#64748B'
    };

    var labels = Object.keys(categories).map(function(c) { return I18n.t('category.' + c); });
    var data = Object.values(categories).map(function(v) { return Math.round(v * 100) / 100; });
    var colors = Object.keys(categories).map(function(c) { return catColors[c] || '#64748B'; });

    _charts.category = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: 'transparent' }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
        },
        cutout: '60%'
      }
    });
  }

  function _renderTopSubsChart(active, stats) {
    var canvas = document.getElementById('chart-top-subs');
    if (!canvas) return;

    var sorted = active.map(function(sub) {
      return { name: sub.name, amount: _toMonthly(sub.yourShare || sub.amount, sub.billingCycle) };
    }).sort(function(a, b) { return b.amount - a.amount; }).slice(0, 8);

    _charts.topSubs = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: sorted.map(function(s) { return s.name; }),
        datasets: [{
          data: sorted.map(function(s) { return Math.round(s.amount * 100) / 100; }),
          backgroundColor: ['#7C3AED', '#14B8A6', '#F97316', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
          borderRadius: 8,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true },
          y: { grid: { display: false } }
        }
      }
    });
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

  function _destroyCharts() {
    Object.keys(_charts).forEach(function(key) {
      if (_charts[key]) { _charts[key].destroy(); _charts[key] = null; }
    });
  }

  return {
    render: render
  };
})();
