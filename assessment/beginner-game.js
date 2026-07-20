/**
 * STEM Quest – Beginner Game Engine
 * OOP Architecture
 */

(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  class AssessmentApp {
    constructor(questions) {
      this.questions = questions;
      this.state = {
        idx: 0,
        answers: new Array(questions.length).fill(null), // stores user answers
        score: 0,
        studentData: {},
        isMusicOn: false
      };
      
      this.views = {
        landing: $('view-landing'),
        register: $('view-register'),
        game: $('view-game'),
        results: $('view-results'),
        teacher: $('view-teacher')
      };

      this.audio = {
        bgm: $('bgm'),
        ok: $('sfx-ok'),
        bad: $('sfx-bad'),
        click: $('sfx-click')
      };

      this.timer = new GameTimer(20 * 60, () => this.finishQuest()); // 20 mins
      this.renderer = new QuestionRenderer(this);

      this.initEvents();
      this.initBackground();
      this.showView('landing');
    }

    initEvents() {
      $('btn-play')?.addEventListener('click', () => { this.playClick(); this.showView('register'); });
      $('btn-teacher-mode')?.addEventListener('click', () => { this.playClick(); this.showTeacherLogin(); });
      $('btn-back-reg')?.addEventListener('click', () => { this.playClick(); this.showView('landing'); });
      $('btn-music')?.addEventListener('click', () => this.toggleMusic());
      
      $('form-register')?.addEventListener('submit', e => {
        e.preventDefault();
        this.state.studentData = {
          name: $('inp-name').value.trim(),
          grade: $('inp-grade').value,
          school: $('inp-school').value.trim()
        };
        this.startGame();
      });

      // Navigation Buttons
      const nextFn = () => { if (!$('btn-next-side').disabled) this.nextQuestion(); };
      const prevFn = () => { if (!$('btn-prev-side').disabled) this.prevQuestion(); };

      $('btn-next-side')?.addEventListener('click', nextFn);
      $('btn-next-mobile')?.addEventListener('click', nextFn);
      $('btn-prev-side')?.addEventListener('click', prevFn);
      $('btn-prev-mobile')?.addEventListener('click', prevFn);

      $('btn-csv')?.addEventListener('click', () => this.downloadCSV());
      $('btn-play-again')?.addEventListener('click', () => location.reload());
    }

    showView(key) {
      Object.values(this.views).forEach(v => { if (v) v.classList.remove('active'); });
      if (this.views[key]) this.views[key].classList.add('active');
    }

    playClick() { try { this.audio.click.currentTime = 0; this.audio.click.play(); } catch(e){} }
    playOK() { try { this.audio.ok.currentTime = 0; this.audio.ok.play(); } catch(e){} }
    playBad() { try { this.audio.bad.currentTime = 0; this.audio.bad.play(); } catch(e){} }

    toggleMusic() {
      this.state.isMusicOn ? this.audio.bgm.pause() : this.audio.bgm.play().catch(()=>{});
      this.state.isMusicOn = !this.state.isMusicOn;
      $('btn-music').textContent = this.state.isMusicOn ? '🔊' : '🎵';
    }

    shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    startGame() {
      // Setup Game state
      this.questions = this.shuffle(this.questions);
      this.state.idx = 0;
      this.state.answers = new Array(this.questions.length).fill(null);
      this.state.score = 0;

      // Start Music
      this.audio.bgm.volume = 0.18;
      if (!this.state.isMusicOn) {
        this.audio.bgm.play().catch(()=>{});
        this.state.isMusicOn = true;
        $('btn-music').textContent = '🔊';
      }

      this.showView('game');
      this.timer.start();
      this.loadQuestion();
    }

    loadQuestion() {
      this.hideToast();
      const q = this.questions[this.state.idx];
      this.renderer.render(q, this.state.idx, this.questions.length, this.state.answers[this.state.idx]);
      this.updateNavButtons();
      if (this.state.answers[this.state.idx] !== null) {
        this.evaluateCurrentAnswer();
      }
    }

    setAnswer(val) {
      this.state.answers[this.state.idx] = val;
      this.updateNavButtons();
      this.evaluateCurrentAnswer();
    }

    evaluateCurrentAnswer() {
      // No right/wrong feedback shown — students must not be able to switch to correct answer
      // Just ensure answer is recorded (nav button enables via updateNavButtons)
    }

    showToast(msg, type) {
      const toast = $('feedback-toast');
      if (!toast) return;
      toast.textContent = msg;
      toast.className = 'feedback-toast show ' + type;
      // It stays back (does not go away) as requested
    }

    hideToast() {
      const toast = $('feedback-toast');
      if (toast) toast.className = 'feedback-toast';
    }

    updateNavButtons() {
      const isAnswered = this.state.answers[this.state.idx] !== null;
      
      const nextSide = $('btn-next-side');
      const nextMob = $('btn-next-mobile');
      if (nextSide) {
        nextSide.disabled = !isAnswered;
        nextSide.classList.remove('hidden');
      }
      if (nextMob) {
        nextMob.disabled = !isAnswered;
        nextMob.classList.remove('hidden');
      }

      const isLast = this.state.idx === this.questions.length - 1;
      if (nextSide) nextSide.innerHTML = isLast ? '<i class="fa-solid fa-flag-checkered"></i>' : '<i class="fa-solid fa-chevron-right"></i>';
      if (nextMob) nextMob.textContent = isLast ? '🏁 Finish' : 'Next ➜';

      const prevSide = $('btn-prev-side');
      const prevMob = $('btn-prev-mobile');
      const isFirst = this.state.idx === 0;
      if (prevSide) {
        prevSide.disabled = isFirst;
        if(isFirst) prevSide.classList.add('hidden'); else prevSide.classList.remove('hidden');
      }
      if (prevMob) {
        prevMob.disabled = isFirst;
        if(isFirst) prevMob.classList.add('hidden'); else prevMob.classList.remove('hidden');
      }
    }

    nextQuestion() {
      this.playClick();
      // Only advance if answered
      if (this.state.answers[this.state.idx] === null) return;

      if (this.state.idx < this.questions.length - 1) {
        this.state.idx++;
        this.loadQuestion();
      } else {
        this.finishQuest();
      }
    }

    prevQuestion() {
      this.playClick();
      if (this.state.idx > 0) {
        this.state.idx--;
        this.loadQuestion();
      }
    }

    calculateScore() {
      let total = 0;
      let maxTotal = 0;
      
      this.questions.forEach((q, idx) => {
        const ans = this.state.answers[idx];
        const m = q.marks || 1;
        maxTotal += m;
        
        if (ans === null) return;
        
        if (q.type === 'mcq' || q.type === 'calc' || q.type === 'arduino_ide' || q.type === 'image_id' || q.type === 'audio_id' || q.type === 'ai_question') {
          if (ans === q.answer) total += m;
        } else if (q.type === 'true_false') {
          if (ans === q.answer) total += m;
        } else if (q.type === 'match') {
          // partial marks
          let correctPairs = 0;
          const totalPairs = q.pairs.length;
          for (let k in ans) {
            if (ans[k] === parseInt(k)) correctPairs++;
          }
          total += (correctPairs / totalPairs) * m;
        } else if (q.type === 'fill_bank') {
          // partial marks
          let correctBlanks = 0;
          for (let i = 0; i < q.blanks; i++) {
            if (ans[i]?.toLowerCase() === q.answers[i]?.toLowerCase()) correctBlanks++;
          }
          total += (correctBlanks / q.blanks) * m;
        } else if (q.type === 'picto') {
          if (JSON.stringify(ans) === JSON.stringify(q.correctSequence)) total += m;
        }
      });
      return { total: Math.round(total), max: maxTotal };
    }

    finishQuest() {
      this.timer.stop();
      this.showView('results');
      
      const { total, max } = this.calculateScore();
      const pct = Math.round((total / max) * 100) || 0;
      this.state.score = total;

      $('res-name').textContent = `Great Job, ${this.state.studentData.name}!`;

      if ($('res-score')) {
        $('res-score').textContent = `${total} / ${max} Points (${pct}%)`;
      }

      let grade = 'F';
      let message = 'Keep practicing!';
      if (pct >= 90) { grade = 'A+'; message = 'Super STEM Master! 🌟'; }
      else if (pct >= 80) { grade = 'A'; message = 'Excellent job! 🚀'; }
      else if (pct >= 70) { grade = 'B'; message = 'Great effort! 👍'; }
      else if (pct >= 60) { grade = 'C'; message = 'Passed! Let\'s keep learning! 📚'; }
      else if (pct >= 50) { grade = 'D'; message = 'Need a bit more practice! 💪'; }

      if ($('res-grade')) {
        $('res-grade').textContent = `Grade: ${grade}`;
      }
      if ($('res-pct')) {
        $('res-pct').textContent = `${message} Your answers have been saved and your report will download automatically!`;
      }

      // Trigger download immediately
      this.downloadCSV();
    }

    downloadCSV() {
      const { total, max } = this.calculateScore();
      const pct = Math.round((total / max) * 100) || 0;
      
      // Header: Name, Grade, School, Q1..Q50, Total, %
      let header = ['Name', 'Grade', 'School/College'];
      this.questions.forEach((q, i) => header.push(`Q${i+1}`));
      header.push('Total Score');
      header.push('Percentage');

      // Row Data
      let row = [
        `"${this.state.studentData.name}"`,
        `"${this.state.studentData.grade}"`,
        `"${this.state.studentData.school}"`
      ];

      this.questions.forEach((q, idx) => {
        const ans = this.state.answers[idx];
        let val = '';
        if (ans !== null) {
          if (Array.isArray(ans)) val = ans.join('|');
          else if (typeof ans === 'object') val = JSON.stringify(ans);
          else val = ans.toString();
        }
        row.push(`"${val}"`);
      });

      row.push(total);
      row.push(`${pct}%`);

      const csvContent = "data:text/csv;charset=utf-8," + header.join(",") + "\n" + row.join(",");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `STEM_Quest_${this.state.studentData.name.replace(/\s+/g,'_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showTeacherLogin() {
      alert("Teacher dashboard coming soon!");
    }

    // Cool Background Canvas
    initBackground() {
      const canvas = $('bg-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let w, h, offset = 0;
  
      const resize = () => {
        w = canvas.width  = window.innerWidth;
        h = canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener('resize', resize);
  
      const GRID = 55;
      const components = Array.from({ length: 18 }, () => ({
        x: Math.random(), y: Math.random(), type: Math.floor(Math.random() * 4)
      }));
  
      const drawFrame = () => {
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#080818');
        grad.addColorStop(1, '#0d0a22');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
  
        const ox = offset % GRID;
        const oy = (offset * 0.4) % GRID;
  
        ctx.strokeStyle = 'rgba(100,80,220,0.08)';
        ctx.lineWidth = 1;
        for (let x = -ox; x < w + GRID; x += GRID) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = -oy; y < h + GRID; y += GRID) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
  
        ctx.fillStyle = 'rgba(120,100,255,0.18)';
        for (let x = -ox; x < w + GRID; x += GRID) {
          for (let y = -oy; y < h + GRID; y += GRID) {
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }
  
        components.forEach(c => {
          const cx = (c.x * w - ox * 0.5) % w;
          const cy = (c.y * h - oy * 0.3) % h;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.globalAlpha = 0.06;
          ctx.strokeStyle = '#00ffcc';
          ctx.lineWidth = 1.5;
          if (c.type === 0) {
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            [-10,-5,0,5,10].forEach((xi, i) => ctx.lineTo(xi, i%2===0?-6:6));
            ctx.lineTo(15, 0); ctx.stroke();
          } else if (c.type === 1) {
            ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(-8,8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(8,-8);  ctx.lineTo(8,8);  ctx.stroke();
          } else if (c.type === 2) {
            ctx.beginPath(); ctx.moveTo(-8,8); ctx.lineTo(8,0); ctx.lineTo(-8,-8); ctx.closePath(); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.stroke();
          }
          ctx.restore();
        });
  
        const t = Date.now() * 0.001;
        for (let x = -ox; x < w + GRID; x += GRID*2) {
          const py = ((t * 60 + x * 3.7) % (h + 20)) - 10;
          ctx.fillStyle = 'rgba(6,182,212,0.35)';
          ctx.beginPath(); ctx.arc(x, py, 3, 0, Math.PI*2); ctx.fill();
        }
  
        offset += 0.35;
        requestAnimationFrame(drawFrame);
      };
      drawFrame();
      this.scheduleRocket();
      this.initDrones();
    }

    scheduleRocket() {
      const r = $('sprite-rocket');
      if (!r) return;
      const delay = 9000 + Math.random() * 12000;
      setTimeout(() => {
        r.style.left = (8 + Math.random() * 70) + 'vw';
        r.classList.remove('rocket-lit');
        r.getBoundingClientRect();
        r.classList.add('rocket-lit');
        this.scheduleRocket();
      }, delay);
    }

    initDrones() {
      const container = $('bg-sprites');
      if (!container) return;

      const existing = $('sprite-drone');
      if (existing) existing.remove();

      const numDrones = 3;
      for (let i = 0; i < numDrones; i++) {
        this.createDrone(container, i);
      }
    }

    createDrone(container, id) {
      const drone = document.createElement('div');
      drone.className = 'bg-sprite flying-drone';
      drone.id = `drone-${id}`;
      const scale = 0.55 + Math.random() * 0.55; // randomized size
      drone.style.cssText = `
        position: absolute;
        pointer-events: none;
        z-index: 1;
        transition: left 9s ease-in-out, top 9s ease-in-out;
        filter: drop-shadow(0 4px 16px rgba(6, 182, 212, 0.4));
        transform: scale(${scale});
      `;

      drone.innerHTML = `
        <div class="drone-body" style="animation: droneHover ${1.4 + Math.random() * 0.8}s ease-in-out infinite;">
          <svg width="90" height="63" viewBox="0 0 70 50" xmlns="http://www.w3.org/2000/svg">
            <style>
              .prop-${id} {
                transform-origin: center;
                transform-box: fill-box;
                animation: spinProp 0.1s linear infinite;
              }
            </style>
            <line x1="10" y1="24" x2="35" y2="24" stroke="#4a90e2" stroke-width="2.5" opacity="0.8" />
            <line x1="35" y1="24" x2="60" y2="24" stroke="#4a90e2" stroke-width="2.5" opacity="0.8" />
            <ellipse cx="35" cy="24" rx="10" ry="6" fill="#3b5bdb" opacity="0.9" />
            <circle cx="35" cy="28" r="3" fill="#1a1a2e" />
            <circle cx="35" cy="28" r="1.5" fill="#ff4757" />
            <g class="prop-${id}" transform="translate(10,18)">
              <ellipse rx="8" ry="2.5" fill="#06b6d4" opacity="0.75" />
              <ellipse ry="8" rx="2.5" fill="#06b6d4" opacity="0.75" />
            </g>
            <g class="prop-${id}" transform="translate(60,18)">
              <ellipse rx="8" ry="2.5" fill="#06b6d4" opacity="0.75" />
              <ellipse ry="8" rx="2.5" fill="#06b6d4" opacity="0.75" />
            </g>
            <circle cx="35" cy="20" r="2" fill="#fbbf24" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      `;

      container.appendChild(drone);

      let lastX = Math.random() * 100;
      drone.style.left = `${lastX}%`;
      drone.style.top = `${10 + Math.random() * 40}%`;

      const fly = () => {
        const nextX = -10 + Math.random() * 110;
        const nextY = 5 + Math.random() * 50;

        const body = drone.querySelector('.drone-body');
        if (body) {
          body.style.transform = nextX < lastX ? 'scaleX(-1)' : 'scaleX(1)';
        }

        lastX = nextX;
        drone.style.left = `${nextX}%`;
        drone.style.top = `${nextY}%`;

        setTimeout(fly, 7000 + Math.random() * 6000);
      };

      setTimeout(fly, 100);
    }
  }

  class GameTimer {
    constructor(seconds, onComplete) {
      this.totalSeconds = seconds;
      this.remaining = seconds;
      this.interval = null;
      this.onComplete = onComplete;
      this.el = $('game-timer');
      this.textEl = $('timer-text');
    }
    start() {
      if(this.el) this.el.classList.remove('hidden');
      this.remaining = this.totalSeconds;
      this.updateUI();
      this.interval = setInterval(() => {
        this.remaining--;
        this.updateUI();
        if (this.remaining <= 0) {
          this.stop();
          this.onComplete();
        }
      }, 1000);
    }
    stop() {
      clearInterval(this.interval);
    }
    updateUI() {
      if(!this.textEl) return;
      const m = Math.floor(this.remaining / 60).toString().padStart(2, '0');
      const s = (this.remaining % 60).toString().padStart(2, '0');
      this.textEl.textContent = `${m}:${s}`;
      if (this.remaining < 60) this.el.style.color = 'var(--danger)';
    }
  }

  class QuestionRenderer {
    constructor(app) {
      this.app = app;
    }

    render(q, idx, total, savedAnswer) {
      const area = $('interaction-area');
      area.innerHTML = '';
      
      const typeLabels = {
        mcq: '⚡ Multiple Choice', true_false: '👍 True or False',
        match: '🔗 Match It!', fill_bank: '✏️ Fill the Blank',
        calc: '🔢 Calculate!', picto: '🧩 Block Code',
        arduino_ide: '💻 Arduino IDE', ai_question: '🤖 AI Challenge',
        image_id: '📷 Image Identifier', audio_id: '🔊 Audio Identifier'
      };
      
      const badgeEl = $('q-type-badge');
      if(badgeEl) {
        badgeEl.textContent = typeLabels[q.type] || q.type;
        badgeEl.className = `q-type-badge badge-${q.type}`;
      }

      $('q-text').textContent = q.text;
      const tagline = $('q-tagline');
      if(tagline) tagline.textContent = q.tagline || '';

      const imgWrap = $('q-img-wrap');
      if (q.image && q.type !== 'fill_bank' && q.type !== 'calc' && q.type !== 'arduino_ide' && q.type !== 'picto' && q.type !== 'match') {
        imgWrap.innerHTML = `<img src="${q.image}" alt="Question image" loading="lazy">`;
        imgWrap.classList.remove('hidden');
      } else {
        imgWrap.innerHTML = '';
        imgWrap.classList.add('hidden');
      }

      switch (q.type) {
        case 'mcq':
        case 'image_id':
          this.renderMCQ(q, area, savedAnswer); break;
        case 'true_false': this.renderTrueFalse(q, area, savedAnswer); break;
        case 'match': this.renderMatch(q, area, savedAnswer); break;
        case 'fill_bank': this.renderFillBank(q, area, savedAnswer); break;
        case 'calc': this.renderCalc(q, area, savedAnswer); break;
        case 'picto': this.renderPicto(q, area, savedAnswer); break;
        case 'arduino_ide': this.renderArduinoIDE(q, area, savedAnswer); break;
        case 'ai_question': this.renderAI(q, area, savedAnswer); break;
        case 'audio_id': this.renderAudioID(q, area, savedAnswer); break;
        case 'resistor_band': this.renderResistorBand(q, area, savedAnswer); break;
      }
    }

    renderMCQ(q, area, savedAnswer) {
      const letters = ['A', 'B', 'C', 'D'];
      const grid = document.createElement('div');
      
      if (q.variant === 'emoji') {
        grid.className = 'mcq-emoji-grid';
        q.options.forEach((opt, i) => {
          const el = document.createElement('div');
          el.className = 'mcq-emoji-opt' + (savedAnswer === i ? ' selected' : '');
          el.innerHTML = `<div class="opt-emoji">${opt.emoji}</div><div class="opt-text">${letters[i]}. ${opt.text}</div>`;
          el.onclick = () => this.selectMCQ(grid, el, i);
          grid.appendChild(el);
        });
      } else {
        grid.className = 'mcq-grid';
        q.options.forEach((opt, i) => {
          const el = document.createElement('div');
          el.className = 'mcq-opt' + (savedAnswer === i ? ' selected' : '');
          el.innerHTML = `<div class="opt-letter">${letters[i]}</div><span>${opt}</span>`;
          el.onclick = () => this.selectMCQ(grid, el, i);
          grid.appendChild(el);
        });
      }
      area.appendChild(grid);
    }

    selectMCQ(grid, el, idx) {
      this.app.playClick();
      grid.querySelectorAll('.mcq-opt, .mcq-emoji-opt').forEach(b => b.classList.remove('selected'));
      el.classList.add('selected');
      this.app.setAnswer(idx);
    }

    renderTrueFalse(q, area, savedAnswer) {
      const container = document.createElement('div');
      container.className = 'tf-container';
      container.innerHTML = `
        <button class="tf-btn tf-true ${savedAnswer === true ? 'selected' : ''}" id="tf-yes">
          <div class="tf-icon">👍</div>
          <div class="tf-label">TRUE</div>
        </button>
        <button class="tf-btn tf-false ${savedAnswer === false ? 'selected' : ''}" id="tf-no">
          <div class="tf-icon">👎</div>
          <div class="tf-label">FALSE</div>
        </button>`;
      
      const fact = document.createElement('div');
      fact.className = 'tf-fun-fact';
      fact.id = 'tf-fact';
      fact.textContent = q.funFact || '';
      if(savedAnswer !== null) fact.classList.add('visible');
      container.appendChild(fact);

      container.querySelector('#tf-yes').onclick = () => this.selectTF(container, true);
      container.querySelector('#tf-no').onclick  = () => this.selectTF(container, false);
      area.appendChild(container);
    }

    selectTF(container, val) {
      this.app.playClick();
      container.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('selected'));
      container.querySelector(val ? '#tf-yes' : '#tf-no').classList.add('selected');
      const fact = container.querySelector('#tf-fact');
      if (fact) fact.classList.add('visible');
      this.app.setAnswer(val);
    }

    renderMatch(q, area, savedAnswer) {
      const wrapper = document.createElement('div');
      wrapper.className = 'match-area';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'match-connector');
      svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2;';

      const cols = document.createElement('div');
      cols.className = 'match-cols';

      const leftCol = document.createElement('div');
      leftCol.className = 'match-col';
      const rightCol = document.createElement('div');
      rightCol.className = 'match-col';

      let rightItems = q.pairs.map((p, i) => ({ text: p.right, origIdx: i }));
      // Generate a seeded random order based on question ID so it doesn't shuffle on back/forth
      rightItems = this.app.shuffle(rightItems);

      let selectedNode = null; // { side: 'L'|'R', el, idx }
      const state = savedAnswer ? { ...savedAnswer } : {}; // L_idx -> R_idx

      const updateLines = () => {
        svg.innerHTML = '';
        leftEls.forEach(l => l.classList.remove('matched'));
        rightEls.forEach(r => r.classList.remove('matched'));

        for (let lIdx in state) {
          const rIdx = state[lIdx];
          const lEl = leftEls.find(el => parseInt(el.dataset.idx) === parseInt(lIdx));
          const rEl = rightEls.find(el => parseInt(el.dataset.orig) === parseInt(rIdx));
          if(lEl && rEl) {
            lEl.classList.add('matched');
            rEl.classList.add('matched');
            this.drawLine(svg, lEl, rEl, lIdx);
          }
        }

        if (Object.keys(state).length === q.pairs.length) {
          this.app.setAnswer(state);
        }
      };

      const handleNodeClick = (side, el, idx) => {
        if (el.classList.contains('matched')) return; // ignore matched
        this.app.playClick();
        
        if (!selectedNode) {
          // Select this one
          selectedNode = { side, el, idx };
          el.classList.add('picked');
        } else {
          // If clicking the same node, deselect
          if (selectedNode.el === el) {
            el.classList.remove('picked');
            selectedNode = null;
            return;
          }
          // If clicking same side, swap selection
          if (selectedNode.side === side) {
            selectedNode.el.classList.remove('picked');
            el.classList.add('picked');
            selectedNode = { side, el, idx };
            return;
          }
          
          // Match made
          selectedNode.el.classList.remove('picked');
          const lIdx = side === 'L' ? idx : selectedNode.idx;
          const rIdx = side === 'R' ? idx : selectedNode.idx;
          state[lIdx] = rIdx;
          selectedNode = null;
          updateLines();
        }
      };

      const leftEls = [];
      q.pairs.forEach((pair, i) => {
        const el = document.createElement('div');
        el.className = 'match-item match-left';
        el.textContent = pair.left;
        el.dataset.idx = i;
        el.onclick = () => handleNodeClick('L', el, i);
        leftCol.appendChild(el);
        leftEls.push(el);
      });

      const rightEls = [];
      rightItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'match-item match-right';
        el.textContent = item.text;
        el.dataset.orig = item.origIdx;
        el.onclick = () => handleNodeClick('R', el, item.origIdx);
        rightCol.appendChild(el);
        rightEls.push(el);
      });

      cols.appendChild(leftCol);
      cols.appendChild(rightCol);
      wrapper.appendChild(cols);
      wrapper.appendChild(svg);
      area.appendChild(wrapper);

      setTimeout(updateLines, 50); // wait for layout to draw lines
    }

    drawLine(svg, fromEl, toEl, colorIdx) {
      const colors = ['#f59e0b','#06b6d4','#10b981','#a855f7','#ef4444'];
      const color = colors[colorIdx % colors.length];
      const svgRect  = svg.getBoundingClientRect();
      const fromRect = fromEl.getBoundingClientRect();
      const toRect   = toEl.getBoundingClientRect();

      // Right edge of left item → Left edge of right item
      const x1 = fromRect.right - svgRect.left;
      const y1 = fromRect.top - svgRect.top + fromRect.height / 2;
      const x2 = toRect.left - svgRect.left;
      const y2 = toRect.top - svgRect.top + toRect.height / 2;

      // Add arrowhead marker if not present
      const markerId = `arrow-${colorIdx}`;
      if (!svg.querySelector(`#${markerId}`)) {
        const defs = svg.querySelector('defs') || (() => { const d = document.createElementNS('http://www.w3.org/2000/svg','defs'); svg.insertBefore(d, svg.firstChild); return d; })();
        defs.innerHTML += `<marker id="${markerId}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${color}"/></marker>`;
      }

      // Curved bezier path
      const cx1 = x1 + (x2 - x1) * 0.55;
      const cx2 = x2 - (x2 - x1) * 0.55;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '3');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('marker-end', `url(#${markerId})`);
      path.style.animation = 'dashDraw 0.5s ease-out forwards';
      svg.appendChild(path);
    }

    renderFillBank(q, area, savedAnswer) {
      const state = savedAnswer ? [...savedAnswer] : new Array(q.blanks).fill(null);
      
      let sentenceHTML = q.text;
      for (let i = 0; i < q.blanks; i++) {
        const val = state[i];
        const cssClass = val ? 'fill-blank filled' : 'fill-blank';
        const txt = val || (q.blankLabels && q.blankLabels[i] ? q.blankLabels[i] : '___');
        sentenceHTML = sentenceHTML.replace('___', `<span class="${cssClass}" id="blank-${i}" data-idx="${i}">${txt}</span>`);
      }

      const sentEl = document.createElement('div');
      sentEl.className = 'fill-sentence';
      sentEl.innerHTML = sentenceHTML;

      if (q.image) {
        const imgEl = document.createElement('div');
        imgEl.className = 'q-img-wrap';
        imgEl.innerHTML = `<img src="${q.image}" alt="hint" loading="lazy">`;
        area.appendChild(imgEl);
      }
      area.appendChild(sentEl);

      const bank = document.createElement('div');
      bank.className = 'word-bank';
      // keep bank order consistent
      const bankWords = [...q.wordBank].sort();

      const renderBank = () => {
        bank.innerHTML = '';
        bankWords.forEach(word => {
          const used = state.includes(word);
          const tile = document.createElement('div');
          tile.className = 'word-tile' + (used ? ' used' : '');
          tile.textContent = word;
          tile.onclick = () => {
            if (used) return;
            const emptyIdx = state.indexOf(null);
            if (emptyIdx === -1) return;
            state[emptyIdx] = word;
            this.app.playClick();
            updateUI();
          };
          bank.appendChild(tile);
        });
      };

      const updateUI = () => {
        renderBank();
        for (let i = 0; i < q.blanks; i++) {
          const blankEl = area.querySelector(`#blank-${i}`);
          if(blankEl) {
            const val = state[i];
            blankEl.textContent = val || (q.blankLabels && q.blankLabels[i] ? q.blankLabels[i] : '___');
            blankEl.className = val ? 'fill-blank filled' : 'fill-blank';
            blankEl.onclick = () => {
              if (state[i]) {
                state[i] = null;
                this.app.playClick();
                updateUI();
              }
            };
          }
        }
        if (state.every(v => v !== null)) this.app.setAnswer([...state]);
        else this.app.setAnswer(null); // unset if incomplete
      };

      updateUI();
      area.appendChild(bank);
    }

    renderAudioID(q, area, savedAnswer) {
      const audioWrap = document.createElement('div');
      audioWrap.style.textAlign = 'center';
      audioWrap.style.marginBottom = '20px';
      
      const audioEl = document.createElement('audio');
      audioEl.controls = true;
      audioEl.src = q.audio;
      audioWrap.appendChild(audioEl);
      area.appendChild(audioWrap);

      this.renderMCQ(q, area, savedAnswer);
    }

    renderCalc(q, area, savedAnswer) {
      if (q.image) {
        area.innerHTML = `<div class="q-img-wrap"><img src="${q.image}" alt="" loading="lazy"></div>`;
      }
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
        <div class="calc-formula">${q.formula}</div>
        ${q.given ? `<div class="calc-givens">${givensHTML}</div>` : ''}
        ${q.find ? `<div class="calc-find">🔍 Find: <strong style="color:var(--accent)">${q.find.symbol}</strong> in <strong>${q.find.unit}</strong></div>` : ''}
        <br>
        <button class="calc-hint-btn" onclick="this.nextElementSibling.classList.toggle('show')">💡 Show Hint</button>
        <div class="calc-hint">${q.hint}</div>
      `;
      area.appendChild(card);
      this.renderMCQ(q, area, savedAnswer);
    }

    renderArduinoIDE(q, area, savedAnswer) {
      if (q.image) area.innerHTML = `<div class="q-img-wrap"><img src="${q.image}" style="max-height:100px;" loading="lazy"></div>`;
      
      const ide = document.createElement('div');
      ide.className = 'ide-window';
      ide.innerHTML = `
        <div class="ide-titlebar">
          <div class="ide-dot red"></div><div class="ide-dot yellow"></div><div class="ide-dot green"></div>
          <span class="ide-filename">blink_led.ino — Arduino IDE</span>
        </div>
        <div class="ide-code">${q.codeLines.map((ln, i) => {
          if (ln.type === 'empty') return `<div class="code-line"><span class="code-ln">${i+1}</span><span class="code-txt">&nbsp;</span></div>`;
          const txt = ln.type === 'blank'
            ? ln.text.replace('________', `<span class="kw-blank" id="ide-blank">${savedAnswer !== null ? q.options[savedAnswer] : '______'}</span>`)
            : ln.text.replace(/\b(void)\b/g, '<span class="kw-void">void</span>').replace(/\b(setup|loop|digitalWrite|pinMode|delay)\b/g, '<span class="kw-fn">$1</span>').replace(/\b(\d+)\b/g, '<span class="kw-num">$1</span>');
          return `<div class="code-line"><span class="code-ln">${i+1}</span><span class="code-txt">${txt}</span></div>`;
        }).join('')}</div>`;
      area.appendChild(ide);

      const opts = document.createElement('div');
      opts.className = 'ide-opts';
      const letters = ['A','B','C','D'];
      q.options.forEach((opt, i) => {
        const el = document.createElement('div');
        el.className = 'ide-opt' + (savedAnswer === i ? ' selected' : '');
        el.innerHTML = `<span class="opt-letter">${letters[i]}</span><code>${opt}</code>`;
        el.onclick = () => {
          this.app.playClick();
          opts.querySelectorAll('.ide-opt').forEach(o => o.classList.remove('selected'));
          el.classList.add('selected');
          const blank = document.getElementById('ide-blank');
          if (blank) blank.textContent = opt;
          this.app.setAnswer(i);
        };
        opts.appendChild(el);
      });
      area.appendChild(opts);
    }

    renderAI(q, area, savedAnswer) {
      const scene = document.createElement('div');
      scene.className = 'ai-scene';
      scene.innerHTML = `
        <div class="ai-bot-wrap"><div class="ai-avatar">🤖</div></div>
        <div class="ai-bubble">
          <div class="ai-name">✨ ${q.aiName}</div>
          <div class="ai-q-text">${q.text}</div>
          <div class="ai-hint">${q.aiHint}</div>
        </div>`;
      area.appendChild(scene);
      // Force emoji variant for AI questions (options are {text, emoji} objects)
      const qWithEmoji = { ...q, variant: 'emoji' };
      this.renderMCQ(qWithEmoji, area, savedAnswer);
    }
    
    renderPicto(q, area, savedAnswer) {
      const state = savedAnswer ? [...savedAnswer] : [];
      
      const gifWrap = document.createElement('div');
      gifWrap.style.textAlign = 'center';
      gifWrap.innerHTML = `<img src="${q.image}" alt="Picto" class="picto-gif">
        <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px;">${q.instruction}</p>`;
      area.appendChild(gifWrap);

      const layout = document.createElement('div');
      layout.className = 'picto-layout';

      const paletteWrap = document.createElement('div');
      paletteWrap.className = 'picto-palette-wrap';
      paletteWrap.innerHTML = '<div class="picto-section-label">🎨 Palette</div>';
      const palette = document.createElement('div');
      palette.className = 'picto-palette';
      
      const codeWrap = document.createElement('div');
      codeWrap.className = 'picto-code-wrap';
      codeWrap.innerHTML = '<div class="picto-section-label">📋 Your Code</div>';
      const codeArea = document.createElement('div');
      codeArea.className = 'picto-code-area';

      const updateUI = () => {
        palette.innerHTML = '';
        codeArea.innerHTML = '';
        
        q.palette.forEach(block => {
          const used = state.includes(block.id);
          const el = document.createElement('div');
          el.className = 'picto-palette-block' + (used ? ' used' : '');
          el.style.borderColor = block.color + '88';
          el.innerHTML = `<span>${block.icon}</span><span>${block.label}</span>`;
          el.onclick = () => {
            if(!used) { state.push(block.id); this.app.playClick(); updateUI(); }
          };
          palette.appendChild(el);
        });

        if (state.length === 0) {
          codeArea.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:20px;">← Click blocks to add</p>';
        } else {
          state.forEach((id, idx) => {
            const block = q.palette.find(b => b.id === id);
            const placed = document.createElement('div');
            placed.className = 'picto-placed-block';
            placed.style.borderLeft = `4px solid ${block.color}`;
            placed.innerHTML = `<div class="placed-block-num">${idx+1}</div><span>${block.icon} ${block.label}</span><span class="remove-block">✕</span>`;
            placed.querySelector('.remove-block').onclick = () => {
              state.splice(idx, 1);
              this.app.playClick();
              updateUI();
            };
            codeArea.appendChild(placed);
          });
          this.app.setAnswer([...state]);
        }
      };

      updateUI();
      paletteWrap.appendChild(palette);
      codeWrap.appendChild(codeArea);
      layout.appendChild(paletteWrap);
      layout.appendChild(codeWrap);
      area.appendChild(layout);
    }

    renderResistorBand(q, area, savedAnswer) {
      const COLORS = [
        { name:'Black',  hex:'#1a1a1a', val:0, mult:1 },
        { name:'Brown',  hex:'#8B4513', val:1, mult:10 },
        { name:'Red',    hex:'#e53e3e', val:2, mult:100 },
        { name:'Orange', hex:'#ed8936', val:3, mult:1000 },
        { name:'Yellow', hex:'#ecc94b', val:4, mult:10000 },
        { name:'Green',  hex:'#38a169', val:5, mult:100000 },
        { name:'Blue',   hex:'#3182ce', val:6, mult:1000000 },
        { name:'Violet', hex:'#805ad5', val:7, mult:10 },
        { name:'Grey',   hex:'#718096', val:8, mult:1 },
        { name:'White',  hex:'#f7fafc', val:9, mult:1 }
      ];
      const TOLERANCE = [
        { name:'Gold ±5%',   hex:'#d4af37' },
        { name:'Silver ±10%',hex:'#a0a0a0' }
      ];

      const state = savedAnswer ? {...savedAnswer} : { b1: null, b2: null, b3: null, tol: null };

      const wrapper = document.createElement('div');
      wrapper.className = 'resistor-band-wrap';

      // Visual resistor body
      wrapper.innerHTML = `
        <div class="resistor-visual">
          <div class="res-wire res-wire-l"></div>
          <div class="res-body">
            <div class="res-band" id="rband-1" style="background:${state.b1?.hex || '#333'}"></div>
            <div class="res-band" id="rband-2" style="background:${state.b2?.hex || '#333'}"></div>
            <div class="res-band" id="rband-3" style="background:${state.b3?.hex || '#333'}"></div>
            <div class="res-band res-tol" id="rband-tol" style="background:${state.tol?.hex || '#d4af37'}"></div>
          </div>
          <div class="res-wire res-wire-r"></div>
        </div>
        <div class="res-value-display" id="res-val-display">
          <span class="res-val-label">Resistance:</span>
          <span class="res-val-number" id="res-calc-val">? Ω</span>
        </div>
        <div class="resistor-band-legend">
          <div class="rbl-item"><span class="rbl-dot" style="background:#c084fc"></span> Band 1 &amp; 2 = Digits</div>
          <div class="rbl-item"><span class="rbl-dot" style="background:#06b6d4"></span> Band 3 = Multiplier</div>
          <div class="rbl-item"><span class="rbl-dot" style="background:#d4af37"></span> Band 4 = Tolerance</div>
        </div>
      `;

      const updateResValue = () => {
        const el = wrapper.querySelector('#res-calc-val');
        if (!el) return;
        if (!state.b1 || !state.b2 || !state.b3) { el.textContent = '? Ω'; return; }
        const raw = (state.b1.val * 10 + state.b2.val) * state.b3.mult;
        el.textContent = raw >= 1000000 ? `${(raw/1000000).toFixed(1)} MΩ` :
                         raw >= 1000    ? `${(raw/1000).toFixed(1)} kΩ` : `${raw} Ω`;
        wrapper.querySelector('#rband-1').style.background = state.b1.hex;
        wrapper.querySelector('#rband-2').style.background = state.b2.hex;
        wrapper.querySelector('#rband-3').style.background = state.b3.hex;
        if (state.tol) wrapper.querySelector('#rband-tol').style.background = state.tol.hex;
        // Check answer
        if (state.b1 && state.b2 && state.b3 && state.tol) {
          const encoded = `${state.b1.name}|${state.b2.name}|${state.b3.name}|${state.tol.name}`;
          this.app.setAnswer(encoded);
        }
      };

      area.appendChild(wrapper);

      const makeSection = (label, colors, stateKey) => {
        const sec = document.createElement('div');
        sec.className = 'rband-section';
        sec.innerHTML = `<div class="rband-section-label">${label}</div>`;
        const grid = document.createElement('div');
        grid.className = 'rband-color-grid';
        colors.forEach(c => {
          const chip = document.createElement('div');
          chip.className = 'rband-chip' + (state[stateKey]?.name === c.name ? ' selected' : '');
          chip.style.background = c.hex;
          chip.title = c.name + (c.val !== undefined ? ` (${c.val})` : '');
          chip.innerHTML = `<span class="rband-chip-label">${c.name.split(' ')[0]}</span>`;
          chip.onclick = () => {
            state[stateKey] = c;
            grid.querySelectorAll('.rband-chip').forEach(x => x.classList.remove('selected'));
            chip.classList.add('selected');
            this.app.playClick();
            updateResValue();
          };
          grid.appendChild(chip);
        });
        sec.appendChild(grid);
        return sec;
      };

      const palette = document.createElement('div');
      palette.className = 'rband-palette';
      palette.appendChild(makeSection('🎨 Band 1 (First Digit)', COLORS, 'b1'));
      palette.appendChild(makeSection('🎨 Band 2 (Second Digit)', COLORS, 'b2'));
      palette.appendChild(makeSection('✖️ Band 3 (Multiplier)', COLORS.slice(0,8), 'b3'));
      palette.appendChild(makeSection('📏 Band 4 (Tolerance)', TOLERANCE, 'tol'));
      area.appendChild(palette);

      updateResValue();
    }
  }

  // Init App when data is loaded
  const initApp = () => {
    const checkData = setInterval(() => {
      if (typeof window.BEGINNER_QUESTIONS !== 'undefined') {
        clearInterval(checkData);
        window.app = new AssessmentApp(window.BEGINNER_QUESTIONS);
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
