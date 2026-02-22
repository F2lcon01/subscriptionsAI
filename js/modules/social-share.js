/**
 * SubTracker — Social Sharing
 * Share subscription summaries publicly
 * PRD Section 6.2: Social Sharing
 */

const SocialShare = (function() {
  'use strict';

  function renderShareModal() {
    var existingModal = document.getElementById('share-modal');
    if (existingModal) existingModal.remove();

    var subs = SubscriptionService.getAll();
    var stats = SubscriptionService.getStats();

    var modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'modal';
    modal.innerHTML = '' +
      '<div class="modal__backdrop" id="share-backdrop"></div>' +
      '<div class="modal__content" style="max-width:560px">' +
        '<div class="modal__header">' +
          '<h2 class="modal__title">' + I18n.t('share.title') + '</h2>' +
          '<button class="modal__close" id="share-close-btn">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +

        // Template selector
        '<div class="share__templates">' +
          '<button class="share__template active" data-template="minimal">' + I18n.t('share.minimal') + '</button>' +
          '<button class="share__template" data-template="detailed">' + I18n.t('share.detailed') + '</button>' +
          '<button class="share__template" data-template="card">' + I18n.t('share.card') + '</button>' +
        '</div>' +

        // Privacy notice
        '<div class="share__privacy">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' +
          '<span>' + I18n.t('share.privacy_notice') + '</span>' +
        '</div>' +

        // Select subscriptions
        '<div class="share__select">' +
          '<h4>' + I18n.t('share.select_subs') + '</h4>' +
          '<div class="share__sub-list">' +
            subs.map(function(sub) {
              return '<label class="share__sub-item">' +
                '<input type="checkbox" class="share__sub-check" data-id="' + sub.id + '" checked>' +
                '<span>' + (sub.icon || '📦') + ' ' + sub.name + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
        '</div>' +

        // Preview
        '<div class="share__preview" id="share-preview"></div>' +

        // Actions
        '<div class="share__actions">' +
          '<button class="btn btn--primary" id="share-copy-btn">' + I18n.t('share.copy_text') + '</button>' +
          '<button class="btn btn--secondary" id="share-image-btn">' + I18n.t('share.download_image') + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function() { modal.classList.add('modal--visible'); });

    // Bind events
    document.getElementById('share-close-btn').onclick = _closeModal;
    document.getElementById('share-backdrop').onclick = _closeModal;

    modal.querySelectorAll('.share__template').forEach(function(btn) {
      btn.addEventListener('click', function() {
        modal.querySelectorAll('.share__template').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        _updatePreview(subs, stats, btn.dataset.template);
      });
    });

    modal.querySelectorAll('.share__sub-check').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var template = modal.querySelector('.share__template.active').dataset.template;
        _updatePreview(subs, stats, template);
      });
    });

    document.getElementById('share-copy-btn').addEventListener('click', function() {
      var preview = document.getElementById('share-preview');
      navigator.clipboard.writeText(preview.textContent).then(function() {
        Toast.success(I18n.t('share.copied'));
      });
    });

    document.getElementById('share-image-btn').addEventListener('click', function() {
      _downloadAsImage(subs, stats);
    });

    _updatePreview(subs, stats, 'minimal');
  }

  function _updatePreview(subs, stats, template) {
    var preview = document.getElementById('share-preview');
    var selected = _getSelected(subs);

    switch (template) {
      case 'minimal':
        preview.innerHTML = '<div class="share__card share__card--minimal">' +
          '<h3>' + I18n.t('share.my_subscriptions') + '</h3>' +
          '<p>' + selected.length + ' ' + I18n.t('share.subscriptions') + '</p>' +
          '<div class="share__list">' +
            selected.map(function(s) { return '<span class="share__tag">' + (s.icon || '📦') + ' ' + s.name + '</span>'; }).join('') +
          '</div>' +
        '</div>';
        break;

      case 'detailed':
        preview.innerHTML = '<div class="share__card share__card--detailed">' +
          '<h3>' + I18n.t('share.my_subscriptions') + '</h3>' +
          '<div class="share__detailed-list">' +
            selected.map(function(s) {
              return '<div class="share__detailed-item">' +
                '<span>' + (s.icon || '📦') + ' ' + s.name + '</span>' +
                '<span>' + I18n.t('category.' + (s.category || 'other')) + '</span>' +
                '<span>' + I18n.t('cycle.' + s.billingCycle) + '</span>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
        break;

      case 'card':
        var categories = {};
        selected.forEach(function(s) {
          var cat = s.category || 'other';
          categories[cat] = (categories[cat] || 0) + 1;
        });
        preview.innerHTML = '<div class="share__card share__card--visual">' +
          '<h3>' + I18n.t('share.my_stack') + '</h3>' +
          '<div class="share__stats">' +
            '<div class="share__stat">' + selected.length + '<small>' + I18n.t('share.total') + '</small></div>' +
            '<div class="share__stat">' + Object.keys(categories).length + '<small>' + I18n.t('share.categories') + '</small></div>' +
          '</div>' +
          '<div class="share__icons">' +
            selected.map(function(s) { return '<span class="share__icon-circle">' + (s.icon || '📦') + '</span>'; }).join('') +
          '</div>' +
          '<small class="share__watermark">SubTracker</small>' +
        '</div>';
        break;
    }
  }

  function _getSelected(subs) {
    var checks = document.querySelectorAll('.share__sub-check:checked');
    var ids = [];
    checks.forEach(function(c) { ids.push(c.dataset.id); });
    return subs.filter(function(s) { return ids.includes(s.id); });
  }

  function _downloadAsImage(subs, stats) {
    var preview = document.getElementById('share-preview');
    var card = preview.querySelector('.share__card');
    if (!card) return;

    // Use canvas to create image
    var canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    var ctx = canvas.getContext('2d');

    // Background
    var gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#7C3AED');
    gradient.addColorStop(1, '#14B8A6');
    ctx.fillStyle = gradient;
    ctx.roundRect(0, 0, 600, 400, 16);
    ctx.fill();

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(I18n.t('share.my_subscriptions'), 300, 60);

    var selected = _getSelected(subs);
    ctx.font = '18px system-ui';
    ctx.fillText(selected.length + ' ' + I18n.t('share.subscriptions'), 300, 95);

    // Icons grid
    var startX = 300 - (Math.min(selected.length, 5) * 60) / 2;
    var y = 140;
    selected.forEach(function(sub, i) {
      if (i > 0 && i % 5 === 0) { y += 70; startX = 300 - (Math.min(selected.length - i, 5) * 60) / 2; }
      var x = startX + (i % 5) * 60;
      ctx.font = '32px system-ui';
      ctx.fillText(sub.icon || '📦', x + 25, y);
      ctx.font = '11px system-ui';
      ctx.fillText(sub.name.substring(0, 10), x + 25, y + 22);
    });

    // Watermark
    ctx.font = '14px system-ui';
    ctx.globalAlpha = 0.7;
    ctx.fillText('SubTracker', 300, 380);

    canvas.toBlob(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'my-subscriptions.png';
      a.click();
      URL.revokeObjectURL(url);
      Toast.success(I18n.t('share.image_saved'));
    });
  }

  function _closeModal() {
    var modal = document.getElementById('share-modal');
    if (modal) {
      modal.classList.remove('modal--visible');
      modal.classList.add('modal--closing');
      setTimeout(function() { modal.remove(); }, 250);
    }
  }

  return {
    renderShareModal: renderShareModal
  };
})();
