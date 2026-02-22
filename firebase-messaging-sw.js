/**
 * SubTracker — Firebase Messaging Service Worker
 * Required by FCM for background push notifications
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBj3yStX2CeK8jQLAslqid68R-W2s8NMpQ",
  authDomain: "subscriptionsai.firebaseapp.com",
  projectId: "subscriptionsai",
  storageBucket: "subscriptionsai.firebasestorage.app",
  messagingSenderId: "551923225949",
  appId: "1:551923225949:web:67d1435582517a001144b4"
});

var messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var title = payload.notification.title || 'اشتراكاتي';
  var options = {
    body: payload.notification.body || '',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/icon-192.png'
  };
  return self.registration.showNotification(title, options);
});
