/**
 * SubTracker — Subscription Modal
 * Add / Edit subscription form with popular service quick-select
 * PRD Section 6.1: Add Subscription
 */

const SubscriptionModal = (function() {
  'use strict';

  let _editingId = null;
  let _selectedService = null;

  /**
   * Open modal for adding a new subscription
   */
  function open() {
    _editingId = null;
    _selectedService = null;
    _renderModal(null);
    _showModal();
  }

  /**
   * Open modal for editing an existing subscription
   * @param {string} id - Subscription ID
   */
  function edit(id) {
    var sub = SubscriptionService.getById(id);
    if (!sub) return;
    _editingId = id;
    _selectedService = null;
    _renderModal(sub);
    _showModal();
  }

  /**
   * Close the modal
   */
  function close() {
    var modal = document.getElementById('subscription-modal');
    if (modal) {
      modal.classList.add('modal--closing');
      setTimeout(function() {
        modal.remove();
      }, 250);
    }
  }

  // =============================================
  // RENDER
  // =============================================

  function _renderModal(existingData) {
    // Remove existing modal if any
    var existing = document.getElementById('subscription-modal');
    if (existing) existing.remove();

    var isEdit = !!existingData;
    var data = existingData || {};

    var modal = document.createElement('div');
    modal.id = 'subscription-modal';
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = '' +
      '<div class="modal__backdrop" id="modal-backdrop"></div>' +
      '<div class="modal__content">' +
        '<div class="modal__header">' +
          '<h2 class="modal__title" data-i18n="' + (isEdit ? 'subscription.edit_title' : 'subscription.add_title') + '">' +
            (isEdit ? 'Edit Subscription' : 'Add Subscription') +
          '</h2>' +
          '<button class="modal__close" id="modal-close-btn" aria-label="Close">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>' +
            '</svg>' +
          '</button>' +
        '</div>' +

        // Popular Services Quick Select (only for new subscriptions)
        (!isEdit ? _popularServicesHTML() : '') +

        '<form class="modal__form" id="subscription-form" novalidate>' +
          // Service Name
          '<div class="form-group">' +
            '<label class="form-group__label" for="sub-name" data-i18n="subscription.name">Service Name</label>' +
            '<input class="form-group__input" type="text" id="sub-name" data-i18n-placeholder="subscription.name_placeholder" placeholder="e.g. Netflix, Spotify..." value="' + _escapeAttr(data.name || '') + '" required>' +
            '<span class="form-group__error" id="sub-name-error"></span>' +
          '</div>' +

          // Amount + Currency + Billing Cycle Row
          '<div class="form-row form-row--3">' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="sub-amount" data-i18n="subscription.amount">Amount</label>' +
              '<input class="form-group__input" type="number" id="sub-amount" step="0.01" min="0" placeholder="0.00" value="' + (data.amount || '') + '" required>' +
              '<span class="form-group__error" id="sub-amount-error"></span>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="sub-currency" data-i18n="subscription.currency">Currency</label>' +
              '<select class="form-group__input" id="sub-currency">' +
                _currencyOptionsHTML(data.currency || 'SAR') +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="sub-cycle" data-i18n="subscription.billing_cycle">Billing Cycle</label>' +
              '<select class="form-group__input" id="sub-cycle">' +
                _cycleOptionsHTML(data.billingCycle || 'monthly') +
              '</select>' +
            '</div>' +
          '</div>' +

          // Category
          '<div class="form-group">' +
            '<label class="form-group__label" data-i18n="subscription.category">Category</label>' +
            '<div class="category-selector" id="category-selector">' +
              _categoryButtonsHTML(data.category || 'other') +
            '</div>' +
          '</div>' +

          // Start Date
          '<div class="form-group">' +
            '<label class="form-group__label" for="sub-start-date" data-i18n="subscription.start_date">Start Date</label>' +
            '<input class="form-group__input" type="date" id="sub-start-date" value="' + (data.startDate || new Date().toISOString().split('T')[0]) + '">' +
          '</div>' +

          // Free Trial Toggle
          '<div class="form-group">' +
            '<label class="toggle">' +
              '<input type="checkbox" id="sub-is-trial" ' + (data.isTrial ? 'checked' : '') + '>' +
              '<span class="toggle__slider"></span>' +
              '<span class="toggle__label" data-i18n="subscription.is_trial">Free Trial</span>' +
            '</label>' +
          '</div>' +

          // Trial End Date (shown conditionally)
          '<div class="form-group" id="trial-end-group" ' + (data.isTrial ? '' : 'hidden') + '>' +
            '<label class="form-group__label" for="sub-trial-end" data-i18n="subscription.trial_end_date">Trial End Date</label>' +
            '<input class="form-group__input" type="date" id="sub-trial-end" value="' + (data.trialEndDate || '') + '">' +
          '</div>' +

          // Subscription Type (Individual / Family / Shared)
          '<div class="form-group">' +
            '<label class="form-group__label" data-i18n="subscription.type">Subscription Type</label>' +
            '<div class="type-selector" id="type-selector">' +
              '<button type="button" class="type-btn ' + ((!data.subscriptionType || data.subscriptionType === 'individual') ? 'type-btn--active' : '') + '" data-type="individual">' +
                '<span>👤</span> <span data-i18n="subscription.type_individual">Individual</span>' +
              '</button>' +
              '<button type="button" class="type-btn ' + (data.subscriptionType === 'family' ? 'type-btn--active' : '') + '" data-type="family">' +
                '<span>👨‍👩‍👧‍👦</span> <span data-i18n="subscription.type_family">Family</span>' +
              '</button>' +
              '<button type="button" class="type-btn ' + (data.subscriptionType === 'shared' ? 'type-btn--active' : '') + '" data-type="shared">' +
                '<span>🤝</span> <span data-i18n="subscription.type_shared">Shared</span>' +
              '</button>' +
            '</div>' +
          '</div>' +

          // Your Share (shown for family/shared)
          '<div class="form-group" id="share-group" ' + ((data.subscriptionType === 'family' || data.subscriptionType === 'shared') ? '' : 'hidden') + '>' +
            '<label class="form-group__label" for="sub-your-share" data-i18n="subscription.your_share">Your Share</label>' +
            '<input class="form-group__input" type="number" id="sub-your-share" step="0.01" min="0" placeholder="0.00" value="' + (data.yourShare || '') + '">' +
          '</div>' +

          // URL
          '<div class="form-group">' +
            '<label class="form-group__label" for="sub-url" data-i18n="subscription.url">Service URL (optional)</label>' +
            '<input class="form-group__input" type="url" id="sub-url" placeholder="https://" value="' + _escapeAttr(data.url || '') + '">' +
          '</div>' +

          // Notes
          '<div class="form-group">' +
            '<label class="form-group__label" for="sub-notes" data-i18n="subscription.notes">Notes (optional)</label>' +
            '<textarea class="form-group__input form-group__textarea" id="sub-notes" rows="2" data-i18n-placeholder="subscription.notes_placeholder" placeholder="Any additional notes...">' + _escapeHTML(data.notes || '') + '</textarea>' +
          '</div>' +

          // Login Credentials
          '<div class="form-group">' +
            '<label class="form-group__label" data-i18n="subscription.credentials">Login Credentials (optional)</label>' +
          '</div>' +
          '<div class="form-row form-row--2">' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="sub-credential-user" data-i18n="subscription.credential_username">Username / Email</label>' +
              '<input class="form-group__input" type="text" id="sub-credential-user" data-i18n-placeholder="subscription.credential_username_placeholder" placeholder="Email or username" value="' + _escapeAttr((data.credentials && data.credentials.username) || '') + '">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-group__label" for="sub-credential-pass" data-i18n="subscription.credential_password">Password</label>' +
              '<div style="position:relative">' +
                '<input class="form-group__input" type="password" id="sub-credential-pass" data-i18n-placeholder="subscription.credential_password_placeholder" placeholder="Service password" value="' + _escapeAttr((data.credentials && data.credentials.password) || '') + '">' +
                '<button type="button" class="form-group__toggle" id="credential-pass-toggle" aria-label="Toggle password visibility">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                    '<circle cx="12" cy="12" r="3"></circle>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Submit
          '<div class="modal__actions">' +
            (isEdit ?
              '<button type="button" class="btn btn--danger" id="modal-delete-btn">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
                '<span data-i18n="common.delete">Delete</span>' +
              '</button>' : '<div></div>') +
            '<button type="submit" class="btn btn--primary" id="modal-submit-btn">' +
              '<span data-i18n="' + (isEdit ? 'common.save' : 'subscription.add_btn') + '">' + (isEdit ? 'Save' : 'Add Subscription') + '</span>' +
            '</button>' +
          '</div>' +
        '</form>' +
      '</div>';

    document.body.appendChild(modal);
    I18n.translatePage();
    _bindModalEvents();
  }

  function _popularServicesHTML() {
    var services = SubscriptionService.getPopularServices();
    var html = '<div class="popular-services" id="popular-services">' +
      '<p class="popular-services__label" data-i18n="subscription.quick_select">Quick select:</p>' +
      '<div class="popular-services__grid">';

    services.forEach(function(service) {
      html += '<button type="button" class="popular-service-btn" data-service-id="' + service.id + '" title="' + service.name + '">' +
        '<span class="popular-service-btn__icon">' + service.icon + '</span>' +
        '<span class="popular-service-btn__name">' + service.name + '</span>' +
      '</button>';
    });

    html += '</div></div>';
    return html;
  }

  function _currencyOptionsHTML(selected) {
    var currencies = SubscriptionService.getCurrencies();
    return currencies.map(function(c) {
      return '<option value="' + c.code + '" ' + (c.code === selected ? 'selected' : '') + '>' + c.code + ' (' + c.symbol + ')</option>';
    }).join('');
  }

  function _cycleOptionsHTML(selected) {
    var cycles = [
      { id: 'weekly', i18n: 'cycle.weekly' },
      { id: 'monthly', i18n: 'cycle.monthly' },
      { id: 'quarterly', i18n: 'cycle.quarterly' },
      { id: 'semi-annual', i18n: 'cycle.semi_annual' },
      { id: 'yearly', i18n: 'cycle.yearly' }
    ];
    return cycles.map(function(c) {
      var label = I18n.t(c.i18n) || c.id;
      return '<option value="' + c.id + '" ' + (c.id === selected ? 'selected' : '') + '>' + label + '</option>';
    }).join('');
  }

  function _categoryButtonsHTML(selected) {
    var categories = SubscriptionService.getCategories();
    return categories.map(function(cat) {
      var label = I18n.t('category.' + cat.id) || cat.id;
      return '<button type="button" class="category-btn ' + (cat.id === selected ? 'category-btn--active' : '') + '" data-category="' + cat.id + '">' +
        '<span>' + cat.icon + '</span> ' + label +
      '</button>';
    }).join('');
  }

  // =============================================
  // EVENTS
  // =============================================

  function _bindModalEvents() {
    // Close handlers
    var closeBtn = document.getElementById('modal-close-btn');
    var backdrop = document.getElementById('modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    // Escape key
    document.addEventListener('keydown', _onEscape);

    // Popular service quick select
    var popularGrid = document.querySelector('.popular-services__grid');
    if (popularGrid) {
      popularGrid.addEventListener('click', function(e) {
        var btn = e.target.closest('.popular-service-btn');
        if (!btn) return;
        var serviceId = btn.getAttribute('data-service-id');
        var services = SubscriptionService.getPopularServices();
        var service = services.find(function(s) { return s.id === serviceId; });
        if (service) {
          _selectedService = service;
          document.getElementById('sub-name').value = service.name;
          document.getElementById('sub-url').value = service.url || '';
          // Set category
          var catBtns = document.querySelectorAll('.category-btn');
          catBtns.forEach(function(b) {
            b.classList.toggle('category-btn--active', b.getAttribute('data-category') === service.category);
          });
          // Highlight selected service
          document.querySelectorAll('.popular-service-btn').forEach(function(b) {
            b.classList.toggle('popular-service-btn--active', b === btn);
          });
        }
      });
    }

    // Category selector
    var catSelector = document.getElementById('category-selector');
    if (catSelector) {
      catSelector.addEventListener('click', function(e) {
        var btn = e.target.closest('.category-btn');
        if (!btn) return;
        document.querySelectorAll('.category-btn').forEach(function(b) {
          b.classList.remove('category-btn--active');
        });
        btn.classList.add('category-btn--active');
      });
    }

    // Type selector
    var typeSelector = document.getElementById('type-selector');
    if (typeSelector) {
      typeSelector.addEventListener('click', function(e) {
        var btn = e.target.closest('.type-btn');
        if (!btn) return;
        document.querySelectorAll('.type-btn').forEach(function(b) {
          b.classList.remove('type-btn--active');
        });
        btn.classList.add('type-btn--active');
        // Show/hide share field
        var type = btn.getAttribute('data-type');
        var shareGroup = document.getElementById('share-group');
        if (shareGroup) shareGroup.hidden = (type === 'individual');
      });
    }

    // Trial toggle
    var trialToggle = document.getElementById('sub-is-trial');
    if (trialToggle) {
      trialToggle.addEventListener('change', function() {
        var trialGroup = document.getElementById('trial-end-group');
        if (trialGroup) trialGroup.hidden = !this.checked;
      });
    }

    // Form submit
    var form = document.getElementById('subscription-form');
    if (form) {
      form.addEventListener('submit', _onSubmit);
    }

    // Delete button
    var deleteBtn = document.getElementById('modal-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', _onDelete);
    }

    // Credential password toggle
    _bindPasswordToggle('credential-pass-toggle', 'sub-credential-pass');
  }

  function _bindPasswordToggle(toggleId, inputId) {
    var toggle = document.getElementById(toggleId);
    var input = document.getElementById(inputId);
    if (!toggle || !input) return;
    toggle.addEventListener('click', function() {
      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
    });
  }

  function _onEscape(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', _onEscape);
    }
  }

  async function _onSubmit(e) {
    e.preventDefault();

    // Gather form data
    var name = document.getElementById('sub-name').value.trim();
    var amount = document.getElementById('sub-amount').value;
    var currency = document.getElementById('sub-currency').value;
    var billingCycle = document.getElementById('sub-cycle').value;
    var startDate = document.getElementById('sub-start-date').value;
    var isTrial = document.getElementById('sub-is-trial').checked;
    var trialEndDate = document.getElementById('sub-trial-end').value;
    var url = document.getElementById('sub-url').value.trim();
    var notes = document.getElementById('sub-notes').value.trim();
    var credUser = document.getElementById('sub-credential-user').value.trim();
    var credPass = document.getElementById('sub-credential-pass').value;

    // Get selected category
    var activeCategory = document.querySelector('.category-btn--active');
    var category = activeCategory ? activeCategory.getAttribute('data-category') : 'other';

    // Get subscription type
    var activeType = document.querySelector('.type-btn--active');
    var subscriptionType = activeType ? activeType.getAttribute('data-type') : 'individual';

    var yourShare = document.getElementById('sub-your-share').value;

    // Validation
    if (!name) {
      _showFieldError('sub-name', I18n.t('auth.error.name_required'));
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      _showFieldError('sub-amount', I18n.t('subscription.error.amount_required'));
      return;
    }

    var submitBtn = document.getElementById('modal-submit-btn');
    submitBtn.disabled = true;

    // Build data
    var data = {
      name: name,
      amount: parseFloat(amount),
      currency: currency,
      billingCycle: billingCycle,
      startDate: startDate,
      category: category,
      isTrial: isTrial,
      trialEndDate: isTrial ? trialEndDate : null,
      url: url,
      notes: notes,
      subscriptionType: subscriptionType,
      totalCost: parseFloat(amount),
      yourShare: (subscriptionType !== 'individual' && yourShare) ? parseFloat(yourShare) : parseFloat(amount),
      icon: _selectedService ? _selectedService.icon : _getCategoryIcon(category),
      color: _selectedService ? _selectedService.color : '#3498DB',
      credentials: { username: credUser, password: credPass }
    };

    try {
      if (_editingId) {
        await SubscriptionService.update(_editingId, data);
        Toast.success(I18n.t('subscription.updated'));
      } else {
        await SubscriptionService.add(data);
        Toast.success(I18n.t('subscription.added'));
      }
      close();
    } catch(err) {
      console.error('Subscription save error:', err);
      Toast.error(I18n.t('toast.error'));
      submitBtn.disabled = false;
    }
  }

  async function _onDelete() {
    if (!_editingId) return;

    var confirmed = confirm(I18n.t('subscription.delete_confirm'));
    if (!confirmed) return;

    try {
      await SubscriptionService.remove(_editingId);
      Toast.success(I18n.t('subscription.deleted'));
      close();
    } catch(err) {
      console.error('Delete error:', err);
      Toast.error(I18n.t('toast.error'));
    }
  }

  // =============================================
  // HELPERS
  // =============================================

  function _showModal() {
    var modal = document.getElementById('subscription-modal');
    if (modal) {
      requestAnimationFrame(function() {
        modal.classList.add('modal--visible');
        // Focus first input
        var firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) firstInput.focus();
      });
    }
  }

  function _showFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    var errorEl = document.getElementById(inputId + '-error');
    if (input) input.parentElement.classList.add('form-group--error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function _getCategoryIcon(category) {
    var cats = SubscriptionService.getCategories();
    var found = cats.find(function(c) { return c.id === category; });
    return found ? found.icon : '📦';
  }

  function _escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function _escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return {
    open: open,
    edit: edit,
    close: close
  };
})();
