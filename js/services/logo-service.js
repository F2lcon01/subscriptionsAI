/**
 * SubTracker — Logo Auto-Fetch Service
 * Fetches service logos from URLs
 * PRD Section 6.3: Service Logo Auto-Fetch
 */

const LogoService = (function() {
  'use strict';

  const GOOGLE_FAVICON = 'https://www.google.com/s2/favicons?sz=64&domain=';
  const CLEARBIT_LOGO = 'https://logo.clearbit.com/';

  /**
   * Get high-quality logo URL from service URL
   * @param {string} serviceUrl
   * @param {number} size - Desired size in pixels
   * @returns {string|null}
   */
  function getLogoUrl(serviceUrl, size) {
    if (!serviceUrl) return null;
    try {
      var domain = new URL(serviceUrl).hostname;
      return CLEARBIT_LOGO + domain + '?size=' + (size || 64);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get favicon URL (fallback)
   * @param {string} serviceUrl
   * @returns {string|null}
   */
  function getFaviconUrl(serviceUrl) {
    if (!serviceUrl) return null;
    try {
      var domain = new URL(serviceUrl).hostname;
      return GOOGLE_FAVICON + domain;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get the best available logo URL
   * @param {string} serviceUrl
   * @returns {string|null}
   */
  function getBestLogo(serviceUrl) {
    return getLogoUrl(serviceUrl, 64) || getFaviconUrl(serviceUrl);
  }

  return {
    getLogoUrl: getLogoUrl,
    getFaviconUrl: getFaviconUrl,
    getBestLogo: getBestLogo
  };
})();
