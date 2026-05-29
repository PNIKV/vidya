/**
 * VIDYA STEM – Tinkering Lab Inventory System
 * Main Application Controller  |  js/app.js
 *
 * Views (sections):
 *   #login-view          → Login screen
 *   #dashboard-view      → Role-filtered lab list + admin controls
 *   #entry-selection-view → Bulk vs Individual entry picker
 *   #bulk-audit-view     → Table-based bulk audit
 *   #indiv-audit-view    → Card-by-card individual audit
 *   #sop-view            → SOP reference (admin only)
 *   #history-view        → Audit history with download options (admin only)
 *   #settings-view       → Telegram config (admin only)
 */

const app = {

  /* ── State ───────────────────────────── */
  currentUser:   null,
  currentLabId:  null,
  currentLab:    null,   // full lab object from LABS_DATA
  auditData:     {},     // { itemId: status } for individual audit
  entryType:     null,   // 'Bulk' | 'Individual'

  /* ── Helpers ─────────────────────────── */
  _labById: function (id) {
    return LABS_DATA.labs.find(l => l.id === id) || null;
  },

  _labsForRole: function (role) {
    return LABS_DATA.labs.filter(l => l.accessRoles.includes(role));
  },

  _loadHistory: function () {
    try {
      return JSON.parse(localStorage.getItem(LABS_DATA.config.storageKey) || '[]');
    } catch { return []; }
  },

  _saveHistory: function (history) {
    localStorage.setItem(LABS_DATA.config.storageKey, JSON.stringify(history));
  },

  _pushRecord: function (record) {
    const h = this._loadHistory();
    h.unshift(record);
    this._saveHistory(h);
  },

  /** Graceful image with placeholder fallback */
  _imgTag: function (src, cls, alt) {
    return `<img src="${src}" class="${cls}" alt="${alt}"
               onerror="this.outerHTML='<div class=\\'img-ph\\'><i class=\\'fa-solid fa-box-open\\'></i></div>'">`; 
  },

  /* ── Init ────────────────────────────── */
  init: function () {
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      this.login();
    });
    document.getElementById('logout-btn').addEventListener('click', () => this.logout());

    // Restore Telegram settings UI
    const cfg = tg.getConfig();
    document.getElementById('tg-token').value   = cfg.botToken || '';
    document.getElementById('tg-chat').value    = cfg.chatId  || '';
  },

  /* ── Auth ────────────────────────────── */
  login: function () {
    const uname = document.getElementById('username').value.trim().toLowerCase();
    const pwd   = document.getElementById('password').value.trim();

    const user = LABS_DATA.users.find(u => u.username === uname && u.password === pwd);
    if (!user) {
      this._shake('login-form');
      document.getElementById('login-error').textContent = 'Invalid username or password.';
      document.getElementById('login-error').style.display = 'block';
      return;
    }
    document.getElementById('login-error').style.display = 'none';
    this.currentUser = user;
    this.showDashboard();
  },

  logout: function () {
    this.currentUser  = null;
    this.currentLabId = null;
    this.currentLab   = null;
    this.auditData    = {};
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    this.switchView('login-view');
  },

  /* ── Dashboard ───────────────────────── */
  showDashboard: function () {
    const u = this.currentUser;
    document.getElementById('greeting').textContent   = `Hello, ${u.displayName}`;
    document.getElementById('role-badge').textContent = u.role.toUpperCase();
    document.getElementById('role-badge').className   = `badge badge-${u.role}`;

    // Admin-only controls row
    const adminRow = document.getElementById('admin-controls');
    adminRow.style.display = u.role === 'admin' ? 'block' : 'none';

    // Render lab cards filtered by role
    const labs = this._labsForRole(u.role);
    const grid = document.getElementById('lab-cards-grid');
    grid.innerHTML = '';

    labs.forEach(lab => {
      const card = document.createElement('div');
      card.className = 'list-card';
      card.setAttribute('data-lab', lab.id);
      card.innerHTML = `
        <div class="lcard-img-wrap" style="border-color:${lab.color}22">
          ${this._imgTag(lab.categoryImg, 'lcard-img', lab.name)}
          <div class="lcard-icon-badge" style="background:${lab.color}22; color:${lab.color}">
            <i class="fa-solid ${lab.icon}"></i>
          </div>
        </div>
        <div class="lcard-info">
          <h4>${lab.shortName}</h4>
          <p>${lab.description}</p>
          <span class="item-count">${lab.items.length} items</span>
        </div>
      `;
      card.addEventListener('click', () => this.showEntrySelection(lab.id));
      grid.appendChild(card);
    });

    this.switchView('dashboard-view');
  },

  /* ── Entry Selection ─────────────────── */
  showEntrySelection: function (labId) {
    this.currentLabId = labId;
    this.currentLab   = this._labById(labId);
    document.getElementById('entry-lab-name').textContent = this.currentLab.name;
    this.switchView('entry-selection-view');
  },

  /* ── Bulk Audit ──────────────────────── */
  startBulkAudit: function () {
    this.entryType = 'Bulk';
    const lab = this.currentLab;
    document.getElementById('bulk-audit-title').textContent = `Bulk Audit – ${lab.shortName}`;

    const tbody = document.getElementById('bulk-table-body');
    tbody.innerHTML = '';
    lab.items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="bulk-item-cell">
            ${this._imgTag(item.img, 'bulk-thumb', item.name)}
            <div>
              <span class="bulk-item-name">${item.name}</span>
              <span class="bulk-cat-badge">${item.category}</span>
            </div>
          </div>
          <div class="bulk-exp">Expected: <strong>${item.quantity}</strong></div>
        </td>
        <td><input type="number" id="qty-${item.id}"    value="${item.quantity}" min="0" class="bulk-input"></td>
        <td><input type="number" id="broken-${item.id}" value="0"               min="0" class="bulk-input brk-input"></td>
        <td><input type="number" id="miss-${item.id}"   value="0"               min="0" class="bulk-input miss-input"></td>
      `;
      tbody.appendChild(tr);
    });

    this.switchView('bulk-audit-view');
  },

  submitBulkAudit: async function () {
    const lab   = this.currentLab;
    const items = lab.items;
    let   well  = 0, broken = 0, missing = 0;
    const details = [];

    items.forEach(item => {
      const present = parseInt(document.getElementById(`qty-${item.id}`).value)    || 0;
      const brk     = parseInt(document.getElementById(`broken-${item.id}`).value) || 0;
      const miss    = parseInt(document.getElementById(`miss-${item.id}`).value)   || 0;
      well   += present;
      broken += brk;
      missing += miss;
      details.push({ item: item.name, category: item.category, expected: item.quantity, present, broken: brk, missing: miss });
    });

    const rec = this._buildRecord({ well, broken, missing }, details);
    this._pushRecord(rec);
    await this._sendTelegramMsg(rec, lab);
    exporter.showModal(rec, lab);
  },

  /* ── Individual Audit ────────────────── */
  startIndividualAudit: function () {
    this.entryType = 'Individual';
    this.auditData = {};
    const lab   = this.currentLab;
    const items = lab.items;

    document.getElementById('indiv-audit-title').textContent = lab.shortName;
    document.getElementById('audit-total').textContent       = items.length;
    this._updateIndivProgress();

    const container = document.getElementById('indiv-audit-container');
    container.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'audit-item';
      card.id        = `acard-${item.id}`;
      card.innerHTML = `
        <div class="item-header">
          ${this._imgTag(item.img, 'item-img', item.name)}
          <div class="item-meta">
            <h4>${item.name}</h4>
            <span class="bulk-cat-badge">${item.category}</span>
            <p>Expected: <strong>${item.quantity}</strong></p>
          </div>
        </div>
        <div class="status-options" id="opts-${item.id}">
          <button class="status-btn status-well"    onclick="app.setStatus('${item.id}','Well Present')">Well Present <i class="fa-solid fa-circle-check"></i></button>
          <button class="status-btn status-broken"  onclick="app.setStatus('${item.id}','Broken')">Broken <i class="fa-solid fa-circle-exclamation"></i></button>
          <button class="status-btn status-missing" onclick="app.setStatus('${item.id}','Missing')">Missing <i class="fa-solid fa-circle-xmark"></i></button>
        </div>
      `;
      container.appendChild(card);
    });

    this.switchView('indiv-audit-view');
  },

  setStatus: function (itemId, status) {
    this.auditData[itemId] = status;

    const opts = document.getElementById(`opts-${itemId}`);
    opts.querySelectorAll('.status-btn').forEach(b => b.classList.remove('selected'));
    const clicked = Array.from(opts.querySelectorAll('.status-btn')).find(b => b.textContent.trim().startsWith(status.split(' ')[0]));
    if (clicked) clicked.classList.add('selected');

    // Scroll to next un-answered card
    const items   = this.currentLab.items;
    const current = items.findIndex(i => i.id === itemId);
    if (current < items.length - 1) {
      const next = items[current + 1];
      if (!this.auditData[next.id]) {
        const nextCard = document.getElementById(`acard-${next.id}`);
        if (nextCard) nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    this._updateIndivProgress();
  },

  _updateIndivProgress: function () {
    const total     = this.currentLab.items.length;
    const completed = Object.keys(this.auditData).length;
    document.getElementById('audit-progress').textContent = completed;

    const btn = document.getElementById('submit-indiv-btn');
    btn.disabled = completed < total;
    if (!btn.disabled) btn.classList.add('ready');
    else               btn.classList.remove('ready');
  },

  submitIndividualAudit: async function () {
    const lab   = this.currentLab;
    const items = lab.items;
    let   well  = 0, broken = 0, missing = 0;
    const details = [];

    items.forEach(item => {
      const status = this.auditData[item.id] || 'Well Present';
      if (status === 'Well Present') well++;
      else if (status === 'Broken')  broken++;
      else                           missing++;
      details.push({ item: item.name, category: item.category, expected: item.quantity, status });
    });

    const rec = this._buildRecord({ well, broken, missing }, details);
    this._pushRecord(rec);
    await this._sendTelegramMsg(rec, lab);
    exporter.showModal(rec, lab);
  },

  /* ── Record Builder ──────────────────── */
  _buildRecord: function (summary, details) {
    return {
      id:        'rec-' + Date.now(),
      date:      new Date().toLocaleString(),
      user:      this.currentUser.username,
      labId:     this.currentLabId,
      labName:   this.currentLab.name,
      entryType: this.entryType,
      summary,
      details
    };
  },

  /* ── Telegram ────────────────────────── */
  _sendTelegramMsg: async function (rec, lab) {
    const issueLines = rec.details
      .filter(d => {
        if (rec.entryType === 'Individual') return d.status !== 'Well Present';
        return d.broken > 0 || d.missing > 0;
      })
      .map(d => rec.entryType === 'Individual'
        ? `\n  • <b>${d.item}</b>: ${d.status}`
        : `\n  • <b>${d.item}</b>: B=${d.broken} M=${d.missing}`)
      .join('');

    const msg = `
📦 <b>Inventory Audit – ${LABS_DATA.config.orgName}</b>
👤 <b>By:</b> ${rec.user}
📋 <b>Lab:</b> ${lab.name}
📝 <b>Type:</b> ${rec.entryType}
🕒 <b>Time:</b> ${rec.date}

📊 <b>Summary</b>
✅ Well Present: ${rec.summary.well}
⚠️ Broken: ${rec.summary.broken}
❌ Missing: ${rec.summary.missing}
${issueLines.length ? '\n🚨 <b>Issues:</b>' + issueLines : '\n✨ All items accounted for!'}
    `.trim();

    if (tg.isConfigured()) {
      await tg.sendMessage(msg);
    } else {
      console.log('[App] Telegram not configured. Audit record:', rec);
    }
  },

  /* ── SOP View ────────────────────────── */
  showSOP: function () {
    this.switchView('sop-view');
  },

  /* ── Audit History ───────────────────── */
  showHistory: function () {
    const history   = this._loadHistory();
    const container = document.getElementById('history-users-list');
    container.innerHTML = '';

    const usersWithAudits = LABS_DATA.users.map(u => {
      const audits = history.filter(a => a.user === u.username);
      return { ...u, audits, count: audits.length };
    });

    usersWithAudits.forEach(u => {
      const card = document.createElement('div');
      card.className = 'history-user-card glass-card';
      card.innerHTML = `
        <div class="hu-info">
          <div class="hu-avatar" style="background:${u.role === 'admin' ? '#3b82f620' : '#fbbf2420'}; color:${u.role === 'admin' ? '#60a5fa' : '#fbbf24'}">
            <i class="fa-solid fa-${u.role === 'admin' ? 'user-shield' : 'chalkboard-user'}"></i>
          </div>
          <div>
            <strong>${u.displayName}</strong>
            <p>${u.count} audit${u.count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div class="hu-actions">
          <button class="dl-btn dl-excel" onclick="app._historyDownload('${u.username}','excel')" title="Download Excel">
            <i class="fa-solid fa-file-csv"></i> Excel
          </button>
          <button class="dl-btn dl-image" onclick="app._historyDownload('${u.username}','image')" title="Download Image">
            <i class="fa-solid fa-image"></i> Image
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    this.switchView('history-view');
  },

  _historyDownload: function (username, format) {
    const history = this._loadHistory().filter(a => a.user === username);
    if (format === 'excel') {
      exporter.historyToExcel(username, history);
    } else {
      exporter.historyToImage(username, history);
    }
  },

  /* ── Settings ────────────────────────── */
  showSettings: function () {
    const cfg = tg.getConfig();
    document.getElementById('tg-token').value = cfg.botToken || '';
    document.getElementById('tg-chat').value  = cfg.chatId  || '';
    this.switchView('settings-view');
  },

  saveSettings: function () {
    const token = document.getElementById('tg-token').value.trim();
    const chat  = document.getElementById('tg-chat').value.trim();
    tg.saveConfig(token, chat);

    const statusEl = document.getElementById('settings-status');
    statusEl.textContent = '✓ Settings saved';
    statusEl.style.color = '#10b981';
    setTimeout(() => { statusEl.textContent = ''; }, 2500);
  },

  testTelegram: async function () {
    const btn = document.getElementById('tg-test-btn');
    btn.textContent = 'Sending…';
    btn.disabled    = true;
    const ok = await tg.sendMessage(`🔔 <b>Test Message</b>\nTelegram is connected to <b>${LABS_DATA.config.orgName}</b> Inventory System.`);
    const statusEl = document.getElementById('settings-status');
    if (ok) {
      statusEl.textContent = '✓ Message sent successfully!';
      statusEl.style.color = '#10b981';
    } else {
      statusEl.textContent = '✗ Failed – check your Bot Token & Chat ID.';
      statusEl.style.color = '#ef4444';
    }
    btn.textContent = 'Send Test Message';
    btn.disabled    = false;
    setTimeout(() => { statusEl.textContent = ''; }, 4000);
  },

  /* ── View Switcher ───────────────────── */
  switchView: function (viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    // Scroll to top of new view
    const el = document.getElementById(viewId);
    if (el) el.scrollTop = 0;
  },

  /* ── Micro-animation helper ──────────── */
  _shake: function (elId) {
    const el = document.getElementById(elId);
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  }

};

/* ── Bootstrap ───────────────────────────── */
document.addEventListener('DOMContentLoaded', () => app.init());
