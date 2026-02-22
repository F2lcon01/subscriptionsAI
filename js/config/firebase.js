/**
 * Firebase Configuration
 * Project: subscriptionsAI (SubTracker)
 * Project ID: subscriptionsai
 *
 * Firebase API keys are safe to expose in client-side code.
 * Security is enforced through Firestore Security Rules and Auth.
 */

const firebaseConfig = {
  apiKey: "AIzaSyBj3yStX2CeK8jQLAslqid68R-W2s8NMpQ",
  authDomain: "subscriptionsai.firebaseapp.com",
  projectId: "subscriptionsai",
  storageBucket: "subscriptionsai.firebasestorage.app",
  messagingSenderId: "551923225949",
  appId: "1:551923225949:web:67d1435582517a001144b4",
  measurementId: "G-16K7XZ12DV"
};

/* Initialize Firebase */
firebase.initializeApp(firebaseConfig);

/* Export Firebase services for use across the app */
const auth = firebase.auth();
const db = firebase.firestore();

/* Enable Firestore offline persistence */
db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser.');
  }
});

/* Set auth persistence to LOCAL (survives browser restart) */
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(err) {
  console.warn('Auth persistence error:', err.message);
});
