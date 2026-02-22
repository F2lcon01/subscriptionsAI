/**
 * SubTracker — Data Import Service
 * Import subscriptions from CSV files
 * PRD Section 6.3: Import from Spreadsheet
 */

const ImportService = (function() {
  'use strict';

  /**
   * Show import modal with file upload
   */
  function renderImportModal() {
    var existingModal = document.getElementById('import-modal');
    if (existingModal) existingModal.remove();

    var modal = document.createElement('div');
    modal.id = 'import-modal';
    modal.className = 'modal';
    modal.innerHTML = '' +
      '<div class="modal__backdrop" id="import-backdrop"></div>' +
      '<div class="modal__content" style="max-width:640px">' +
        '<div class="modal__header">' +
          '<h2 class="modal__title" data-i18n="import.title">' + I18n.t('import.title') + '</h2>' +
          '<button class="modal__close" id="import-close-btn">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div id="import-step-1">' +
          '<div class="import-dropzone" id="import-dropzone">' +
            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>' +
            '<p style="margin-block-start:var(--space-3);color:var(--color-text-secondary)">' + I18n.t('import.select_file') + '</p>' +
            '<input type="file" id="import-file" accept=".csv,.txt" hidden>' +
            '<button class="btn btn--secondary" id="import-browse-btn" style="margin-block-start:var(--space-3)">' + I18n.t('import.browse') + '</button>' +
          '</div>' +
        '</div>' +
        '<div id="import-step-2" hidden>' +
          '<div id="import-preview"></div>' +
          '<div style="display:flex;gap:var(--space-3);margin-block-start:var(--space-5)">' +
            '<button class="btn btn--primary" id="import-confirm-btn">' + I18n.t('import.confirm_btn') + '</button>' +
            '<button class="btn btn--ghost" id="import-cancel-btn">' + I18n.t('common.cancel') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    requestAnimationFrame(function() { modal.classList.add('modal--visible'); });

    // Bind events
    var fileInput = document.getElementById('import-file');
    document.getElementById('import-browse-btn').onclick = function() { fileInput.click(); };
    document.getElementById('import-close-btn').onclick = _closeImportModal;
    document.getElementById('import-backdrop').onclick = _closeImportModal;

    // Drag and drop
    var dropzone = document.getElementById('import-dropzone');
    dropzone.addEventListener('dragover', function(e) { e.preventDefault(); dropzone.style.borderColor = 'var(--color-primary)'; });
    dropzone.addEventListener('dragleave', function() { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropzone.style.borderColor = '';
      if (e.dataTransfer.files.length > 0) _handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) _handleFile(fileInput.files[0]);
    });
  }

  function _handleFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      _parseAndPreview(text);
    };
    reader.readAsText(file);
  }

  function _parseAndPreview(csvText) {
    var lines = csvText.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) {
      Toast.error(I18n.t('import.invalid_file'));
      return;
    }

    var headers = _parseCSVLine(lines[0]);
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var values = _parseCSVLine(lines[i]);
      if (values.length >= 2) rows.push(values);
    }

    if (rows.length === 0) {
      Toast.error(I18n.t('import.no_data'));
      return;
    }

    // Build preview
    var previewHTML = '' +
      '<p style="color:var(--color-text-secondary);font-size:var(--font-size-sm);margin-block-end:var(--space-3)">' +
        I18n.t('import.found_rows', { count: rows.length }) +
      '</p>' +
      '<div style="overflow-x:auto;max-height:300px">' +
      '<table class="import-table">' +
        '<thead><tr>' + headers.map(function(h) { return '<th>' + _escapeHTML(h) + '</th>'; }).join('') + '</tr></thead>' +
        '<tbody>' + rows.slice(0, 10).map(function(row) {
          return '<tr>' + row.map(function(v) { return '<td>' + _escapeHTML(v) + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>' +
      '</table></div>';

    if (rows.length > 10) {
      previewHTML += '<p style="color:var(--color-text-secondary);font-size:var(--font-size-xs);margin-block-start:var(--space-2)">...and ' + (rows.length - 10) + ' more rows</p>';
    }

    document.getElementById('import-preview').innerHTML = previewHTML;
    document.getElementById('import-step-1').hidden = true;
    document.getElementById('import-step-2').hidden = false;

    // Bind confirm
    document.getElementById('import-confirm-btn').onclick = function() {
      _importRows(headers, rows);
    };
    document.getElementById('import-cancel-btn').onclick = _closeImportModal;
  }

  async function _importRows(headers, rows) {
    var nameIdx = _findColumnIndex(headers, ['name', 'service', 'subscription', 'الاسم', 'الخدمة']);
    var amountIdx = _findColumnIndex(headers, ['amount', 'price', 'cost', 'المبلغ', 'السعر']);
    var currencyIdx = _findColumnIndex(headers, ['currency', 'العملة']);
    var cycleIdx = _findColumnIndex(headers, ['cycle', 'billing', 'billing cycle', 'الدورة']);
    var categoryIdx = _findColumnIndex(headers, ['category', 'التصنيف']);
    var dateIdx = _findColumnIndex(headers, ['start', 'start date', 'date', 'التاريخ']);

    if (nameIdx === -1 || amountIdx === -1) {
      Toast.error(I18n.t('import.missing_columns'));
      return;
    }

    var imported = 0;
    var errors = 0;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      try {
        var data = {
          name: row[nameIdx] || 'Imported',
          amount: parseFloat(row[amountIdx]) || 0,
          currency: currencyIdx >= 0 ? row[currencyIdx] : 'SAR',
          billingCycle: cycleIdx >= 0 ? _normalizeCycle(row[cycleIdx]) : 'monthly',
          category: categoryIdx >= 0 ? _normalizeCategory(row[categoryIdx]) : 'other',
          startDate: dateIdx >= 0 ? row[dateIdx] : new Date().toISOString().split('T')[0]
        };

        if (data.amount > 0 && data.name) {
          await SubscriptionService.add(data);
          imported++;
        }
      } catch (e) {
        errors++;
      }
    }

    _closeImportModal();
    Toast.success(I18n.t('import.success', { count: imported }));
    if (errors > 0) {
      Toast.warning(I18n.t('import.errors', { count: errors }));
    }
  }

  function _findColumnIndex(headers, keywords) {
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase().trim();
      for (var j = 0; j < keywords.length; j++) {
        if (h === keywords[j] || h.includes(keywords[j])) return i;
      }
    }
    return -1;
  }

  function _normalizeCycle(value) {
    if (!value) return 'monthly';
    var v = value.toLowerCase().trim();
    if (v.includes('week')) return 'weekly';
    if (v.includes('quarter')) return 'quarterly';
    if (v.includes('semi') || v.includes('6')) return 'semi-annual';
    if (v.includes('year') || v.includes('annual')) return 'yearly';
    return 'monthly';
  }

  function _normalizeCategory(value) {
    if (!value) return 'other';
    var v = value.toLowerCase().trim();
    var categories = ['entertainment', 'work', 'education', 'social', 'other'];
    for (var i = 0; i < categories.length; i++) {
      if (v.includes(categories[i])) return categories[i];
    }
    return 'other';
  }

  function _parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function _closeImportModal() {
    var modal = document.getElementById('import-modal');
    if (modal) {
      modal.classList.remove('modal--visible');
      modal.classList.add('modal--closing');
      setTimeout(function() { modal.remove(); }, 250);
    }
  }

  function _escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  return {
    renderImportModal: renderImportModal
  };
})();
