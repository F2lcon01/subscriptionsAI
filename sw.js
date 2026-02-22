/**
 * SubTracker — Service Worker
 * Offline caching with app shell strategy
 */

const CACHE_NAME = 'subtracker-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/reset.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/auth.css',
  './css/dashboard.css',
  './css/subscriptions.css',
  './css/modal.css',
  './css/settings.css',
  './css/responsive.css',
  './css/animations.css',
  './css/reports.css',
  './css/calendar.css',
  './css/tools.css',
  './css/sharing.css',
  './css/wrapped.css',
  './css/ai-chat.css',
  './js/config/firebase.js',
  './js/modules/i18n.js',
  './js/modules/theme.js',
  './js/modules/router.js',
  './js/modules/toast.js',
  './js/services/crypto.js',
  './js/modules/panic-mode.js',
  './js/services/auth.js',
  './js/services/subscriptions.js',
  './js/services/currency.js',
  './js/services/logo-service.js',
  './js/services/notifications.js',
  './js/services/insights.js',
  './js/services/alerts.js',
  './js/services/gamification.js',
  './js/services/sharing.js',
  './js/services/export.js',
  './js/services/import.js',
  './js/modules/dashboard.js',
  './js/modules/subscription-modal.js',
  './js/modules/subscription-list.js',
  './js/modules/reports.js',
  './js/modules/calendar.js',
  './js/modules/mini-apps.js',
  './js/modules/social-share.js',
  './js/modules/yearly-wrapped.js',
  './js/services/ai-companion.js',
  './js/modules/admin.js',
  './js/modules/settings.js',
  './js/app.js',
  './locales/en.json',
  './locales/ar.json'
];

// Install — pre-cache app shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL).catch(function(err) {
        console.warn('SW: Some assets failed to cache:', err);
        // Cache what we can
        return Promise.allSettled(APP_SHELL.map(function(url) {
          return cache.add(url).catch(function() {
            console.warn('SW: Failed to cache:', url);
          });
        }));
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first for app shell, network-first for API
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip Firebase API calls (Firestore, Auth)
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    return;
  }

  // CDN scripts — stale-while-revalidate
  if (url.hostname.includes('gstatic.com') ||
      url.hostname.includes('cdn.jsdelivr.net')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cached) {
          var fetchPromise = fetch(event.request).then(function(response) {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          }).catch(function() { return cached; });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // App shell — cache-first
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response.ok && url.origin === self.location.origin) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Push notification handler
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'اشتراكاتي';
  var options = {
    body: data.body || '',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png',
    data: data.data || {},
    actions: data.actions || []
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('./');
      }
    })
  );
});
