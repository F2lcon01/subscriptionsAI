/**
 * SubTracker — Data Export Service
 * Export subscriptions as CSV or PDF
 * PRD Section 6.2: Data Export
 */

const ExportService = (function() {
  'use strict';

  /**
   * Export subscriptions as CSV
   */
  function exportCSV() {
    var subs = SubscriptionService.getAll();
    if (subs.length === 0) {
      Toast.warning(I18n.t('export.no_data'));
      return;
    }

    var headers = [
      'Name', 'Amount', 'Currency', 'Billing Cycle', 'Category',
      'Status', 'Start Date', 'Next Renewal', 'Your Share',
      'Subscription Type', 'URL', 'Notes'
    ];

    var rows = subs.map(function(s) {
      return [
        _csvEscape(s.name),
        s.amount,
        s.currency || 'SAR',
        s.billingCycle || 'monthly',
        s.category || 'other',
        s.status || 'active',
        s.startDate || '',
        s.nextRenewalDate || '',
        s.yourShare || s.amount,
        s.subscriptionType || 'individual',
        _csvEscape(s.url || ''),
        _csvEscape(s.notes || '')
      ].join(',');
    });

    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    _downloadFile(csv, 'subscriptions_' + _dateStamp() + '.csv', 'text/csv;charset=utf-8');
    Toast.success(I18n.t('export.csv_success'));
  }

  /**
   * Export subscriptions as PDF
   */
  function exportPDF() {
    var subs = SubscriptionService.getAll();
    if (subs.length === 0) {
      Toast.warning(I18n.t('export.no_data'));
      return;
    }

    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
      Toast.error(I18n.t('export.pdf_not_available'));
      return;
    }

    var jsPDF = (window.jspdf && window.jspdf.jsPDF) || jspdf.jsPDF;
    var doc = new jsPDF();
    var stats = SubscriptionService.getStats();

    // Title
    doc.setFontSize(20);
    doc.text('SubTracker - Subscription Report', 14, 20);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Generated: ' + new Date().toLocaleDateString(), 14, 28);

    // Summary stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Summary', 14, 40);
    doc.setFontSize(10);
    doc.text('Active Subscriptions: ' + stats.activeCount, 14, 48);
    doc.text('Monthly Total: ' + stats.monthlyTotal.toFixed(2), 14, 55);
    doc.text('Yearly Total: ' + stats.yearlyTotal.toFixed(2), 14, 62);

    // Table header
    var y = 76;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Name', 14, y);
    doc.text('Amount', 80, y);
    doc.text('Cycle', 110, y);
    doc.text('Status', 140, y);
    doc.text('Next Renewal', 165, y);
    doc.setFont(undefined, 'normal');

    // Draw line
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y, 196, y);
    y += 6;

    // Table rows
    subs.forEach(function(s) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text((s.name || '').substring(0, 25), 14, y);
      doc.text((s.yourShare || s.amount || 0).toFixed(2) + ' ' + (s.currency || 'SAR'), 80, y);
      doc.text(s.billingCycle || 'monthly', 110, y);
      doc.text(s.status || 'active', 140, y);
      doc.text(s.nextRenewalDate || '-', 165, y);
      y += 7;
    });

    doc.save('subscriptions_' + _dateStamp() + '.pdf');
    Toast.success(I18n.t('export.pdf_success'));
  }

  // =============================================
  // PRIVATE
  // =============================================

  function _csvEscape(str) {
    if (!str) return '';
    str = str.toString();
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function _dateStamp() {
    return new Date().toISOString().split('T')[0];
  }

  function _downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return {
    exportCSV: exportCSV,
    exportPDF: exportPDF
  };
})();
