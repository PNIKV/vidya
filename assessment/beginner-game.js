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
      this._examActive = false;

      this.initEvents();
      this.initBackground();

      // Check if there's an in-progress exam from a page refresh
      if (!this.checkResumableExam()) {
        this.showView('landing');
      }
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
      const skipFn = () => { this.skipQuestion(); };

      $('btn-next-side')?.addEventListener('click', nextFn);
      $('btn-next-mobile')?.addEventListener('click', nextFn);
      $('btn-prev-side')?.addEventListener('click', prevFn);
      $('btn-prev-mobile')?.addEventListener('click', prevFn);
      $('btn-skip-side')?.addEventListener('click', skipFn);
      $('btn-skip-mobile')?.addEventListener('click', skipFn);

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
      this._examActive = true;

      // Save exam state to sessionStorage for recovery on refresh
      this.saveExamState();

      // Warn before leaving during exam
      this._beforeUnloadHandler = (e) => {
        e.preventDefault();
        e.returnValue = 'You have an exam in progress. If you leave, your answers will be auto-submitted.';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', this._beforeUnloadHandler);

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
      // Persist answers to sessionStorage
      this.saveExamState();
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

      const skipSide = $('btn-skip-side');
      const skipMob = $('btn-skip-mobile');
      if (skipSide) skipSide.classList.remove('hidden');
      if (skipMob) skipMob.classList.remove('hidden');
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

    // Skip — advance without requiring an answer (leaves answer as null)
    skipQuestion() {
      this.playClick();
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
      this._examActive = false;

      // Clear sessionStorage exam data
      sessionStorage.removeItem('stemquest_exam');

      // Remove beforeunload warning
      if (this._beforeUnloadHandler) {
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
        this._beforeUnloadHandler = null;
      }

      this.showView('results');
      
      const { total } = this.calculateScore();
      this.state.score = total;

      $('res-name').textContent = `🎉 Champion ${this.state.studentData.name}! You Won 1st Place! 🏆`;

      if ($('res-grade')) {
        $('res-grade').textContent = `🥇 STEM QUEST WINNER 🥇`;
      }
      if ($('res-pct')) {
        $('res-pct').textContent = `Awesome performance! You completed the challenge like a true STEM Star! ⭐`;
      }
      if ($('res-score')) {
        $('res-score').textContent = `Total Points Earned: ${total}`;
      }

      // Trigger download immediately
      this.downloadCSV();
    }

    // ─── Exam State Persistence (sessionStorage) ──────────────
    saveExamState() {
      try {
        const examState = {
          studentData: this.state.studentData,
          answers: this.state.answers,
          questionIds: this.questions.map(q => q.id),
          idx: this.state.idx,
          startTime: this._examStartTime || Date.now()
        };
        this._examStartTime = examState.startTime;
        sessionStorage.setItem('stemquest_exam', JSON.stringify(examState));
      } catch (e) {
        console.warn('Could not save exam state:', e);
      }
    }

    checkResumableExam() {
      try {
        const saved = sessionStorage.getItem('stemquest_exam');
        if (!saved) return false;

        const examState = JSON.parse(saved);
        if (!examState.studentData || !examState.studentData.name || !examState.questionIds) {
          sessionStorage.removeItem('stemquest_exam');
          return false;
        }

        // Restore student data
        this.state.studentData = examState.studentData;

        // Restore question order by matching IDs
        const idMap = {};
        this.questions.forEach(q => { idMap[q.id] = q; });
        const orderedQuestions = examState.questionIds.map(id => idMap[id]).filter(Boolean);

        if (orderedQuestions.length === 0) {
          sessionStorage.removeItem('stemquest_exam');
          return false;
        }

        this.questions = orderedQuestions;
        this.state.answers = examState.answers || new Array(this.questions.length).fill(null);
        this.state.idx = examState.idx || 0;

        // Auto-submit: finish the quest immediately with whatever answers were recorded
        console.log('[STEM Quest] Exam in progress detected after page refresh. Auto-submitting...');
        this.finishQuest();
        return true;
      } catch (e) {
        console.warn('Could not restore exam state:', e);
        sessionStorage.removeItem('stemquest_exam');
        return false;
      }
    }

    downloadCSV() {
      const { total, max } = this.calculateScore();
      const pct = Math.round((total / max) * 100) || 0;
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Row 1: Main Headers
      let headerRow1 = ['Timestamp', 'Student Name', 'Grade', 'School/College'];
      let headerRow2 = ['', '', '', 'Max Marks Per Question:'];

      this.questions.forEach((q, i) => {
        const qText = q.text ? q.text.replace(/"/g, '""').replace(/\n/g, ' ') : `Question ${i + 1}`;
        headerRow1.push(`"Q${i + 1}: ${qText}"`);
        headerRow2.push(`"${q.marks || 1} Marks"`);
      });

      headerRow1.push('Total Score');
      headerRow1.push('Percentage');
      headerRow2.push(`"${max} Max"`);
      headerRow2.push('100%');

      // Student Answer Row Data
      let dataRow = [
        `"${timestamp}"`,
        `"${this.state.studentData.name}"`,
        `"${this.state.studentData.grade}"`,
        `"${this.state.studentData.school}"`
      ];

      this.questions.forEach((q, idx) => {
        const ans = this.state.answers[idx];
        let val = 'Unanswered';
        if (ans !== null && ans !== undefined) {
          if (q.type === 'match' && typeof ans === 'object') {
            const pairsText = [];
            for (let lIdx in ans) {
              const rIdx = ans[lIdx];
              const leftText = q.pairs[lIdx] ? q.pairs[lIdx].left : `L${lIdx}`;
              const rightText = q.pairs[rIdx] ? q.pairs[rIdx].right : (q.pairs[lIdx] ? q.pairs[lIdx].right : `R${rIdx}`);
              pairsText.push(`${leftText} -> ${rightText}`);
            }
            val = pairsText.join(' | ') || 'None';
          } else if (q.type === 'mcq' || q.type === 'calc' || q.type === 'arduino_ide' || q.type === 'audio_id') {
            if (typeof ans === 'number' && q.options && q.options[ans]) {
              val = typeof q.options[ans] === 'object' ? q.options[ans].text : q.options[ans];
            } else {
              val = ans.toString();
            }
          } else if (Array.isArray(ans)) {
            val = ans.join(' | ');
          } else if (typeof ans === 'object') {
            val = JSON.stringify(ans);
          } else {
            val = ans.toString();
          }
        }
        val = val.replace(/"/g, '""').replace(/\n/g, ' ');
        dataRow.push(`"${val}"`);
      });

      dataRow.push(total);
      dataRow.push(`${pct}%`);

      // Summary / Benchmark Row
      let summaryRow = ['"Summary / Max Total"', '"Class Benchmark"', '""', '""'];
      this.questions.forEach((q) => {
        summaryRow.push(`"${q.marks || 1}"`);
      });
      summaryRow.push(`"${total} / ${max}"`);
      summaryRow.push(`"${pct}%"`);

      const csvRows = [
        headerRow1.join(','),
        headerRow2.join(','),
        dataRow.join(','),
        summaryRow.join(',')
      ];

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `STEM_Quest_${this.state.studentData.name.replace(/\s+/g,'_')}_${new Date().toISOString().substring(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // ─── SHA-256 Teacher Login ───────────────────────────────────
    // Password: Niktrix  →  SHA-256 hash below
    static get TEACHER_HASH() {
      return 'b14281344159aa5f3b2e8f314d2ca1d7da8472de8c07c55d4e42e3529b6ca890';
    }

    async sha256(text) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    showTeacherLogin() {
      // Build modal overlay
      const existing = document.getElementById('teacher-login-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'teacher-login-modal';
      modal.style.cssText = `
        position:fixed;inset:0;z-index:900;background:rgba(0,0,0,0.82);
        display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);
      `;
      modal.innerHTML = `
        <div style="background:linear-gradient(135deg,#0f0f23,#1a1a3e);border:2px solid rgba(124,58,237,0.6);
          border-radius:24px;padding:36px 40px;max-width:420px;width:90%;box-shadow:0 0 60px rgba(124,58,237,0.3);text-align:center;">
          <div style="font-size:3rem;margin-bottom:8px;">🔐</div>
          <h2 style="font-family:var(--font-game);color:#fff;font-size:1.6rem;margin-bottom:6px;">Teacher Access</h2>
          <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:24px;">Enter the admin password to view the dashboard.</p>
          <input type="password" id="teacher-modal-pass" placeholder="Password"
            style="width:100%;padding:14px 18px;border-radius:12px;border:2px solid rgba(124,58,237,0.5);
            background:rgba(255,255,255,0.07);color:#fff;font-size:1.1rem;font-family:var(--font-body);
            outline:none;box-sizing:border-box;margin-bottom:16px;"
            autofocus>
          <p id="teacher-modal-err" style="color:#f87171;font-size:0.85rem;min-height:1.2em;margin-bottom:12px;"></p>
          <div style="display:flex;gap:12px;justify-content:center;">
            <button id="teacher-modal-cancel" style="padding:12px 24px;border-radius:12px;border:2px solid rgba(255,255,255,0.2);
              background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;font-family:var(--font-game);font-size:1rem;">Cancel</button>
            <button id="teacher-modal-enter" style="padding:12px 28px;border-radius:12px;border:none;
              background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;cursor:pointer;
              font-family:var(--font-game);font-size:1rem;box-shadow:0 4px 18px rgba(124,58,237,0.4);">🔓 Enter</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const passInput = document.getElementById('teacher-modal-pass');
      const errEl = document.getElementById('teacher-modal-err');

      const tryLogin = async () => {
        const hash = await this.sha256(passInput.value);
        if (hash === AssessmentApp.TEACHER_HASH) {
          modal.remove();
          this.playOK();
          this.openTeacherDashboard();
        } else {
          errEl.textContent = '❌ Incorrect password. Try again.';
          passInput.value = '';
          passInput.focus();
        }
      };

      document.getElementById('teacher-modal-enter').onclick = tryLogin;
      document.getElementById('teacher-modal-cancel').onclick = () => modal.remove();
      passInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
    }

    openTeacherDashboard() {
      this.showView('teacher');
      this.loadLeaderboard();
      this.loadQuestionBank();

      // Tab navigation
      const btnLeaderboard = document.getElementById('btn-tnav-leaderboard') || document.getElementById('btn-tab-leaderboard');
      const btnQbank = document.getElementById('btn-tnav-qbank') || document.getElementById('btn-tab-qbank');

      btnLeaderboard?.addEventListener('click', () => {
        document.getElementById('panel-teacher-leaderboard')?.classList.remove('hidden');
        document.getElementById('panel-teacher-qbank')?.classList.add('hidden');
      });
      btnQbank?.addEventListener('click', () => {
        document.getElementById('panel-teacher-leaderboard')?.classList.add('hidden');
        document.getElementById('panel-teacher-qbank')?.classList.remove('hidden');
      });

      document.getElementById('btn-teacher-back')?.addEventListener('click', () => {
        this.showView('landing');
      });

      // CSV export
      const csvBtn = document.getElementById('btn-teacher-csv-export') || document.getElementById('btn-teacher-csv');
      csvBtn?.addEventListener('click', async () => {
        if (!this._leaderboardData) await this.loadLeaderboard();
        this.exportLeaderboardCSV();
      });

      // Question Bank CSV export
      const qbankCsvBtn = document.getElementById('btn-qbank-csv');
      qbankCsvBtn?.addEventListener('click', () => {
        this.exportQuestionBankCSV();
      });

      // Question Bank PDF export
      const qbankPdfBtn = document.getElementById('btn-qbank-pdf');
      qbankPdfBtn?.addEventListener('click', () => {
        this.downloadQuestionBankPDF();
      });
    }

    async loadLeaderboard() {
      const tbody = document.getElementById('teacher-tbody');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-dim)">Loading...</td></tr>';

      // Load compiled JSON from server
      let jsonRecords = [];
      try {
        const res = await fetch('./data/leaderboard-data.json');
        if (res.ok) jsonRecords = await res.json();
      } catch (e) {
        console.debug('Leaderboard JSON not found, using localStorage only.');
      }

      // Merge with localStorage live results
      const lsRecords = JSON.parse(localStorage.getItem('stemquest_results') || '[]').map(r => ({
        date: r.date || new Date().toISOString(),
        name: r.student?.name || 'Unknown',
        grade: r.student?.grade || '-',
        school: r.student?.school || '-',
        totalScore: r.score || 0,
        maxScore: r.maxScore || 100,
        percentage: r.percentage || Math.round((r.score / (r.maxScore || 1)) * 100),
        categoryScores: r.categoryBreakdown || {}
      }));

      const all = [...jsonRecords, ...lsRecords];
      // Sort chronologically – older first
      all.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Store for CSV export
      this._leaderboardData = all;

      if (all.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-dim)">No student records found.</td></tr>';
        return;
      }

      tbody.innerHTML = all.map((r, i) => {
        const pct = r.percentage || 0;
        const pctColor = pct >= 75 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';
        let dateDisplay = r.date || '-';
        try {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            dateDisplay = d.toLocaleString('en-IN', { hour12: false });
          }
        } catch (_) {}

        return `<tr>
          <td style="color:var(--text-dim)">${i + 1}</td>
          <td style="color:var(--text-dim);font-size:0.85rem">${dateDisplay}</td>
          <td style="font-weight:700;color:#fff">${r.name}</td>
          <td style="color:var(--text-dim)">${r.grade}</td>
          <td style="color:var(--text-dim);font-size:0.85rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${r.school}">${r.school}</td>
          <td style="font-weight:700;color:var(--accent)">${r.totalScore} / ${r.maxScore}</td>
          <td style="font-weight:800;color:${pctColor}">${pct}%</td>
        </tr>`;
      }).join('');
    }

    loadQuestionBank() {
      const container = document.getElementById('teacher-qbank-container');
      if (!container) return;
      if (!this.questions || this.questions.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim)">No questions available.</p>';
        return;
      }

      const typeColors = {
        mcq: '#818cf8', true_false: '#06b6d4', match: '#f59e0b',
        fill_bank: '#10b981', calc: '#f43f5e', arduino_ide: '#fb923c',
        audio_id: '#a78bfa', picto: '#34d399', ai_question: '#fbbf24', image_id: '#60a5fa'
      };

      container.innerHTML = this.questions.map((q, i) => {
        const color = typeColors[q.type] || '#94a3b8';
        const qText = q.text || `Question ${i + 1}`;
        let optsHtml = '';
        if (q.options) {
          optsHtml = `<ol style="margin:4px 0 0 16px;padding:0;color:#94a3b8;font-size:0.82rem;">
            ${q.options.map((o, oi) => {
              const text = typeof o === 'object' ? o.text : o;
              const isAns = oi === q.answer;
              return `<li style="${isAns ? 'color:#4ade80;font-weight:700;' : ''}">${text}${isAns ? ' ✓' : ''}</li>`;
            }).join('')}
          </ol>`;
        } else if (q.pairs) {
          optsHtml = `<div style="margin-top:4px;font-size:0.82rem;color:#94a3b8;">
            ${q.pairs.map(p => `• <b>${p.left}</b> → ${p.right}`).join('<br>')}
          </div>`;
        }
        return `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
          border-radius:12px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;">
          <div style="min-width:32px;height:32px;border-radius:50%;background:${color}22;border:2px solid ${color};
            display:flex;align-items:center;justify-content:center;font-family:var(--font-game);
            font-size:0.8rem;color:${color};font-weight:800;">${q.id || (i + 1)}</div>
          <div style="flex:1;">
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
              <span style="font-size:0.72rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;
                padding:2px 10px;border-radius:12px;background:${color}22;color:${color};border:1px solid ${color}44">${q.type}</span>
              <span style="font-size:0.72rem;color:var(--text-dim);">${q.marks || 1} mark${(q.marks || 1) > 1 ? 's' : ''}</span>
            </div>
            <p style="margin:0;color:#e2e8f0;font-size:0.9rem;line-height:1.4;">${qText}</p>
            ${optsHtml}
          </div>
        </div>`;
      }).join('');
    }

    exportLeaderboardCSV() {
      const all = this._leaderboardData;
      if (!all || all.length === 0) {
        alert('No leaderboard data loaded yet. Please wait for the leaderboard to finish loading and try again.');
        return;
      }

      const rows = [
        ['"Timestamp"', '"Student Name"', '"Grade"', '"School/College"',
         '"MCQ"', '"TF"', '"Match"', '"Fill Blank"', '"Calc"',
         '"Arduino IDE"', '"Audio ID"', '"Picto"', '"AI Question"', '"Image ID"',
         '"Score"', '"%"']
      ];

      all.forEach(r => {
        const cs = r.categoryScores || {};
        let formattedDate = r.date || '-';
        try {
          const d = new Date(r.date);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleString('en-IN', { hour12: false });
          }
        } catch (_) {}

        rows.push([
          `"${formattedDate}"`,
          `"${(r.name || '').replace(/"/g, '""')}"`,
          `"${(r.grade || '').replace(/"/g, '""')}"`,
          `"${(r.school || '').replace(/"/g, '""')}"`,
          cs.mcq || 0,
          cs.true_false || cs.tf || 0,
          cs.match || 0,
          cs.fill_bank || cs.fill_blank || 0,
          cs.calc || 0,
          cs.arduino_ide || 0,
          cs.audio_id || 0,
          cs.picto || 0,
          cs.ai_question || 0,
          cs.image_id || 0,
          `"${r.totalScore || 0}/${r.maxScore || 100}"`,
          `"${r.percentage || 0}%"`
        ]);
      });

      const csvContent = '\uFEFF' + rows.map(row => row.join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `STEM-Quest-Leaderboard-${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    exportQuestionBankCSV() {
      if (!this.questions || this.questions.length === 0) {
        alert('Question bank not loaded.');
        return;
      }
      const rows = [['"#"',' "Type"', '"Question"', '"Options / Pairs"', '"Correct Answer"', '"Marks"']];
      this.questions.forEach((q, i) => {
        let opts = '';
        let ans = '';
        if (q.options) {
          opts = q.options.map(o => typeof o === 'object' ? o.text : o).join(' | ');
          if (typeof q.answer === 'number') {
            const opt = q.options[q.answer];
            ans = typeof opt === 'object' ? opt.text : opt;
          } else {
            ans = String(q.answer);
          }
        } else if (q.pairs) {
          opts = q.pairs.map(p => `${p.left} -> ${p.right}`).join(' | ');
          ans = 'All matched correctly';
        } else if (q.answer) {
          ans = Array.isArray(q.answer) ? q.answer.join(', ') : String(q.answer);
        }
        rows.push([
          i + 1,
          `"${q.type || ''}"`,
          `"${(q.text || '').replace(/"/g, '""')}"`,
          `"${opts.replace(/"/g, '""')}"`,
          `"${ans.replace(/"/g, '""')}"`,
          q.marks || 1
        ]);
      });

      const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `STEM-Quest-QuestionBank-${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    downloadQuestionBankPDF() {
      if (!this.questions || this.questions.length === 0) {
        alert('Question bank not loaded.');
        return;
      }

      const typeLabels = {
        mcq: '🔵 MCQ', multiple_choice: '🔵 MCQ',
        true_false: '✅ True/False',
        fill_bank: '✏️ Fill Blank', fill_in_the_blank: '✏️ Fill Blank',
        match: '🔗 Match', match_the_following: '🔗 Match',
        image_selection: '🖼️ Image ID', image_id: '🖼️ Image ID',
        audio_recognition: '🔊 Audio ID', audio_id: '🔊 Audio ID',
        calc: '🧮 Calculation', arduino_ide: '💻 Arduino IDE',
        picto: '🎨 Pictogram', ai_question: '🤖 AI & Robotics'
      };

      const questionsHTML = this.questions.map((q, i) => {
        const label = typeLabels[q.type] || q.type || 'STEM Question';
        const qText = (q.text || `Question ${i + 1}`).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let mediaHtml = '';
        const imgUrl = q.image || q.media_url;
        if (imgUrl) {
          mediaHtml = `<img src="${imgUrl}" style="max-height: 180px; max-width: 100%; border-radius: 8px; margin: 10px 0; border: 1px solid #cbd5e1; object-fit: contain; display: block;" />`;
        }

        let answerHTML = '';
        if (q.type === 'image_selection') {
          if (q.options && q.options.length) {
            answerHTML = '<div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">' +
              q.options.map((opt, oi) => {
                const isCorrect = oi === q.answer;
                return `<div class="${isCorrect ? 'correct-ans' : 'incorrect-ans'}" style="border: 2px solid ${isCorrect ? '#16a34a' : '#e2e8f0'}; padding: 6px; border-radius: 8px; text-align:center; background:${isCorrect ? '#f0fdf4' : '#fff'}; min-width: 100px;">
                  <img src="${opt}" style="max-height:80px; max-width: 100%; display:block; border-radius:4px; margin:0 auto 4px; object-fit: contain;" />
                  <span style="font-size:0.75rem; font-weight: ${isCorrect ? 'bold' : 'normal'}; color: ${isCorrect ? '#16a34a' : '#64748b'}">Option ${oi + 1} ${isCorrect ? '✓' : ''}</span>
                </div>`;
              }).join('') + '</div>';
          }
        } else if (q.options && q.options.length) {
          answerHTML = '<ol style="margin:8px 0 4px 20px;padding:0;">' +
            q.options.map((opt, oi) => {
              const optText = typeof opt === 'object' ? (opt.text || opt.label || '') : opt;
              const emoji = typeof opt === 'object' && opt.emoji ? `${opt.emoji} ` : '';
              const isCorrect = oi === q.answer;
              return `<li class="${isCorrect ? 'correct-ans' : 'incorrect-ans'}" style="margin:4px 0; padding: 4px 8px; border-radius: 4px; ${isCorrect ? 'color: #16a34a; font-weight: bold; background-color: #f0fdf4; border: 1px solid #bbf7d0;' : 'color: #334155;'}">${emoji}${optText}${isCorrect ? ' ✓' : ''}</li>`;
            }).join('') + '</ol>';
        } else if (q.pairs) {
          answerHTML = '<ul style="margin:8px 0 4px 16px; padding:0; list-style-type: none;">' +
            q.pairs.map(p => `<li style="color:#16a34a; font-weight:bold; background-color: #f0fdf4; border: 1px solid #bbf7d0; display: inline-block; padding: 4px 12px; margin: 4px; border-radius: 6px;">${p.left} &nbsp;➔&nbsp; ${p.right}</li>`).join('') +
            '</ul>';
        } else if (q.answer !== undefined || q.answers !== undefined) {
          const ansData = q.answer !== undefined ? q.answer : q.answers;
          const correctText = Array.isArray(ansData) ? ansData.join(', ') : ansData;
          answerHTML = `<div style="margin-top:8px; padding: 6px 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; display: inline-block; color: #16a34a; font-weight: bold;">Answer: ${correctText}</div>`;
        }

        return `
          <div class="question-box" style="page-break-inside:avoid; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; background:#ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid #f1f5f9;padding-bottom:6px;">
              <span style="font-size:0.75rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 10px;border-radius:12px;background:#f1f5f9;color:#475569;">${label}</span>
              <span style="font-size:0.8rem;color:#64748b;font-weight:600;">Q${i + 1} &nbsp;(${q.marks || 1} pt${(q.marks || 1) !== 1 ? 's' : ''})</span>
            </div>
            <p style="margin:8px 0;color:#1e293b;font-size:1rem;line-height:1.5;font-weight:600;">${qText}</p>
            ${mediaHtml}
            ${answerHTML}
          </div>`;
      }).join('');

      const printDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.background = '#fff';
      container.style.color = '#1e293b';
      container.style.fontFamily = "'Inter', sans-serif";
      
      container.innerHTML = `
        <div style="margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px;">
          <h1 style="font-size: 2.2rem; color: #1e293b; margin-bottom: 6px; letter-spacing: -0.5px;">📚 STEM Quest — Question Bank</h1>
          <p style="color: #64748b; font-size: 0.95rem;">Generated: ${printDate} &nbsp;|&nbsp; ${this.questions.length} Questions with highlighted answers</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${questionsHTML}
        </div>
        <p style="margin-top:40px;color:#94a3b8;font-size:0.85rem;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">STEM Quest Question Bank &copy; ${new Date().getFullYear()} — Confidential Teacher Copy</p>
      `;

      // Use html2pdf
      const opt = {
        margin:       10,
        filename:     `STEM_Quest_QuestionBank_${new Date().toISOString().substring(0, 10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (window.html2pdf) {
        html2pdf().set(opt).from(container).save();
      } else {
        alert('PDF generator library not loaded. Please try again.');
      }
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

        // Rich dark-to-indigo gradient bg
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#06060f');
        grad.addColorStop(0.5, '#0c0d20');
        grad.addColorStop(1, '#10081c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Warm glow from workbench at the bottom
        const warmGlow = ctx.createLinearGradient(0, h - 230, 0, h);
        warmGlow.addColorStop(0, 'rgba(180,90,30,0)');
        warmGlow.addColorStop(0.6, 'rgba(180,90,30,0.12)');
        warmGlow.addColorStop(1, 'rgba(180,90,30,0.35)');
        ctx.fillStyle = warmGlow;
        ctx.fillRect(0, h - 230, w, 230);

        const ox = offset % GRID;
        const oy = (offset * 0.4) % GRID;

        // Scrolling grid lines
        ctx.strokeStyle = 'rgba(100,80,220,0.07)';
        ctx.lineWidth = 1;
        for (let x = -ox; x < w + GRID; x += GRID) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = -oy; y < h + GRID; y += GRID) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Grid intersection dots
        ctx.fillStyle = 'rgba(120,100,255,0.15)';
        for (let x = -ox; x < w + GRID; x += GRID) {
          for (let y = -oy; y < h + GRID; y += GRID) {
            ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
          }
        }

        // Floating schematic symbols (resistor, capacitor, diode, LED)
        const t = Date.now() * 0.001;
        components.forEach((c, i) => {
          const cx = ((c.x * w + t * 12 * (i % 2 === 0 ? 1 : -1)) % (w + 80)) - 40;
          const cy = ((c.y * h + t * 8 * (i % 3 === 0 ? 1 : -1)) % (h - 240)) + 10;
          if (cy > h - 250) return; // don't draw on workbench area
          ctx.save();
          ctx.translate(cx, cy);
          ctx.globalAlpha = 0.055 + 0.03 * Math.sin(t + i);
          ctx.strokeStyle = ['#fbbf24','#06b6d4','#818cf8','#10b981'][c.type];
          ctx.lineWidth = 1.5;
          if (c.type === 0) { // resistor zigzag
            ctx.beginPath(); ctx.moveTo(-16, 0);
            [-12,-8,-4,0,4,8,12].forEach((xi, ii) => ctx.lineTo(xi, ii%2===0?-7:7));
            ctx.lineTo(16, 0); ctx.stroke();
          } else if (c.type === 1) { // capacitor
            ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(10,0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-10,-9); ctx.lineTo(-10,9); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(10,-9);  ctx.lineTo(10,9);  ctx.stroke();
          } else if (c.type === 2) { // diode triangle
            ctx.beginPath(); ctx.moveTo(-9,8); ctx.lineTo(9,0); ctx.lineTo(-9,-8); ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(9,-8); ctx.lineTo(9,8); ctx.stroke();
          } else { // LED circle
            ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(5,-7); ctx.lineTo(12,-14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(9,-4); ctx.lineTo(16,-11); ctx.stroke();
          }
          ctx.restore();
        });

        // Falling data droplets
        for (let x = -ox; x < w + GRID; x += GRID*2) {
          const py = ((t * 55 + x * 3.7) % (h - 220 + 20)) - 10;
          ctx.fillStyle = 'rgba(6,182,212,0.3)';
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

        this.app.setAnswer(Object.keys(state).length === q.pairs.length ? state : null);
      };

      const removeFloatingLine = () => {
        const floatLine = svg.querySelector('.floating-match-line');
        if (floatLine) floatLine.remove();
      };

      const drawFloatingLine = (e) => {
        if (!selectedNode) return;
        removeFloatingLine();

        const svgRect = svg.getBoundingClientRect();
        const fromRect = selectedNode.el.getBoundingClientRect();
        
        let x1, y1;
        if (selectedNode.side === 'L') {
          x1 = fromRect.right - svgRect.left;
          y1 = fromRect.top - svgRect.top + fromRect.height / 2;
        } else {
          x1 = fromRect.left - svgRect.left;
          y1 = fromRect.top - svgRect.top + fromRect.height / 2;
        }

        const x2 = e.clientX - svgRect.left;
        const y2 = e.clientY - svgRect.top;

        const cx1 = x1 + (x2 - x1) * 0.5;
        const cx2 = x2 - (x2 - x1) * 0.5;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'floating-match-line');
        path.setAttribute('d', `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`);
        path.setAttribute('stroke', '#f59e0b');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-dasharray', '6 4');
        path.setAttribute('fill', 'none');
        path.setAttribute('pointer-events', 'none');
        svg.appendChild(path);
      };

      wrapper.onmousemove = (e) => {
        if (selectedNode) drawFloatingLine(e);
      };

      const handleNodeClick = (side, el, idx) => {
        this.app.playClick();
        
        // If node is already matched, clicking it will unmatch / remove connection
        if (el.classList.contains('matched')) {
          if (side === 'L') {
            delete state[idx];
          } else {
            for (let lKey in state) {
              if (state[lKey] === idx) {
                delete state[lKey];
                break;
              }
            }
          }
          if (selectedNode) {
            selectedNode.el.classList.remove('picked');
            selectedNode = null;
            removeFloatingLine();
          }
          updateLines();
          return;
        }
        
        if (!selectedNode) {
          // Select this node from either column
          selectedNode = { side, el, idx };
          el.classList.add('picked');
        } else {
          // If clicking the exact same node, deselect
          if (selectedNode.el === el) {
            el.classList.remove('picked');
            selectedNode = null;
            removeFloatingLine();
            return;
          }
          // If clicking same side, swap selection
          if (selectedNode.side === side) {
            selectedNode.el.classList.remove('picked');
            el.classList.add('picked');
            selectedNode = { side, el, idx };
            removeFloatingLine();
            return;
          }
          
          // Match made between L and R (or R and L)
          selectedNode.el.classList.remove('picked');
          removeFloatingLine();

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

      // Add glowing dot marker if not present
      const markerId = `glowdot-${colorIdx}`;
      if (!svg.querySelector(`#${markerId}`)) {
        const defs = svg.querySelector('defs') || (() => { const d = document.createElementNS('http://www.w3.org/2000/svg','defs'); svg.insertBefore(d, svg.firstChild); return d; })();
        defs.innerHTML += `<marker id="${markerId}" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><circle cx="5" cy="5" r="4" fill="${color}" stroke="#ffffff" stroke-width="1.5"/></marker>`;
      }

      // Curved bezier path
      const cx1 = x1 + (x2 - x1) * 0.55;
      const cx2 = x2 - (x2 - x1) * 0.55;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '4');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('marker-end', `url(#${markerId})`);
      path.setAttribute('marker-start', `url(#${markerId})`);
      path.style.filter = `drop-shadow(0 0 8px ${color})`;
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
