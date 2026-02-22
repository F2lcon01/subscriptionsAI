/**
 * SubTracker — Yearly Wrapped
 * Annual subscription report (Spotify Wrapped style)
 * PRD Section 6.6: Yearly Wrapped
 */

const YearlyWrapped = (function() {
  'use strict';

  let _currentSlide = 0;
  let _slides = [];

  function renderWrapped() {
    var subs = SubscriptionService.getAll();
    var stats = SubscriptionService.getStats();
    var insights = InsightsEngine.analyze();
    var year = new Date().getFullYear();

    _slides = _buildSlides(subs, stats, insights, year);
    _currentSlide = 0;

    var existingModal = document.getElementById('wrapped-modal');
    if (existingModal) existingModal.remove();

    var modal = document.createElement('div');
    modal.id = 'wrapped-modal';
    modal.className = 'modal';
    modal.innerHTML = '' +
      '<div class="modal__backdrop" id="wrapped-backdrop"></div>' +
      '<div class="wrapped">' +
        '<button class="wrapped__close" id="wrapped-close">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
        '<div class="wrapped__slides" id="wrapped-slides"></div>' +
        '<div class="wrapped__nav">' +
          '<div class="wrapped__dots" id="wrapped-dots"></div>' +
          '<div class="wrapped__buttons">' +
            '<button class="btn btn--ghost wrapped__btn" id="wrapped-prev" hidden>' + I18n.t('wrapped.prev') + '</button>' +
            '<button class="btn btn--primary wrapped__btn" id="wrapped-next">' + I18n.t('wrapped.next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function() { modal.classList.add('modal--visible'); });

    document.getElementById('wrapped-close').onclick = _closeWrapped;
    document.getElementById('wrapped-backdrop').onclick = _closeWrapped;
    document.getElementById('wrapped-prev').onclick = function() { _goToSlide(_currentSlide - 1); };
    document.getElementById('wrapped-next').onclick = function() {
      if (_currentSlide >= _slides.length - 1) {
        _closeWrapped();
      } else {
        _goToSlide(_currentSlide + 1);
      }
    };

    _renderSlide();
  }

  function _buildSlides(subs, stats, insights, year) {
    var slides = [];
    var active = SubscriptionService.getActive();

    // Slide 1: Intro
    slides.push({
      gradient: 'linear-gradient(135deg, #7C3AED, #EC4899)',
      content: '<h1 class="wrapped__big-text">' + I18n.t('wrapped.your_year', { year: year }) + '</h1>' +
        '<p class="wrapped__subtitle">' + I18n.t('wrapped.recap') + '</p>' +
        '<div class="wrapped__emoji">📊</div>'
    });

    // Slide 2: Total subscriptions
    slides.push({
      gradient: 'linear-gradient(135deg, #14B8A6, #3B82F6)',
      content: '<p class="wrapped__label">' + I18n.t('wrapped.you_managed') + '</p>' +
        '<h1 class="wrapped__huge-number">' + subs.length + '</h1>' +
        '<p class="wrapped__label">' + I18n.t('wrapped.subscriptions') + '</p>'
    });

    // Slide 3: Total spent
    slides.push({
      gradient: 'linear-gradient(135deg, #F97316, #EF4444)',
      content: '<p class="wrapped__label">' + I18n.t('wrapped.total_spent') + '</p>' +
        '<h1 class="wrapped__huge-number">' + insights.totalLifetime.toFixed(0) + '</h1>' +
        '<p class="wrapped__label">' + stats.currency + '</p>'
    });

    // Slide 4: Most expensive
    if (insights.lifetimeCosts.length > 0) {
      var top = insights.lifetimeCosts[0];
      slides.push({
        gradient: 'linear-gradient(135deg, #EC4899, #7C3AED)',
        content: '<p class="wrapped__label">' + I18n.t('wrapped.most_expensive') + '</p>' +
          '<div class="wrapped__emoji">' + (top.icon || '💰') + '</div>' +
          '<h2 class="wrapped__big-text">' + top.name + '</h2>' +
          '<p class="wrapped__stat">' + top.cost.toFixed(2) + ' ' + stats.currency + '</p>'
      });
    }

    // Slide 5: Top category
    var categoryTrends = insights.categoryTrends;
    var topCat = Object.entries(categoryTrends).sort(function(a, b) { return b[1].total - a[1].total; })[0];
    if (topCat) {
      slides.push({
        gradient: 'linear-gradient(135deg, #3B82F6, #14B8A6)',
        content: '<p class="wrapped__label">' + I18n.t('wrapped.top_category') + '</p>' +
          '<h1 class="wrapped__big-text">' + I18n.t('category.' + topCat[0]) + '</h1>' +
          '<p class="wrapped__stat">' + topCat[1].count + ' ' + I18n.t('wrapped.subscriptions') + '</p>' +
          '<p class="wrapped__stat">' + topCat[1].percentage + '% ' + I18n.t('wrapped.of_spending') + '</p>'
      });
    }

    // Slide 6: Daily cost
    slides.push({
      gradient: 'linear-gradient(135deg, #10B981, #3B82F6)',
      content: '<p class="wrapped__label">' + I18n.t('wrapped.daily_cost') + '</p>' +
        '<h1 class="wrapped__huge-number">' + insights.costPerDay.toFixed(2) + '</h1>' +
        '<p class="wrapped__label">' + stats.currency + ' / ' + I18n.t('wrapped.per_day') + '</p>'
    });

    // Slide 7: Gamification
    var profile = Gamification.getProfile();
    var levelInfo = Gamification.getLevel(profile.xp);
    slides.push({
      gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
      content: '<p class="wrapped__label">' + I18n.t('wrapped.your_level') + '</p>' +
        '<div class="wrapped__emoji">' + levelInfo.icon + '</div>' +
        '<h2 class="wrapped__big-text">' + I18n.t('level.' + levelInfo.name) + '</h2>' +
        '<p class="wrapped__stat">' + profile.xp + ' XP</p>' +
        '<p class="wrapped__stat">' + I18n.t('wrapped.streak') + ': ' + (profile.streak || 0) + ' ' + I18n.t('wrapped.days') + '</p>'
    });

    // Slide 8: Outro
    slides.push({
      gradient: 'linear-gradient(135deg, #7C3AED, #14B8A6, #F97316)',
      content: '<div class="wrapped__emoji">🎉</div>' +
        '<h1 class="wrapped__big-text">' + I18n.t('wrapped.thats_your_year') + '</h1>' +
        '<p class="wrapped__subtitle">' + I18n.t('wrapped.share_results') + '</p>' +
        '<button class="btn btn--primary wrapped__share-btn" id="wrapped-share-btn">' + I18n.t('wrapped.share') + '</button>'
    });

    return slides;
  }

  function _renderSlide() {
    var container = document.getElementById('wrapped-slides');
    var dotsContainer = document.getElementById('wrapped-dots');
    var slide = _slides[_currentSlide];

    container.innerHTML = '<div class="wrapped__slide" style="background:' + slide.gradient + '">' +
      '<div class="wrapped__slide-content">' + slide.content + '</div>' +
    '</div>';

    // Dots
    dotsContainer.innerHTML = _slides.map(function(_, i) {
      return '<span class="wrapped__dot' + (i === _currentSlide ? ' active' : '') + '"></span>';
    }).join('');

    // Prev/Next
    document.getElementById('wrapped-prev').hidden = _currentSlide === 0;
    var nextBtn = document.getElementById('wrapped-next');
    nextBtn.textContent = _currentSlide >= _slides.length - 1 ? I18n.t('wrapped.finish') : I18n.t('wrapped.next');

    // Share button on last slide
    var shareBtn = document.getElementById('wrapped-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        _closeWrapped();
        SocialShare.renderShareModal();
      });
    }

    // Animate in
    var slideEl = container.querySelector('.wrapped__slide');
    slideEl.style.opacity = '0';
    slideEl.style.transform = 'scale(0.9)';
    requestAnimationFrame(function() {
      slideEl.style.transition = 'opacity 0.5s, transform 0.5s';
      slideEl.style.opacity = '1';
      slideEl.style.transform = 'scale(1)';
    });
  }

  function _goToSlide(index) {
    if (index < 0 || index >= _slides.length) return;
    _currentSlide = index;
    _renderSlide();
  }

  function _closeWrapped() {
    var modal = document.getElementById('wrapped-modal');
    if (modal) {
      modal.classList.remove('modal--visible');
      modal.classList.add('modal--closing');
      setTimeout(function() { modal.remove(); }, 250);
    }
  }

  return {
    renderWrapped: renderWrapped
  };
})();
