/**
 * SubTracker — Currency Conversion Service
 * Auto-convert amounts using exchange rates
 * PRD Section 6.2: Currency Auto-Conversion
 */

const CurrencyService = (function() {
  'use strict';

  const CACHE_KEY = 'subtracker-exchange-rates';
  const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  const API_URL = 'https://open.er-api.com/v6/latest/';

  let _rates = {};
  let _baseCurrency = 'USD';
  let _lastUpdated = null;

  /**
   * Initialize — load cached rates or fetch fresh
   */
  async function init() {
    var cached = _loadFromCache();
    if (cached) {
      _rates = cached.rates;
      _baseCurrency = cached.base;
      _lastUpdated = new Date(cached.timestamp);
    }

    // Fetch fresh if cache is stale or empty
    if (!cached || (Date.now() - cached.timestamp > CACHE_TTL)) {
      try {
        await fetchRates('USD');
      } catch (e) {
        console.warn('Currency rates fetch failed:', e);
      }
    }
  }

  /**
   * Fetch exchange rates from API
   * @param {string} base - Base currency code
   */
  async function fetchRates(base) {
    try {
      var response = await fetch(API_URL + (base || 'USD'));
      if (!response.ok) throw new Error('API error');
      var data = await response.json();

      if (data.result === 'success' && data.rates) {
        _rates = data.rates;
        _baseCurrency = data.base_code || base;
        _lastUpdated = new Date();
        _saveToCache();
      }
    } catch (e) {
      console.warn('Currency API error:', e);
    }
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount
   * @param {string} from - Source currency code
   * @param {string} to - Target currency code
   * @returns {number} Converted amount
   */
  function convert(amount, from, to) {
    if (!amount || from === to) return amount;
    if (!_rates[from] || !_rates[to]) return amount;

    // Convert via USD base
    var inBase = amount / _rates[from];
    return Math.round(inBase * _rates[to] * 100) / 100;
  }

  /**
   * Get current rates
   */
  function getRates() {
    return _rates;
  }

  /**
   * Get last update timestamp
   */
  function getLastUpdated() {
    return _lastUpdated;
  }

  /**
   * Check if rates are available
   */
  function hasRates() {
    return Object.keys(_rates).length > 0;
  }

  // =============================================
  // PRIVATE
  // =============================================

  function _loadFromCache() {
    try {
      var data = localStorage.getItem(CACHE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  function _saveToCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: _rates,
        base: _baseCurrency,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache save failed:', e);
    }
  }

  return {
    init: init,
    fetchRates: fetchRates,
    convert: convert,
    getRates: getRates,
    getLastUpdated: getLastUpdated,
    hasRates: hasRates
  };
})();
