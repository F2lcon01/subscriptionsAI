/**
 * SubTracker — Team Sharing Service
 * Generate shareable links for read-only access
 * PRD Section 6.2: Team Sharing
 */

const SharingService = (function() {
  'use strict';

  /**
   * Generate a new share link
   * @returns {Promise<string>} share URL
   */
  async function generateShareLink() {
    var user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    var token = crypto.randomUUID ? crypto.randomUUID() : _generateId();

    await db.collection('users').doc(user.uid)
      .collection('sharedWith').doc(token).set({
        token: token,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        accessLevel: 'read',
        createdBy: user.displayName || user.email
      });

    return window.location.origin + window.location.pathname + '#/shared/' + user.uid + '/' + token;
  }

  /**
   * Get shared view data
   * @param {string} userId
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  async function getSharedView(userId, token) {
    try {
      // Verify token exists
      var tokenDoc = await db.collection('users').doc(userId)
        .collection('sharedWith').doc(token).get();

      if (!tokenDoc.exists) return null;

      // Get subscriptions
      var subsSnap = await db.collection('users').doc(userId)
        .collection('subscriptions').orderBy('createdAt', 'desc').get();

      var subs = [];
      subsSnap.forEach(function(doc) {
        var data = doc.data();
        // Strip sensitive data
        delete data.credentials;
        subs.push(Object.assign({ id: doc.id }, data));
      });

      // Get user info
      var userDoc = await db.collection('users').doc(userId).get();
      var userData = userDoc.exists ? userDoc.data() : {};

      return {
        ownerName: userData.displayName || 'User',
        subscriptions: subs,
        sharedAt: tokenDoc.data().createdAt
      };
    } catch (e) {
      console.error('Shared view error:', e);
      return null;
    }
  }

  /**
   * Revoke a share link
   */
  async function revokeShareLink(token) {
    var user = auth.currentUser;
    if (!user) return;

    await db.collection('users').doc(user.uid)
      .collection('sharedWith').doc(token).delete();
  }

  /**
   * List all active share links
   */
  async function listShareLinks() {
    var user = auth.currentUser;
    if (!user) return [];

    var snap = await db.collection('users').doc(user.uid)
      .collection('sharedWith').get();

    var links = [];
    snap.forEach(function(doc) {
      links.push(Object.assign({ id: doc.id }, doc.data()));
    });

    return links;
  }

  function _generateId() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, function() {
      return Math.floor(Math.random() * 16).toString(16);
    });
  }

  return {
    generateShareLink: generateShareLink,
    getSharedView: getSharedView,
    revokeShareLink: revokeShareLink,
    listShareLinks: listShareLinks
  };
})();
