// ============================================================
// STEM Quest – Beginner Game Engine
// ============================================================

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────
  const S = {
    questions: [],
    idx: 0,
    score: 0,
    maxScore: 0,
    answers: [],
    currentAnswer: null,
    answerLocked: false,
    studentData: {},
    matchState: {},   // leftIdx -> originalRightIdx
    fillState: [],    // filled words per blank
    pictoSeq: [],     // placed block ids
    teacherMode: false,
    isMusicOn: false
  };

  // ─── Shuffle ──────────────────────────────────────────────
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── DOM refs ─────────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const views = {
    landing:  $('view-landing'),
    register: $('view-register'),
    game:     $('view-game'),
    results:  $('view-results'),
    teacher:  $('view-teacher')
  };

  function showView(key) {
    Object.values(views).forEach(v => { if (v) { v.classList.remove('active'); } });
    if (views[key]) views[key].classList.add('active');
  }

  // ─── Audio ────────────────────────────────────────────────
  const bgm     = $('bgm');
  const sfxOK   = $('sfx-ok');
  const sfxBad  = $('sfx-bad');
  const sfxClick= $('sfx-click');

  function playOK()   { try { sfxOK.currentTime=0;    sfxOK.play(); }    catch(e){} }
  function playBad()  { try { sfxBad.currentTime=0;   sfxBad.play(); }   catch(e){} }
  function playClick(){ try { sfxClick.currentTime=0; sfxClick.play(); } catch(e){} }

  $('btn-music').addEventListener('click', () => {
    S.isMusicOn ? bgm.pause() : bgm.play().catch(()=>{});
    S.isMusicOn = !S.isMusicOn;
    $('btn-music').textContent = S.isMusicOn ? '🔊' : '🎵';
  });

  // ─── Canvas Background ────────────────────────────────────
  function initBackground() {
    const canvas = $('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, offset = 0;

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const GRID = 55;
    // Pre-generate some random "component" positions
    const components = Array.from({ length: 18 }, () => ({
      x: Math.random(), y: Math.random(),
      type: Math.floor(Math.random() * 4)
    }));

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);
      // Deep dark bg gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#080818');
      grad.addColorStop(1, '#0d0a22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const ox = offset % GRID;
      const oy = (offset * 0.4) % GRID;

      // Circuit traces
      ctx.strokeStyle = 'rgba(100,80,220,0.08)';
      ctx.lineWidth = 1;
      for (let x = -ox; x < w + GRID; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = -oy; y < h + GRID; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // Nodes at intersections
      ctx.fillStyle = 'rgba(120,100,255,0.18)';
      for (let x = -ox; x < w + GRID; x += GRID) {
        for (let y = -oy; y < h + GRID; y += GRID) {
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
        }
      }

      // "Electronic component" icons on grid
      components.forEach(c => {
        const cx = (c.x * w - ox * 0.5) % w;
        const cy = (c.y * h - oy * 0.3) % h;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.globalAlpha = 0.06;
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1.5;
        if (c.type === 0) { // Resistor zig-zag
          ctx.beginPath();
          ctx.moveTo(-15, 0);
          [-10,-5,0,5,10].forEach((xi, i) => ctx.lineTo(xi, i%2===0?-6:6));
          ctx.lineTo(15, 0); ctx.stroke();
        } else if (c.type === 1) { // Capacitor
          ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(-8,8); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(8,-8);  ctx.lineTo(8,8);  ctx.stroke();
        } else if (c.type === 2) { // Triangle (diode)
          ctx.beginPath(); ctx.moveTo(-8,8); ctx.lineTo(8,0); ctx.lineTo(-8,-8); ctx.closePath(); ctx.stroke();
        } else { // LED circle
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
        }
        ctx.restore();
      });

      // Flowing data "bits"
      const t = Date.now() * 0.001;
      for (let x = -ox; x < w + GRID; x += GRID*2) {
        const py = ((t * 60 + x * 3.7) % (h + 20)) - 10;
        ctx.fillStyle = 'rgba(6,182,212,0.35)';
        ctx.beginPath(); ctx.arc(x, py, 3, 0, Math.PI*2); ctx.fill();
      }

      offset += 0.35;
      requestAnimationFrame(drawFrame);
    }
    drawFrame();
  }

  // ─── Rocket periodic launch ───────────────────────────────
  function scheduleLaunch() {
    const r = $('sprite-rocket');
    if (!r) return;
    const delay = 9000 + Math.random() * 12000;
    setTimeout(() => {
      r.style.left = (8 + Math.random() * 70) + 'vw';
      const inner = r.querySelector('.rocket-inner');
      inner.closest('#sprite-rocket').classList.remove('rocket-lit');
      void r.offsetWidth; // reflow
      inner.closest('#sprite-rocket').classList.add('rocket-lit');
      scheduleLaunch();
    }, delay);
  }

  // ─── Particles ────────────────────────────────────────────
  function spawnParticles() {
    const colors = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444'];
    setInterval(() => {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `
        left:${Math.random()*100}vw;
        bottom:0;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        width:${2+Math.random()*4}px;
        height:${2+Math.random()*4}px;
        opacity:${0.3+Math.random()*0.4};
        animation-duration:${8+Math.random()*14}s;
        animation-delay:0s;
      `;
      document.getElementById('bg-sprites').appendChild(p);
      setTimeout(() => p.remove(), 22000);
    }, 1200);
  }

  // ─── Navigation ───────────────────────────────────────────
  $('btn-play').addEventListener('click', () => { playClick(); showView('register'); });
  $('btn-teacher-mode').addEventListener('click', () => { playClick(); showTeacherLogin(); });
  $('btn-back-reg').addEventListener('click', () => { playClick(); showView('landing'); });

  $('form-register').addEventListener('submit', e => {
    e.preventDefault();
    S.studentData = {
      name:   $('inp-name').value.trim(),
      grade:  $('inp-grade').value.trim(),
      school: $('inp-school').value.trim()
    };
    startGame();
  });

  // ─── Start Game ───────────────────────────────────────────
  function startGame() {
    // Shuffle all questions
    S.questions = shuffle(BEGINNER_QUESTIONS);
    S.maxScore = S.questions.reduce((s, q) => s + (q.marks || 1), 0);
    S.idx = 0;
    S.score = 0;
    S.answers = [];
    updateXP();
    showView('game');
    bgm.volume = 0.18;
    if (!S.isMusicOn) { bgm.play().catch(()=>{}); S.isMusicOn = true; $('btn-music').textContent = '🔊'; }
    loadQuestion();
  }

  // ─── Load Question ────────────────────────────────────────
  function loadQuestion() {
    const q = S.questions[S.idx];
    S.currentAnswer = null;
    S.answerLocked = false;
    S.matchState = {};
    S.fillState = [];
    S.pictoSeq = [];

    // Header counters
    $('q-counter').textContent = `Quest ${S.idx + 1} / ${S.questions.length}`;
    $('score-live').textContent = S.score;

    // Type badge
    const badgeEl = $('q-type-badge');
    const typeLabels = {
      mcq: '⚡ Multiple Choice', true_false: '👍 True or False',
      match: '🔗 Match It!', fill_bank: '✏️ Fill the Blank',
      calc: '🔢 Calculate!', picto: '🧩 Block Code',
      arduino_ide: '💻 Arduino IDE', ai_question: '🤖 AI Challenge'
    };
    badgeEl.textContent = typeLabels[q.type] || q.type;
    badgeEl.className = `q-type-badge badge-${q.type}`;

    // Question text
    $('q-text').textContent = q.text;
    $('q-tagline').textContent = q.tagline || '';

    // Optional image
    const imgWrap = $('q-img-wrap');
    if (q.image && q.type !== 'fill_bank') {
      imgWrap.innerHTML = `<img src="${q.image}" alt="Question image" loading="lazy">`;
      imgWrap.classList.remove('hidden');
    } else {
      imgWrap.innerHTML = '';
      imgWrap.classList.add('hidden');
    }

    // Render interaction area
    const area = $('interaction-area');
    area.innerHTML = '';
    switch (q.type) {
      case 'mcq':          renderMCQ(q, area); break;
      case 'true_false':   renderTrueFalse(q, area); break;
      case 'match':        renderMatch(q, area); break;
      case 'fill_bank':    renderFillBank(q, area); break;
      case 'calc':         renderCalc(q, area); break;
      case 'picto':        renderPicto(q, area); break;
      case 'arduino_ide':  renderArduinoIDE(q, area); break;
      case 'ai_question':  renderAI(q, area); break;
    }

    // Nav buttons
    const nextBtn = $('btn-next');
    const skipBtn = $('btn-skip');
    nextBtn.disabled = true;
    nextBtn.textContent = S.idx === S.questions.length - 1 ? '🏁 Finish Quest' : 'Next ➜';
    skipBtn.classList.remove('hidden');

    updateXP();
  }

  function enableNext() {
    $('btn-next').disabled = false;
  }

  // ─── XP Bar ───────────────────────────────────────────────
  function updateXP() {
    const pct = S.questions.length > 0 ? (S.idx / S.questions.length) * 100 : 0;
    $('xp-fill').style.width = pct + '%';
    $('xp-label').textContent = `XP ${S.idx}/${S.questions.length}`;
    $('score-display').textContent = S.score;
  }

  // ─── MCQ Renderer ────────────────────────────────────────
  function renderMCQ(q, area) {
    const letters = ['A', 'B', 'C', 'D'];
    if (q.variant === 'image') {
      const grid = document.createElement('div');
      grid.className = 'mcq-img-grid';
      q.options.forEach((opt, i) => {
        const el = document.createElement('div');
        el.className = 'mcq-img-opt';
        el.innerHTML = `<img src="${opt.img}" alt="${opt.label}" loading="lazy">
          <div class="opt-label">${letters[i]}. ${opt.label}</div>`;
        el.onclick = () => selectMCQ(grid, el, i);
        grid.appendChild(el);
      });
      area.appendChild(grid);
    } else if (q.variant === 'emoji') {
      const grid = document.createElement('div');
      grid.className = 'mcq-emoji-grid';
      q.options.forEach((opt, i) => {
        const el = document.createElement('div');
        el.className = 'mcq-emoji-opt';
        el.innerHTML = `<div class="opt-emoji">${opt.emoji}</div><div class="opt-text">${letters[i]}. ${opt.text}</div>`;
        el.onclick = () => selectMCQ(grid, el, i);
        grid.appendChild(el);
      });
      area.appendChild(grid);
    } else {
      // card (default)
      const grid = document.createElement('div');
      grid.className = 'mcq-grid';
      q.options.forEach((opt, i) => {
        const el = document.createElement('div');
        el.className = 'mcq-opt';
        el.innerHTML = `<div class="opt-letter">${letters[i]}</div><span>${opt}</span>`;
        el.onclick = () => selectMCQ(grid, el, i);
        grid.appendChild(el);
      });
      area.appendChild(grid);
    }
  }

  function selectMCQ(grid, el, idx) {
    if (S.answerLocked) return;
    playClick();
    // Only deselect clickable option elements (not container divs)
    grid.querySelectorAll('.mcq-opt, .mcq-img-opt, .mcq-emoji-opt').forEach(b => b.classList.remove('selected'));
    el.classList.add('selected');
    S.currentAnswer = idx;
    enableNext();
  }

  // ─── True/False Renderer ──────────────────────────────────
  function renderTrueFalse(q, area) {
    const container = document.createElement('div');
    container.className = 'tf-container';
    container.innerHTML = `
      <button class="tf-btn tf-true" id="tf-yes">
        <div class="tf-icon">👍</div>
        <div class="tf-label">TRUE</div>
      </button>
      <button class="tf-btn tf-false" id="tf-no">
        <div class="tf-icon">👎</div>
        <div class="tf-label">FALSE</div>
      </button>`;
    const fact = document.createElement('div');
    fact.className = 'tf-fun-fact';
    fact.id = 'tf-fact';
    fact.textContent = q.funFact || '';
    container.appendChild(fact);

    container.querySelector('#tf-yes').onclick = () => selectTF(container, true);
    container.querySelector('#tf-no').onclick  = () => selectTF(container, false);
    area.appendChild(container);
  }

  function selectTF(container, val) {
    if (S.answerLocked) return;
    playClick();
    container.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('selected'));
    container.querySelector(val ? '#tf-yes' : '#tf-no').classList.add('selected');
    S.currentAnswer = val;
    // Show fun fact after selection
    const fact = $('tf-fact');
    if (fact) fact.classList.add('visible');
    enableNext();
  }

  // ─── Match Renderer ───────────────────────────────────────
  function renderMatch(q, area) {
    const wrapper = document.createElement('div');
    wrapper.className = 'match-area';
    // Build SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'match-connector');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';

    const cols = document.createElement('div');
    cols.className = 'match-cols';
    cols.style.position = 'relative';

    // Shuffle right items (keep track of original index)
    const rightItems = shuffle(q.pairs.map((p, i) => ({ text: p.right, origIdx: i })));

    const leftCol  = document.createElement('div');
    leftCol.className = 'match-col';
    leftCol.innerHTML = `<div class="match-col-label">Match From 👇</div>`;
    const rightCol = document.createElement('div');
    rightCol.className = 'match-col';
    rightCol.innerHTML = `<div class="match-col-label">Connect To 👇</div>`;

    let selectedRight = null; // { el, origIdx }
    const leftEls  = [];
    const rightEls = [];

    // Build left column
    q.pairs.forEach((pair, li) => {
      const el = document.createElement('div');
      el.className = 'match-item match-left drop-zone';
      el.textContent = pair.left;
      el.dataset.li = li;
      el.addEventListener('click', () => {
        if (el.classList.contains('matched')) return;
        if (!selectedRight) return;
        // Connect
        S.matchState[li] = selectedRight.origIdx;
        el.classList.add('matched');
        selectedRight.el.classList.add('matched');
        selectedRight.el.classList.remove('picked');
        // Draw SVG line (pass svg as coordinate reference)
        drawLine(svg, selectedRight.el, el, li);
        selectedRight = null;
        // Check complete
        if (Object.keys(S.matchState).length === q.pairs.length) {
          S.currentAnswer = { ...S.matchState }; // copy before reset
          enableNext();
        }
      });
      leftCol.appendChild(el);
      leftEls.push(el);
    });

    // Build right column (shuffled)
    rightItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'match-item match-right';
      el.textContent = item.text;
      el.dataset.orig = item.origIdx;
      el.addEventListener('click', () => {
        if (el.classList.contains('matched')) return;
        rightEls.forEach(r => r.classList.remove('picked'));
        el.classList.add('picked');
        selectedRight = { el, origIdx: item.origIdx };
        playClick();
      });
      rightCol.appendChild(el);
      rightEls.push(el);
    });

    cols.appendChild(leftCol);
    cols.appendChild(rightCol);
    wrapper.appendChild(cols);
    wrapper.appendChild(svg);
    area.appendChild(wrapper);

    // Instruction
    const hint = document.createElement('p');
    hint.style.cssText = 'text-align:center;font-size:0.85rem;color:var(--text-dim);margin-top:12px;';
    hint.textContent = '👉 Tap a right item to select, then tap the matching left item!';
    area.appendChild(hint);
  }

  // drawLine: uses the SVG element's own bounding rect as coordinate reference
  // since the SVG is positioned at top:0; left:0 within its parent (.match-area)
  function drawLine(svg, fromEl, toEl, colorIdx) {
    const colors = ['#f59e0b','#06b6d4','#10b981','#a855f7','#ef4444'];
    // Use SVG's viewport as the coordinate system
    const svgRect  = svg.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const toRect   = toEl.getBoundingClientRect();

    const x1 = fromRect.left - svgRect.left + fromRect.width / 2;
    const y1 = fromRect.top  - svgRect.top  + fromRect.height / 2;
    const x2 = toRect.left   - svgRect.left + toRect.width / 2;
    const y2 = toRect.top    - svgRect.top  + toRect.height / 2;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', colors[colorIdx % colors.length]);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-dasharray', '8 4');
    line.setAttribute('stroke-linecap', 'round');
    // Animated dash
    const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    anim.setAttribute('attributeName', 'stroke-dashoffset');
    anim.setAttribute('values', '24;0'); anim.setAttribute('dur', '0.8s');
    anim.setAttribute('calcMode', 'linear'); anim.setAttribute('repeatCount', 'indefinite');
    line.appendChild(anim);
    svg.appendChild(line);
  }

  // ─── Fill in the Blank – Word Bank ────────────────────────
  function renderFillBank(q, area) {
    S.fillState = new Array(q.blanks).fill(null);

    // Build sentence with blank spans
    let sentenceHTML = q.text;
    for (let i = 0; i < q.blanks; i++) {
      sentenceHTML = sentenceHTML.replace('___',
        `<span class="fill-blank" id="blank-${i}" data-blank="${i}">${q.blankLabels[i] || '___'}</span>`);
    }

    const sentEl = document.createElement('div');
    sentEl.className = 'fill-sentence';
    sentEl.innerHTML = sentenceHTML;

    // Add image if provided
    if (q.image) {
      const imgEl = document.createElement('div');
      imgEl.className = 'q-img-wrap';
      imgEl.innerHTML = `<img src="${q.image}" alt="hint" loading="lazy">`;
      area.appendChild(imgEl);
    }
    area.appendChild(sentEl);

    // Word bank
    const bankLabel = document.createElement('div');
    bankLabel.className = 'word-bank-label';
    bankLabel.textContent = '📦 Word Bank – click a word to fill a blank:';
    area.appendChild(bankLabel);

    const bank = document.createElement('div');
    bank.className = 'word-bank';
    const shuffledBank = shuffle(q.wordBank);

    shuffledBank.forEach(word => {
      const tile = document.createElement('div');
      tile.className = 'word-tile';
      tile.textContent = word;
      tile.dataset.word = word;
      tile.addEventListener('click', () => {
        if (tile.classList.contains('used')) return;
        // Find first empty blank
        const emptyIdx = S.fillState.indexOf(null);
        if (emptyIdx === -1) return;
        S.fillState[emptyIdx] = word;
        tile.classList.add('used');
        const blankEl = document.getElementById(`blank-${emptyIdx}`);
        if (blankEl) { blankEl.textContent = word; blankEl.classList.add('filled'); }
        playClick();
        // Allow removing by clicking the blank
        blankEl.addEventListener('click', () => {
          S.fillState[emptyIdx] = null;
          blankEl.textContent = q.blankLabels[emptyIdx] || '___';
          blankEl.classList.remove('filled');
          tile.classList.remove('used');
        }, { once: true });
        // Check if all blanks filled
        if (S.fillState.every(v => v !== null)) {
          S.currentAnswer = [...S.fillState];
          enableNext();
        }
      });
      bank.appendChild(tile);
    });
    area.appendChild(bank);
  }

  // ─── Calculation Renderer ─────────────────────────────────
  function renderCalc(q, area) {
    const card = document.createElement('div');
    card.className = 'calc-card';
    let givensHTML = q.given ? q.given.map(g => `
      <div class="calc-given-item">
        <div class="given-symbol">${g.symbol}</div>
        <div class="given-value">${g.value} <small style="font-size:0.6em;color:var(--text-dim)">${g.unit}</small></div>
        <div class="given-label">${g.label}</div>
      </div>`).join('') : '';

    card.innerHTML = `
      <div class="calc-title">${q.emoji || '⚡'} ${q.title || ''}</div>
      ${q.scenario ? `<p style="color:var(--text-dim);margin-bottom:16px;line-height:1.5">${q.scenario}</p>` : ''}
      <div class="calc-formula">${q.formula}</div>
      ${q.given ? `<div class="calc-givens">${givensHTML}</div>` : ''}
      ${q.find ? `<div class="calc-find">🔍 Find: <strong style="color:var(--accent)">${q.find.symbol}</strong> in <strong>${q.find.unit}</strong></div>` : ''}
      <br>
      <button class="calc-hint-btn" onclick="this.nextElementSibling.classList.toggle('show')">
        💡 Show Hint
      </button>
      <div class="calc-hint">${q.hint}</div>
    `;
    area.appendChild(card);

    if (q.image) {
      area.innerHTML = `<div class="q-img-wrap"><img src="${q.image}" alt="" loading="lazy"></div>` + area.innerHTML;
    }

    // MCQ options
    const grid = document.createElement('div');
    grid.className = 'mcq-grid';
    const letters = ['A','B','C','D'];
    q.options.forEach((opt, i) => {
      const el = document.createElement('div');
      el.className = 'mcq-opt';
      el.innerHTML = `<div class="opt-letter">${letters[i]}</div><span>${opt}</span>`;
      el.onclick = () => selectMCQ(grid, el, i);
      grid.appendChild(el);
    });
    area.appendChild(grid);
  }

  // ─── PictoBlock Renderer ──────────────────────────────────
  function renderPicto(q, area) {
    const gifWrap = document.createElement('div');
    gifWrap.style.textAlign = 'center';
    gifWrap.innerHTML = `<img src="${q.image}" alt="LED Blink" class="picto-gif">
      <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px;">${q.instruction}</p>`;
    area.appendChild(gifWrap);

    const layout = document.createElement('div');
    layout.className = 'picto-layout';

    // Palette
    const paletteWrap = document.createElement('div');
    paletteWrap.className = 'picto-palette-wrap';
    paletteWrap.innerHTML = '<div class="picto-section-label">🎨 Block Palette</div>';
    const palette = document.createElement('div');
    palette.className = 'picto-palette';
    const paletteMap = {};

    q.palette.forEach(block => {
      const el = document.createElement('div');
      el.className = 'picto-palette-block';
      el.id = `pal-${block.id}`;
      el.style.background = block.color + '33';
      el.style.borderColor = block.color + '88';
      el.style.borderWidth = '2px';
      el.style.borderStyle = 'solid';
      el.innerHTML = `<span>${block.icon}</span><span>${block.label}</span>`;
      el.title = block.category;
      el.addEventListener('click', () => addBlock(block, el));
      palette.appendChild(el);
      paletteMap[block.id] = { block, el };
    });
    paletteWrap.appendChild(palette);

    // Code area
    const codeWrap = document.createElement('div');
    codeWrap.className = 'picto-code-wrap';
    codeWrap.innerHTML = '<div class="picto-section-label">📋 Your Code Sequence</div>';
    const codeArea = document.createElement('div');
    codeArea.className = 'picto-code-area';
    codeArea.id = 'picto-code-area';
    codeArea.innerHTML = '<p style="color:var(--text-dim);font-size:0.85rem;text-align:center;padding:20px;">← Click blocks to add them here</p>';

    const runBtn = document.createElement('button');
    runBtn.className = 'picto-run-btn';
    runBtn.innerHTML = '▶ Run & Check!';
    runBtn.addEventListener('click', () => checkPicto(q, runBtn));

    codeWrap.appendChild(codeArea);
    codeWrap.appendChild(runBtn);
    layout.appendChild(paletteWrap);
    layout.appendChild(codeWrap);
    area.appendChild(layout);

    function addBlock(block, palEl) {
      playClick();
      S.pictoSeq.push(block.id);
      palEl.classList.add('used');
      const seq = S.pictoSeq.length;
      const placed = document.createElement('div');
      placed.className = 'picto-placed-block';
      placed.style.background = block.color + '33';
      placed.style.borderLeft = `4px solid ${block.color}`;
      placed.innerHTML = `
        <div class="placed-block-num">${seq}</div>
        <span>${block.icon} ${block.label}</span>
        <span class="remove-block" title="Remove">✕</span>`;
      placed.querySelector('.remove-block').addEventListener('click', () => {
        S.pictoSeq.splice(S.pictoSeq.indexOf(block.id), 1);
        placed.remove();
        palEl.classList.remove('used');
        // Re-number
        codeArea.querySelectorAll('.picto-placed-block .placed-block-num')
          .forEach((n, i) => n.textContent = i + 1);
      });
      if (codeArea.querySelector('p')) codeArea.innerHTML = '';
      codeArea.appendChild(placed);
      S.currentAnswer = S.pictoSeq;
      enableNext();
    }
  }

  function checkPicto(q, btn) {
    const correct = JSON.stringify(S.pictoSeq) === JSON.stringify(q.correctSequence);
    btn.textContent = correct ? '✅ Correct Sequence!' : '❌ Not quite right, but keep going!';
    btn.style.borderColor = correct ? 'var(--success)' : 'var(--danger)';
    btn.style.color = correct ? 'var(--success)' : 'var(--danger)';
    S.currentAnswer = S.pictoSeq;
    enableNext();
  }

  // ─── Arduino IDE Renderer ─────────────────────────────────
  function renderArduinoIDE(q, area) {
    if (q.image) {
      area.innerHTML = `<div class="q-img-wrap"><img src="${q.image}" alt="IDE" style="max-height:100px;" loading="lazy"></div>`;
    }
    const ide = document.createElement('div');
    ide.className = 'ide-window';
    ide.innerHTML = `
      <div class="ide-titlebar">
        <div class="ide-dot red"></div>
        <div class="ide-dot yellow"></div>
        <div class="ide-dot green"></div>
        <span class="ide-filename">blink_led.ino — Arduino IDE</span>
      </div>
      <div class="ide-code">${q.codeLines.map((ln, i) => {
        if (ln.type === 'empty') return `<div class="code-line"><span class="code-ln">${i+1}</span><span class="code-txt">&nbsp;</span></div>`;
        const txt = ln.type === 'blank'
          ? ln.text.replace('________', '<span class="kw-blank" id="ide-blank">______</span>')
          : ln.text
              .replace(/\b(void)\b/g,  '<span class="kw-void">void</span>')
              .replace(/\b(setup|loop|digitalWrite|pinMode|delay)\b/g, '<span class="kw-fn">$1</span>')
              .replace(/\b(\d+)\b/g, '<span class="kw-num">$1</span>');
        return `<div class="code-line"><span class="code-ln">${i+1}</span><span class="code-txt">${txt}</span></div>`;
      }).join('')}</div>`;
    area.appendChild(ide);

    const label = document.createElement('p');
    label.style.cssText = 'text-align:center;color:var(--text-dim);font-size:0.9rem;margin:10px 0;';
    label.textContent = '👆 Choose the correct function for the blank:';
    area.appendChild(label);

    const opts = document.createElement('div');
    opts.className = 'ide-opts';
    const letters = ['A','B','C','D'];
    q.options.forEach((opt, i) => {
      const el = document.createElement('div');
      el.className = 'ide-opt';
      el.innerHTML = `<span class="opt-letter">${letters[i]}</span><code>${opt}</code>`;
      el.addEventListener('click', () => {
        if (S.answerLocked) return;
        opts.querySelectorAll('.ide-opt').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        const blank = document.getElementById('ide-blank');
        if (blank) blank.textContent = opt;
        S.currentAnswer = i;
        playClick();
        enableNext();
      });
      opts.appendChild(el);
    });
    area.appendChild(opts);
  }

  // ─── AI Question Renderer ─────────────────────────────────
  function renderAI(q, area) {
    const scene = document.createElement('div');
    scene.className = 'ai-scene';
    scene.innerHTML = `
      <div class="ai-bot-wrap">
        <div class="ai-avatar">🤖</div>
      </div>
      <div class="ai-bubble">
        <div class="ai-name">✨ ${q.aiName}</div>
        <div class="ai-q-text">${q.text}</div>
        <div class="ai-hint">${q.aiHint}</div>
      </div>`;
    area.appendChild(scene);

    const opts = document.createElement('div');
    opts.className = 'ai-opts';
    q.options.forEach((opt, i) => {
      const el = document.createElement('div');
      el.className = 'ai-opt';
      el.innerHTML = `<div class="ai-opt-emoji">${opt.emoji}</div><div>${opt.text}</div>`;
      el.addEventListener('click', () => {
        if (S.answerLocked) return;
        opts.querySelectorAll('.ai-opt').forEach(o => o.classList.remove('selected'));
        el.classList.add('selected');
        S.currentAnswer = i;
        playClick();
        enableNext();
      });
      opts.appendChild(el);
    });
    area.appendChild(opts);
  }

  // ─── Evaluate Answer ─────────────────────────────────────
  function evaluateAnswer(q) {
    let correct = false;
    switch (q.type) {
      case 'mcq':
      case 'calc':
      case 'arduino_ide':
        correct = S.currentAnswer === q.answer; break;
      case 'true_false':
        correct = S.currentAnswer === q.answer; break;
      case 'match':
        if (S.currentAnswer && typeof S.currentAnswer === 'object') {
          correct = q.pairs.every((_, i) => S.currentAnswer[i] === i);
        } break;
      case 'fill_bank':
        if (Array.isArray(S.currentAnswer)) {
          correct = q.answers.every((a, i) =>
            S.currentAnswer[i] && S.currentAnswer[i].toLowerCase() === a.toLowerCase()
          );
        } break;
      case 'picto':
        if (Array.isArray(S.currentAnswer)) {
          correct = JSON.stringify(S.currentAnswer) === JSON.stringify(q.correctSequence);
        } break;
      case 'ai_question':
        correct = S.currentAnswer === q.answer; break;
    }
    const earned = correct ? (q.marks || 1) : 0;
    if (correct) { S.score += earned; playOK(); } else { playBad(); }
    S.answers.push({
      id: q.id, type: q.type, text: q.text.replace(/[^\w\s]/g,''),
      correct, earned, max: q.marks || 1
    });
    showFeedback(correct);
    return correct;
  }

  function showFeedback(correct) {
    const toast = $('feedback-toast');
    toast.textContent = correct ? '🎉 Correct! +' + S.questions[S.idx].marks + ' XP' : '❌ Not quite, keep going!';
    toast.className = `feedback-toast ${correct ? 'correct' : 'wrong'} show`;
    setTimeout(() => { toast.className = 'feedback-toast'; }, 1800);
  }

  // ─── Navigation Buttons ───────────────────────────────────
  $('btn-next').addEventListener('click', () => {
    playClick();
    if (S.currentAnswer === null && !S.answerLocked) {
      // Allow skip without answer (just move forward)
    }
    evaluateAnswer(S.questions[S.idx]);
    S.answerLocked = true;
    S.idx++;
    updateXP();
    if (S.idx >= S.questions.length) {
      finishGame();
    } else {
      setTimeout(loadQuestion, 300);
    }
  });

  $('btn-skip').addEventListener('click', () => {
    playClick();
    S.answers.push({
      id: S.questions[S.idx].id, type: S.questions[S.idx].type,
      text: S.questions[S.idx].text.replace(/[^\w\s]/g,''),
      correct: false, earned: 0, max: S.questions[S.idx].marks || 1
    });
    S.idx++;
    updateXP();
    if (S.idx >= S.questions.length) finishGame();
    else loadQuestion();
  });

  // ─── Finish Game ──────────────────────────────────────────
  function finishGame() {
    bgm.pause(); S.isMusicOn = false;
    const pct = Math.round((S.score / S.maxScore) * 100);
    const stars = pct >= 80 ? 3 : pct >= 50 ? 2 : 1;
    const msgs = ['Keep practising! 💪', 'Good effort! 🌟', 'Amazing work! 🚀🔥'];

    $('res-name').textContent = `🎓 ${S.studentData.name}`;
    $('res-score').textContent = `${S.score} / ${S.maxScore}`;
    $('res-pct').textContent = `${pct}% — ${msgs[stars-1]}`;

    // Stars
    const starsEl = $('res-stars');
    starsEl.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
      const s = document.createElement('div');
      s.className = `result-star ${i <= stars ? 'lit' : 'unlit'}`;
      s.textContent = '⭐';
      s.style.animationDelay = (i * 0.3) + 's';
      starsEl.appendChild(s);
    }

    // Save to localStorage
    const all = JSON.parse(localStorage.getItem('stemquest_v2') || '[]');
    all.push({ ...S.studentData, score: S.score, maxScore: S.maxScore, pct, date: new Date().toISOString() });
    localStorage.setItem('stemquest_v2', JSON.stringify(all));

    showView('results');
    if (stars >= 2) launchConfetti();
  }

  // ─── Confetti ─────────────────────────────────────────────
  function launchConfetti() {
    const colors = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#a855f7','#fbbf24'];
    const shapes = ['circle','square'];
    for (let i = 0; i < 90; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 10;
        el.style.cssText = `
          left:${Math.random()*100}vw;
          top:-20px;
          width:${size}px; height:${size}px;
          background:${color};
          border-radius:${shape==='circle'?'50%':'3px'};
          animation-duration:${1.5+Math.random()*2.5}s;
          animation-delay:${Math.random()*0.8}s;
        `;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 4000);
      }, i * 20);
    }
  }

  // ─── CSV Download ────────────────────────────────────────
  $('btn-csv').addEventListener('click', () => {
    const rows = [['Student Name','Grade','School','Q#','Type','Question','Correct?','Marks Earned','Max Marks']];
    S.answers.forEach((a, i) => {
      rows.push([
        `"${S.studentData.name}"`, `"${S.studentData.grade}"`, `"${S.studentData.school}"`,
        i + 1, a.type, `"${a.text}"`,
        a.correct ? 'Yes' : 'No', a.earned, a.max
      ]);
    });
    // Summary row
    const pct = Math.round((S.score / S.maxScore) * 100);
    rows.push([`"${S.studentData.name}"`, `"${S.studentData.grade}"`, `"${S.studentData.school}"`,
      'TOTAL', '-', '"Final Score"', '-', S.score, S.maxScore]);
    rows.push(['','','','','','', `"Score %"`, `"${pct}%"`, '']);

    const csv = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `STEM-Quest-${S.studentData.name.replace(/\s+/g,'-')}-${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  $('btn-play-again').addEventListener('click', () => { showView('landing'); });

  // ─── Teacher Mode ─────────────────────────────────────────
  function showTeacherLogin() {
    const id = prompt('👩‍🏫 Teacher ID:');
    const pw = prompt('🔑 Password:');
    if ((id === 'teacher' || id === 'admin') && (pw === 'stemteacher' || pw === 'password')) {
      loadTeacherDash();
      showView('teacher');
    } else {
      alert('❌ Incorrect credentials! Use teacher / stemteacher');
    }
  }

  function loadTeacherDash() {
    const all = JSON.parse(localStorage.getItem('stemquest_v2') || '[]');
    const tbody = $('teacher-tbody');
    if (!tbody) return;
    if (all.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim)">No results yet!</td></tr>';
      return;
    }
    tbody.innerHTML = all.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.grade || '-'}</td>
        <td>${r.school || '-'}</td>
        <td><strong style="color:var(--warn)">${r.score}/${r.maxScore}</strong></td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="pct-bar-wrap"><div class="pct-bar" style="width:${r.pct}%"></div></div>
            <span>${r.pct}%</span>
          </div>
        </td>
      </tr>`).join('');
  }

  $('btn-teacher-csv') && $('btn-teacher-csv').addEventListener('click', () => {
    const all = JSON.parse(localStorage.getItem('stemquest_v2') || '[]');
    const rows = [['Name','Grade','School','Score','Max Score','Percentage','Date']];
    all.forEach(r => rows.push([`"${r.name}"`,`"${r.grade}"`,`"${r.school}"`,r.score,r.maxScore,`${r.pct}%`,`"${r.date}"`]));
    const csv = rows.map(r=>r.join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `STEM-Quest-All-Results-${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  });

  $('btn-teacher-back') && $('btn-teacher-back').addEventListener('click', () => showView('landing'));
  $('btn-teacher-clear') && $('btn-teacher-clear').addEventListener('click', () => {
    if (confirm('Delete all results?')) { localStorage.removeItem('stemquest_v2'); loadTeacherDash(); }
  });

  // ─── Boot ─────────────────────────────────────────────────
  function boot() {
    initBackground();
    spawnParticles();
    scheduleLaunch();
    showView('landing');
  }

  document.addEventListener('DOMContentLoaded', boot);

})();
