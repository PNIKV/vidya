/**
 * VIDYA STEM – Tinkering Lab Inventory System
 * Telegram Bot Integration  |  js/telegram.js
 *
 * Config is stored in localStorage under key: tl_telegram_config
 * Admin can set BOT_TOKEN and CHAT_ID from Settings panel.
 */

const tg = {

  _storageKey: 'tl_telegram_config',

  /** Return saved config object { botToken, chatId } */
  getConfig: function () {
    try {
      const raw = localStorage.getItem(this._storageKey);
      return raw ? JSON.parse(raw) : { botToken: '', chatId: '' };
    } catch {
      return { botToken: '', chatId: '' };
    }
  },

  /** Save config to localStorage */
  saveConfig: function (botToken, chatId) {
    localStorage.setItem(this._storageKey, JSON.stringify({ botToken: botToken.trim(), chatId: chatId.trim() }));
  },

  /** Returns true only if both token and chat ID are non-empty */
  isConfigured: function () {
    const cfg = this.getConfig();
    return !!(cfg.botToken && cfg.chatId);
  },

  /**
   * Send a plain-text / HTML message via Telegram Bot API
   * @param {string} message  – HTML-formatted message body
   * @returns {Promise<boolean>} – true on success
   */
  sendMessage: async function (message) {
    if (!this.isConfigured()) {
      console.warn('[Telegram] Not configured – skipping send.');
      return false;
    }
    const { botToken, chatId } = this.getConfig();
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      const resp = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text:       message,
          parse_mode: 'HTML'
        })
      });
      const data = await resp.json();
      if (!data.ok) {
        console.error('[Telegram] API error:', data.description);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[Telegram] Network error:', err);
      return false;
    }
  }

};
