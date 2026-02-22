/**
 * SubTracker — Calendar View
 * Gregorian + Hijri calendar with renewal tracking
 * PRD Section 6.4: Calendar View
 */

const CalendarView = (function() {
  'use strict';

  let _currentDate = new Date();
  let _isHijri = false;

  function render() {
    var container = document.getElementById('page-calendar');
    if (!container) return;

    var subs = SubscriptionService.getAll();
    var stats = SubscriptionService.getStats();

    container.innerHTML = '' +
      '<div class="calendar">' +
        '<div class="calendar__header">' +
          '<h1 class="calendar__title" data-i18n="calendar.title">' + I18n.t('calendar.title') + '</h1>' +
          '<div class="calendar__controls">' +
            '<button class="btn btn--ghost calendar__toggle-hijri" id="cal-toggle-hijri">' +
              I18n.t('calendar.hijri') +
            '</button>' +
          '</div>' +
        '</div>' +

        // Month navigation
        '<div class="calendar__nav">' +
          '<button class="btn btn--icon calendar__nav-btn" id="cal-prev">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
          '</button>' +
          '<h2 class="calendar__month" id="cal-month-label"></h2>' +
          '<button class="btn btn--icon calendar__nav-btn" id="cal-next">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
          '</button>' +
        '</div>' +

        // Month summary
        '<div class="calendar__summary" id="cal-summary"></div>' +

        // Calendar grid
        '<div class="calendar__grid" id="cal-grid"></div>' +

        // Day detail panel
        '<div class="calendar__detail" id="cal-detail" hidden>' +
          '<h3 class="calendar__detail-title" id="cal-detail-title"></h3>' +
          '<div class="calendar__detail-list" id="cal-detail-list"></div>' +
        '</div>' +
      '</div>';

    // Bind events
    document.getElementById('cal-prev').addEventListener('click', function() {
      _currentDate.setMonth(_currentDate.getMonth() - 1);
      _renderCalendar(subs, stats);
    });
    document.getElementById('cal-next').addEventListener('click', function() {
      _currentDate.setMonth(_currentDate.getMonth() + 1);
      _renderCalendar(subs, stats);
    });
    document.getElementById('cal-toggle-hijri').addEventListener('click', function() {
      _isHijri = !_isHijri;
      this.classList.toggle('active', _isHijri);
      _renderCalendar(subs, stats);
    });

    _renderCalendar(subs, stats);
  }

  function _renderCalendar(subs, stats) {
    var year = _currentDate.getFullYear();
    var month = _currentDate.getMonth();

    // Update month label
    var label = document.getElementById('cal-month-label');
    if (_isHijri) {
      try {
        label.textContent = _currentDate.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { month: 'long', year: 'numeric' });
      } catch (e) {
        label.textContent = _currentDate.toLocaleDateString(I18n.getLocale(), { month: 'long', year: 'numeric' });
      }
    } else {
      label.textContent = _currentDate.toLocaleDateString(I18n.getLocale(), { month: 'long', year: 'numeric' });
    }

    // Get subscriptions with renewal dates in this month
    var renewalMap = _getRenewalMap(subs, year, month);

    // Month summary
    var monthTotal = 0;
    var renewalCount = 0;
    Object.values(renewalMap).forEach(function(daySubs) {
      daySubs.forEach(function(sub) {
        monthTotal += sub.yourShare || sub.amount;
        renewalCount++;
      });
    });

    var summaryEl = document.getElementById('cal-summary');
    summaryEl.innerHTML = '' +
      '<div class="calendar__summary-item">' +
        '<span class="calendar__summary-label">' + I18n.t('calendar.renewals_this_month') + '</span>' +
        '<span class="calendar__summary-value">' + renewalCount + '</span>' +
      '</div>' +
      '<div class="calendar__summary-item">' +
        '<span class="calendar__summary-label">' + I18n.t('calendar.month_total') + '</span>' +
        '<span class="calendar__summary-value">' + monthTotal.toFixed(2) + ' ' + stats.currency + '</span>' +
      '</div>';

    // Build grid
    var grid = document.getElementById('cal-grid');
    var dayNames = _isHijri
      ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
      : [I18n.t('calendar.sun'), I18n.t('calendar.mon'), I18n.t('calendar.tue'), I18n.t('calendar.wed'), I18n.t('calendar.thu'), I18n.t('calendar.fri'), I18n.t('calendar.sat')];

    var html = '<div class="calendar__weekdays">';
    dayNames.forEach(function(d) {
      html += '<div class="calendar__weekday">' + d + '</div>';
    });
    html += '</div><div class="calendar__days">';

    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();

    // Empty cells
    for (var i = 0; i < firstDay; i++) {
      html += '<div class="calendar__day calendar__day--empty"></div>';
    }

    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      var daySubs = renewalMap[d] || [];
      var dayClass = 'calendar__day';
      if (isToday) dayClass += ' calendar__day--today';
      if (daySubs.length > 0) dayClass += ' calendar__day--has-renewal';

      html += '<div class="' + dayClass + '" data-day="' + d + '">';
      html += '<span class="calendar__day-number">' + d + '</span>';

      if (_isHijri) {
        try {
          var hijriDay = new Date(year, month, d).toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { day: 'numeric' });
          html += '<span class="calendar__day-hijri">' + hijriDay + '</span>';
        } catch (e) { /* Hijri not supported */ }
      }

      if (daySubs.length > 0) {
        html += '<div class="calendar__day-dots">';
        daySubs.slice(0, 3).forEach(function(sub) {
          var cost = sub.yourShare || sub.amount;
          var color = cost > 100 ? '#EF4444' : cost > 30 ? '#F59E0B' : '#10B981';
          html += '<span class="calendar__dot" style="background:' + color + '" title="' + sub.name + '"></span>';
        });
        if (daySubs.length > 3) {
          html += '<span class="calendar__dot-more">+' + (daySubs.length - 3) + '</span>';
        }
        html += '</div>';
      }

      html += '</div>';
    }

    html += '</div>';
    grid.innerHTML = html;

    // Click handlers
    grid.querySelectorAll('.calendar__day[data-day]').forEach(function(el) {
      el.addEventListener('click', function() {
        var day = parseInt(el.dataset.day);
        _showDayDetail(day, renewalMap[day] || [], year, month, stats);
        grid.querySelectorAll('.calendar__day').forEach(function(d) { d.classList.remove('calendar__day--selected'); });
        el.classList.add('calendar__day--selected');
      });
    });

    // Hide detail
    document.getElementById('cal-detail').hidden = true;
  }

  function _showDayDetail(day, subs, year, month, stats) {
    var detail = document.getElementById('cal-detail');
    var title = document.getElementById('cal-detail-title');
    var list = document.getElementById('cal-detail-list');

    var dateStr = new Date(year, month, day).toLocaleDateString(I18n.getLocale(), {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    title.textContent = dateStr;

    if (subs.length === 0) {
      list.innerHTML = '<p class="calendar__detail-empty">' + I18n.t('calendar.no_renewals') + '</p>';
    } else {
      list.innerHTML = subs.map(function(sub) {
        var amount = sub.yourShare || sub.amount;
        return '<div class="calendar__detail-item">' +
          '<span class="calendar__detail-icon">' + (sub.icon || '📦') + '</span>' +
          '<div class="calendar__detail-info">' +
            '<span class="calendar__detail-name">' + sub.name + '</span>' +
            '<span class="calendar__detail-cycle">' + I18n.t('cycle.' + sub.billingCycle) + '</span>' +
          '</div>' +
          '<span class="calendar__detail-amount">' + amount.toFixed(2) + ' ' + (sub.currency || stats.currency) + '</span>' +
        '</div>';
      }).join('');
    }

    detail.hidden = false;
  }

  function _getRenewalMap(subs, year, month) {
    var map = {};

    subs.forEach(function(sub) {
      if (sub.status === 'paused') return;
      var renewalDate = sub.nextRenewalDate ? new Date(sub.nextRenewalDate) : null;

      if (renewalDate && renewalDate.getFullYear() === year && renewalDate.getMonth() === month) {
        var day = renewalDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(sub);
        return;
      }

      // Also predict monthly renewals
      if (sub.startDate && sub.billingCycle === 'monthly') {
        var start = new Date(sub.startDate);
        var day = start.getDate();
        if (day > 28) day = 28;
        if (!map[day]) map[day] = [];
        var already = map[day].some(function(s) { return s.id === sub.id; });
        if (!already) map[day].push(sub);
      }
    });

    return map;
  }

  return {
    render: render
  };
})();
