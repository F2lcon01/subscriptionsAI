/**
 * SubTracker — AI Companion (BYOK)
 * Bring Your Own Key AI chat for subscription advice
 * PRD Section 6.7: AI Companion
 */

const AICompanion = (function() {
  'use strict';

  let _provider = null;
  let _apiKey = null;
  let _chatHistory = [];
  let _isOpen = false;

  const PROVIDERS = {
    openai: {
      name: 'OpenAI (GPT)',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      buildRequest: function(messages) {
        return {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + _apiKey },
          body: JSON.stringify({ model: PROVIDERS.openai.model, messages: messages, max_tokens: 1000 })
        };
      },
      extractResponse: function(data) { return data.choices[0].message.content; }
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      buildRequest: function(messages) {
        var contents = messages.map(function(m) {
          return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
        });
        return {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: contents })
        };
      },
      extractResponse: function(data) { return data.candidates[0].content.parts[0].text; }
    }
  };

  async function init() {
    var user = auth.currentUser;
    if (!user) return;

    var doc = await db.collection('users').doc(user.uid).get();
    if (doc.exists && doc.data().ai) {
      _provider = doc.data().ai.provider || null;
      if (doc.data().ai.apiKeyEncrypted && CryptoService.isVerified()) {
        try {
          var masterPwd = await CryptoService.getMasterPassword();
          if (masterPwd) {
            _apiKey = await CryptoService.decrypt(doc.data().ai.apiKeyEncrypted, masterPwd);
          }
        } catch (e) { _apiKey = null; }
      }
    }
  }

  async function setProvider(provider, apiKey) {
    _provider = provider;
    _apiKey = apiKey;

    var user = auth.currentUser;
    if (!user) return;

    var encrypted = null;
    var masterPwd = await CryptoService.getMasterPassword();
    if (masterPwd) {
      encrypted = await CryptoService.encrypt(apiKey, masterPwd);
    }

    await db.collection('users').doc(user.uid).update({
      'ai.provider': provider,
      'ai.apiKeyEncrypted': encrypted
    });
  }

  async function chat(userMessage) {
    if (!_provider || !_apiKey) throw new Error('AI not configured');

    var providerConfig = PROVIDERS[_provider];
    if (!providerConfig) throw new Error('Unknown provider');

    // Build context
    var context = _buildContext();
    if (_chatHistory.length === 0) {
      _chatHistory.push({ role: 'user', content: context });
      _chatHistory.push({ role: 'assistant', content: I18n.t('ai.context_loaded') });
    }

    _chatHistory.push({ role: 'user', content: userMessage });

    var url = providerConfig.endpoint;
    if (_provider === 'gemini') url += '?key=' + _apiKey;

    var response = await fetch(url, providerConfig.buildRequest(_chatHistory));
    if (!response.ok) {
      var err = await response.text();
      throw new Error('API Error: ' + response.status);
    }

    var data = await response.json();
    var reply = providerConfig.extractResponse(data);
    _chatHistory.push({ role: 'assistant', content: reply });

    return reply;
  }

  function _buildContext() {
    var subs = SubscriptionService.getAll();
    var stats = SubscriptionService.getStats();
    var insights = InsightsEngine.analyze();

    var context = 'You are a subscription management assistant for SubTracker app. ' +
      'Here is the user\'s subscription data:\n\n' +
      'Total subscriptions: ' + subs.length + '\n' +
      'Monthly total: ' + stats.monthlyTotal.toFixed(2) + ' ' + stats.currency + '\n' +
      'Yearly total: ' + stats.yearlyTotal.toFixed(2) + ' ' + stats.currency + '\n' +
      'Daily cost: ' + insights.costPerDay.toFixed(2) + ' ' + stats.currency + '\n\n' +
      'Subscriptions:\n';

    subs.forEach(function(sub) {
      context += '- ' + sub.name + ': ' + (sub.yourShare || sub.amount) + ' ' + (sub.currency || 'SAR') +
        ' (' + sub.billingCycle + ', ' + sub.status + ', ' + (sub.category || 'other') + ')\n';
    });

    context += '\nProvide helpful, concise advice about managing subscriptions. ' +
      'Suggest savings, warn about overspending, and help optimize costs. ' +
      'Respond in the same language the user writes in.';

    return context;
  }

  function renderChatWidget() {
    if (document.getElementById('ai-chat-widget')) return;

    var widget = document.createElement('div');
    widget.id = 'ai-chat-widget';
    widget.innerHTML = '' +
      '<button class="ai-fab" id="ai-fab" title="' + I18n.t('ai.title') + '">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
      '</button>' +
      '<div class="ai-panel" id="ai-panel" hidden>' +
        '<div class="ai-panel__header">' +
          '<h3>' + I18n.t('ai.title') + '</h3>' +
          '<button class="ai-panel__close" id="ai-panel-close">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div class="ai-panel__messages" id="ai-messages">' +
          (_provider
            ? '<div class="ai-msg ai-msg--bot">' + I18n.t('ai.welcome') + '</div>'
            : '<div class="ai-msg ai-msg--bot">' + I18n.t('ai.setup_needed') + '</div>') +
        '</div>' +
        '<div class="ai-panel__input">' +
          '<input type="text" class="input" id="ai-input" placeholder="' + I18n.t('ai.placeholder') + '">' +
          '<button class="btn btn--primary btn--icon" id="ai-send">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);

    // FAB toggle
    document.getElementById('ai-fab').addEventListener('click', function() {
      var panel = document.getElementById('ai-panel');
      _isOpen = !_isOpen;
      panel.hidden = !_isOpen;
    });

    document.getElementById('ai-panel-close').addEventListener('click', function() {
      _isOpen = false;
      document.getElementById('ai-panel').hidden = true;
    });

    // Send message
    var input = document.getElementById('ai-input');
    var sendBtn = document.getElementById('ai-send');

    function sendMessage() {
      var msg = input.value.trim();
      if (!msg) return;
      if (!_provider || !_apiKey) {
        Toast.warning(I18n.t('ai.setup_needed'));
        return;
      }

      _appendMessage('user', msg);
      input.value = '';

      _appendMessage('bot', '<span class="ai-typing">' + I18n.t('ai.thinking') + '</span>');

      chat(msg).then(function(reply) {
        var messages = document.getElementById('ai-messages');
        var lastMsg = messages.lastElementChild;
        if (lastMsg && lastMsg.querySelector('.ai-typing')) lastMsg.remove();
        _appendMessage('bot', reply);
      }).catch(function(err) {
        var messages = document.getElementById('ai-messages');
        var lastMsg = messages.lastElementChild;
        if (lastMsg && lastMsg.querySelector('.ai-typing')) lastMsg.remove();
        _appendMessage('bot', I18n.t('ai.error') + ': ' + err.message);
      });
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function _appendMessage(type, content) {
    var messages = document.getElementById('ai-messages');
    if (!messages) return;
    var div = document.createElement('div');
    div.className = 'ai-msg ai-msg--' + type;
    div.innerHTML = content;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function clearHistory() {
    _chatHistory = [];
  }

  function isConfigured() {
    return !!_provider && !!_apiKey;
  }

  return {
    init: init,
    setProvider: setProvider,
    chat: chat,
    renderChatWidget: renderChatWidget,
    clearHistory: clearHistory,
    isConfigured: isConfigured,
    PROVIDERS: PROVIDERS
  };
})();
