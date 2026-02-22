/**
 * SubTracker — Admin Dashboard
 * Global stats and user management
 * PRD Section 6.8: Admin Panel
 */

const AdminDashboard = (function() {
  'use strict';

  async function render() {
    var container = document.getElementById('page-admin');
    if (!container) return;

    var isAdmin = await _checkAdmin();
    if (!isAdmin) {
      container.innerHTML = '<div class="admin__denied">' +
        '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' +
        '<h2>' + I18n.t('admin.access_denied') + '</h2>' +
        '<p>' + I18n.t('admin.admin_only') + '</p>' +
      '</div>';
      return;
    }

    container.innerHTML = '<div class="admin">' +
      '<h1 class="admin__title">' + I18n.t('admin.title') + '</h1>' +
      '<div class="admin__loading">' + I18n.t('common.loading') + '</div>' +
    '</div>';

    try {
      var globalStats = await _fetchGlobalStats();
      _renderDashboard(container, globalStats);
    } catch (e) {
      container.querySelector('.admin__loading').textContent = I18n.t('admin.error');
      console.error('Admin error:', e);
    }
  }

  async function _checkAdmin() {
    var user = auth.currentUser;
    if (!user) return false;

    try {
      var doc = await db.collection('users').doc(user.uid).get();
      return doc.exists && doc.data().role === 'admin';
    } catch (e) {
      return false;
    }
  }

  async function _fetchGlobalStats() {
    var usersSnap = await db.collection('users').get();
    var totalUsers = usersSnap.size;
    var totalSubs = 0;
    var recentUsers = [];
    var now = new Date();

    usersSnap.forEach(function(doc) {
      var data = doc.data();
      totalSubs += data.subscriptionCount || 0;

      if (data.createdAt) {
        var created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        var daysDiff = (now - created) / (24 * 60 * 60 * 1000);
        if (daysDiff <= 30) {
          recentUsers.push({
            id: doc.id,
            name: data.displayName || data.email || 'Anonymous',
            email: data.email || '',
            createdAt: created,
            subscriptionCount: data.subscriptionCount || 0
          });
        }
      }
    });

    return {
      totalUsers: totalUsers,
      totalSubscriptions: totalSubs,
      recentUsers: recentUsers.sort(function(a, b) { return b.createdAt - a.createdAt; }),
      avgSubsPerUser: totalUsers > 0 ? Math.round(totalSubs / totalUsers * 10) / 10 : 0
    };
  }

  function _renderDashboard(container, stats) {
    container.querySelector('.admin').innerHTML = '' +
      '<h1 class="admin__title">' + I18n.t('admin.title') + '</h1>' +

      // Stats cards
      '<div class="admin__stats">' +
        '<div class="admin__stat-card">' +
          '<span class="admin__stat-icon">👥</span>' +
          '<span class="admin__stat-value">' + stats.totalUsers + '</span>' +
          '<span class="admin__stat-label">' + I18n.t('admin.total_users') + '</span>' +
        '</div>' +
        '<div class="admin__stat-card">' +
          '<span class="admin__stat-icon">📋</span>' +
          '<span class="admin__stat-value">' + stats.totalSubscriptions + '</span>' +
          '<span class="admin__stat-label">' + I18n.t('admin.total_subs') + '</span>' +
        '</div>' +
        '<div class="admin__stat-card">' +
          '<span class="admin__stat-icon">📊</span>' +
          '<span class="admin__stat-value">' + stats.avgSubsPerUser + '</span>' +
          '<span class="admin__stat-label">' + I18n.t('admin.avg_per_user') + '</span>' +
        '</div>' +
        '<div class="admin__stat-card">' +
          '<span class="admin__stat-icon">🆕</span>' +
          '<span class="admin__stat-value">' + stats.recentUsers.length + '</span>' +
          '<span class="admin__stat-label">' + I18n.t('admin.new_this_month') + '</span>' +
        '</div>' +
      '</div>' +

      // Recent users
      '<div class="admin__section">' +
        '<h2>' + I18n.t('admin.recent_signups') + '</h2>' +
        (stats.recentUsers.length === 0
          ? '<p class="admin__empty">' + I18n.t('admin.no_recent') + '</p>'
          : '<div class="admin__user-list">' +
              stats.recentUsers.map(function(user) {
                return '<div class="admin__user-item">' +
                  '<div class="admin__user-avatar">' + (user.name.charAt(0).toUpperCase()) + '</div>' +
                  '<div class="admin__user-info">' +
                    '<span class="admin__user-name">' + user.name + '</span>' +
                    '<span class="admin__user-email">' + user.email + '</span>' +
                  '</div>' +
                  '<div class="admin__user-meta">' +
                    '<span>' + user.subscriptionCount + ' ' + I18n.t('admin.subs') + '</span>' +
                    '<span>' + user.createdAt.toLocaleDateString(I18n.getLocale()) + '</span>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>') +
      '</div>';
  }

  return {
    render: render
  };
})();
