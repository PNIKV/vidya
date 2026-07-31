// GAMIFIED assessment.js

// SHA-256 utility — module scope so it can be used anywhere in this file
async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Audio Elements ---
    const bgm = document.getElementById('bgm');
    const sfxCorrect = document.getElementById('sfx-correct');
    const sfxWrong = document.getElementById('sfx-wrong');
    const sfxClick = document.getElementById('sfx-click');
    bgm.volume = 0.2;
    let isMusicPlaying = false;

    const playClick = () => {
        sfxClick.currentTime = 0;
        sfxClick.play().catch(e => { });
    };

    const toggleMusic = () => {
        if (isMusicPlaying) {
            bgm.pause();
            document.getElementById('music-toggle').innerHTML = '<i class="fa-solid fa-music"></i>';
        } else {
            bgm.play().catch(e => console.log("Audio autoplay blocked until interaction."));
            document.getElementById('music-toggle').innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        }
        isMusicPlaying = !isMusicPlaying;
    };
    document.getElementById('music-toggle').addEventListener('click', toggleMusic);

    // --- State ---
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let studentData = {};
    let answers = [];
    let currentAnswer = null; // Can be index, string, or object depending on type

    // --- DOM Elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const interactionArea = document.getElementById('interaction-area');
    const questionText = document.getElementById('question-text');
    const mediaContainer = document.getElementById('media-container');
    const questionCounter = document.getElementById('question-counter');
    const currentScoreDisplay = document.getElementById('current-score');

    // Views
    const views = {
        role: document.getElementById('view-role-select'),
        teacherLogin: document.getElementById('view-teacher-login'),
        teacherDash: document.getElementById('view-teacher-dashboard'),
        studentReg: document.getElementById('view-student-register'),
        assessment: document.getElementById('view-assessment'),
        results: document.getElementById('view-results')
    };

    // Buttons
    const btnNextQuestion = document.getElementById('btn-next-question');
    const btnSubmitAssessment = document.getElementById('btn-submit-assessment');
    const loadingOverlay = document.getElementById('loading-overlay');

    // --- Theme Logic ---
    const toggleTheme = () => {
        const currentTheme = document.documentElement.dataset.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = newTheme;
        themeToggle.innerHTML = newTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', newTheme);
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.dataset.theme = savedTheme;
    themeToggle.innerHTML = savedTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    themeToggle.addEventListener('click', toggleTheme);

    // --- Navigation Logic ---
    const switchView = (hideView, showView) => {
        playClick();
        hideView.classList.add('hidden');
        hideView.classList.remove('active');
        showView.classList.remove('hidden');
        showView.classList.add('active');
    };

    document.getElementById('btn-student-role').addEventListener('click', () => {
        if (!isMusicPlaying) toggleMusic();
        switchView(views.role, views.studentReg);
    });
    document.getElementById('btn-teacher-role').addEventListener('click', () => switchView(views.role, views.teacherLogin));
    document.getElementById('btn-back-from-teacher').addEventListener('click', () => switchView(views.teacherLogin, views.role));
    document.getElementById('btn-back-from-student').addEventListener('click', () => switchView(views.studentReg, views.role));

    const showLoading = (show) => show ? loadingOverlay.classList.remove('hidden') : loadingOverlay.classList.add('hidden');

    // --- API Configuration ---
    const API_BASE_URL = 'http://127.0.0.1:8787/api';

    // --- Student Start ---
    document.getElementById('form-student-register').addEventListener('submit', async (e) => {
        e.preventDefault();
        playClick();
        studentData = {
            name: document.getElementById('student-name').value,
            grade: document.getElementById('student-grade').value,
            school: document.getElementById('student-school').value
        };

        showLoading(true);
        await fetchQuestions();
        showLoading(false);

        if (questions.length > 0) {
            switchView(views.studentReg, views.assessment);
            startAssessment();
        } else {
            alert("Failed to load quests. Please check the backend.");
        }
    });

    const fetchQuestions = async () => {
        // Try multiple paths for robustness
        const paths = [
            '../assessment/questions.json',
            './assessment/questions.json',
            '../live-quiz-data/questions.json'
        ];
        for (const path of paths) {
            try {
                const res = await fetch(path);
                if (res.ok) {
                    const data = await res.json();
                    if (data.stem_baseline?.baseline?.questions) {
                        questions = data.stem_baseline.baseline.questions;
                        return;
                    }
                }
            } catch (error) {
                console.debug(`Failed to fetch questions from ${path}:`, error);
            }
        }
        console.error("Could not load questions from any path.");
    };

    // --- Game Logic ---
    const startAssessment = () => {
        currentQuestionIndex = 0;
        score = 0;
        answers = [];
        loadQuestion();
    };

    const loadQuestion = () => {
        const q = questions[currentQuestionIndex];
        currentAnswer = null;
        btnNextQuestion.disabled = true;

        // Update Stats
        questionCounter.innerText = `Level ${currentQuestionIndex + 1} / ${questions.length}`;
        currentScoreDisplay.innerText = score;

        // Render Text & Media
        questionText.innerText = q.text;

        mediaContainer.innerHTML = '';
        if (q.media_url) {
            if (q.media_type === 'image') {
                mediaContainer.innerHTML = `<img src="${q.media_url}" alt="Quest Image">`;
                mediaContainer.classList.remove('hidden');
            } else if (q.media_type === 'audio') {
                mediaContainer.innerHTML = `<audio controls src="${q.media_url}"></audio>`;
                mediaContainer.classList.remove('hidden');
            }
        } else {
            mediaContainer.classList.add('hidden');
        }

        // Render Interaction Area based on type
        interactionArea.innerHTML = '';

        if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'image_selection' || q.type === 'audio_recognition') {
            renderOptions(q);
        } else if (q.type === 'fill_in_the_blank') {
            renderFillBlank(q);
        } else if (q.type === 'match_the_following') {
            renderMatch(q);
        }

        if (currentQuestionIndex === questions.length - 1) {
            btnNextQuestion.classList.add('hidden');
            btnSubmitAssessment.classList.remove('hidden');
            btnSubmitAssessment.disabled = true;
        } else {
            btnNextQuestion.classList.remove('hidden');
            btnSubmitAssessment.classList.add('hidden');
        }
    };

    const handleOptionSelect = (btn, index) => {
        playClick();
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentAnswer = index;
        btnNextQuestion.disabled = false;
        btnSubmitAssessment.disabled = false;
    };

    const renderOptions = (q) => {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';

            if (q.type === 'image_selection') {
                btn.innerHTML = `<img src="${opt}" style="max-height:100px; border-radius:10px;"><br>Option ${index + 1}`;
            } else {
                btn.innerText = opt;
            }

            btn.onclick = () => handleOptionSelect(btn, index);
            grid.appendChild(btn);
        });
        interactionArea.appendChild(grid);
    };

    const renderFillBlank = (q) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-group';
        input.style.width = '100%';
        input.style.padding = '15px';
        input.style.fontSize = '1.5rem';
        input.style.borderRadius = '15px';
        input.style.border = '3px solid var(--primary-color)';
        input.placeholder = 'Type your answer here...';

        input.oninput = (e) => {
            currentAnswer = e.target.value.trim().toLowerCase();
            const hasText = currentAnswer.length > 0;
            btnNextQuestion.disabled = !hasText;
            btnSubmitAssessment.disabled = !hasText;
        };
        interactionArea.appendChild(input);
    };

    const renderMatch = (q) => {
        const container = document.createElement('div');
        container.className = 'match-container';

        const col1 = document.createElement('div'); col1.className = 'match-column';
        const col2 = document.createElement('div'); col2.className = 'match-column';

        let selectedLeft = null;
        let selectedRight = null;
        currentAnswer = {}; // Map of left -> right

        const checkMatch = () => {
            if (selectedLeft !== null && selectedRight !== null) {
                playClick();
                const lBtn = col1.children[selectedLeft];
                const rBtn = col2.children[selectedRight];
                lBtn.classList.remove('selected-left');
                rBtn.classList.remove('selected-right');
                lBtn.classList.add('matched');
                rBtn.classList.add('matched');

                currentAnswer[selectedLeft] = selectedRight;
                selectedLeft = null;
                selectedRight = null;

                if (Object.keys(currentAnswer).length === q.pairs.length) {
                    btnNextQuestion.disabled = false;
                    btnSubmitAssessment.disabled = false;
                }
            }
        };

        const handleLeftMatchSelect = (btnL, index) => {
            if (btnL.classList.contains('matched')) {
                btnL.classList.remove('matched');
                const matchedR = currentAnswer[index];
                if (matchedR !== undefined) {
                    col2.children[matchedR]?.classList.remove('matched');
                    delete currentAnswer[index];
                }
                btnNextQuestion.disabled = true;
                btnSubmitAssessment.disabled = true;
                return;
            }
            for (const c of col1.children) c.classList.remove('selected-left');
            btnL.classList.add('selected-left');
            selectedLeft = index;
            checkMatch();
        };

        const handleRightMatchSelect = (btnR, index) => {
            if (btnR.classList.contains('matched')) {
                btnR.classList.remove('matched');
                for (let lIdx in currentAnswer) {
                    if (currentAnswer[lIdx] === index) {
                        col1.children[lIdx]?.classList.remove('matched');
                        delete currentAnswer[lIdx];
                        break;
                    }
                }
                btnNextQuestion.disabled = true;
                btnSubmitAssessment.disabled = true;
                return;
            }
            for (const c of col2.children) c.classList.remove('selected-right');
            btnR.classList.add('selected-right');
            selectedRight = index;
            checkMatch();
        };

        q.pairs.forEach((pair, index) => {
            const btnL = document.createElement('div');
            btnL.className = 'match-item';
            btnL.innerText = pair.left;
            btnL.onclick = () => handleLeftMatchSelect(btnL, index);
            col1.appendChild(btnL);

            const btnR = document.createElement('div');
            btnR.className = 'match-item';
            btnR.innerText = pair.right;
            btnR.onclick = () => handleRightMatchSelect(btnR, index);
            col2.appendChild(btnR);
        });

        // Simple shuffle for col2 to make it a game
        for (let i = col2.children.length; i >= 0; i--) { // Simple UI shuffle for display only — not a security context, Math.random() is appropriate here
            const randomChild = col2.children[Math.floor(Math.random() * (i + 1))];
            if (randomChild) col2.appendChild(randomChild);
        }

        container.appendChild(col1);
        container.appendChild(col2);
        interactionArea.appendChild(container);
    };

    // --- Flow ---
    const handleAnswerSubmit = () => {
        const q = questions[currentQuestionIndex];
        let isCorrect = false;

        if (q.type === 'fill_in_the_blank') {
            // Check if string matches any of acceptable answers
            isCorrect = q.answer.map(a => a.toLowerCase()).includes(currentAnswer);
        } else if (q.type === 'match_the_following') {
            // Check mapping
            isCorrect = true;
            for (let i = 0; i < q.pairs.length; i++) {
                if (currentAnswer[i] !== i) isCorrect = false; // Because pair.left correlates strictly to pair.right in data
            }
        } else {
            isCorrect = currentAnswer === q.answer;
        }

        if (isCorrect) {
            score += (q.marks || 1);
            sfxCorrect.currentTime = 0;
            sfxCorrect.play().catch(e => { });
        } else {
            sfxWrong.currentTime = 0;
            sfxWrong.play().catch(e => { });
        }

        answers.push({
            questionId: q.id,
            isCorrect: isCorrect,
            marksEarned: isCorrect ? (q.marks || 1) : 0
        });
    };

    btnNextQuestion.addEventListener('click', () => {
        handleAnswerSubmit();
        currentQuestionIndex++;
        loadQuestion();
    });

    btnSubmitAssessment.addEventListener('click', () => {
        handleAnswerSubmit();
        submitAssessment();
    });

    const submitAssessment = async () => {
        showLoading(true);

        // Calculate max score
        const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

        const payload = {
            student: studentData,
            score: score,
            totalQuestions: questions.length,
            maxScore: maxScore,
            answers: answers
        };

        try {
            await fetch(`${API_BASE_URL}/submit-assessment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Backend offline", error);
        }

        showLoading(false);
        switchView(views.assessment, views.results);
        document.getElementById('result-score').innerText = `Score: ${score} / ${maxScore}`;

        // Stop music
        if (isMusicPlaying) toggleMusic();

        // Save result to localStorage for teacher dashboard
        const allResults = JSON.parse(localStorage.getItem('stemquest_results') || '[]');
        allResults.push({
            student: studentData,
            score: score,
            maxScore: maxScore,
            percentage: Math.round(score / maxScore * 100),
            answers: answers,
            date: new Date().toISOString()
        });
        localStorage.setItem('stemquest_results', JSON.stringify(allResults));
    };

    document.getElementById('btn-go-home').addEventListener('click', () => switchView(views.results, views.role));

    // --- CSV Download ---
    document.getElementById('btn-download-csv').addEventListener('click', () => {
        if (!answers || answers.length === 0) { alert('No answers to export!'); return; }
        const maxScore = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
        const rows = [['Student Name', 'Grade', 'School', 'Q#', 'Question ID', 'Type', 'Correct?', 'Marks Earned', 'Max Marks']];
        answers.forEach((a, i) => {
            const q = questions.find(qq => qq.id === a.questionId) || {};
            rows.push([
                `"${studentData.name || ''}"`,
                `"${studentData.grade || ''}"`,
                `"${studentData.school || ''}"`,
                i + 1,
                a.questionId,
                `"${q.type || ''}"`,
                a.isCorrect ? 'Yes' : 'No',
                a.marksEarned,
                q.marks || 1
            ]);
        });
        rows.push([`"${studentData.name}"`, `"${studentData.grade}"`, `"${studentData.school}"`,
            'TOTAL', '-', '-', '-', score, maxScore]);
        const csv = rows.map(r => r.join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `STEM-Quest-${(studentData.name || 'student').replace(/\s+/g, '-')}-${new Date().toLocaleDateString('en-IN').replaceAll('/', '-')}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });

    // Teacher results view
    document.getElementById('btn-logout-teacher').addEventListener('click', () => switchView(views.teacherDash, views.role));
    function loadTeacherResults() {
        const all = JSON.parse(localStorage.getItem('stemquest_results') || '[]');
        const container = document.getElementById('results-container');
        if (all.length === 0) { container.innerHTML = '<p style="text-align:center;color:#aaa">No results yet!</p>'; return; }
        container.innerHTML = all.map((r, i) => `
            <div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1)">
                <strong>${i + 1}. ${r.student?.name || 'Unknown'}</strong>
                <span style="float:right;color:var(--secondary-color)">${r.score}/${r.maxScore} (${r.percentage}%)</span><br>
                <small style="color:#aaa">Grade: ${r.student?.grade || '-'} | ${r.student?.school || '-'} | ${new Date(r.date).toLocaleDateString()}</small>
            </div>`).join('');
    }

    // --- Teacher Login ---
    // Password: Niktrix → SHA-256 hash
    const TEACHER_HASH = 'b14281344159aa5f3b2e8f314d2ca1d7da8472de8c07c55d4e42e3529b6ca890';

    document.getElementById('form-teacher-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        playClick();
        const tpass = document.getElementById('teacher-pass').value;
        showLoading(true);
        const hash = await sha256(tpass);
        showLoading(false);
        if (hash === TEACHER_HASH) {
            switchView(views.teacherLogin, views.teacherDash);
            loadTeacherResults();
            loadAllLeaderboard();
        } else {
            const errMsg = document.getElementById('teacher-login-error') || (() => {
                const el = document.createElement('p');
                el.id = 'teacher-login-error';
                el.style.cssText = 'color:#f87171;font-size:0.9rem;margin-top:8px;';
                document.getElementById('teacher-pass').after(el);
                return el;
            })();
            errMsg.textContent = '❌ Incorrect password. Try again.';
            document.getElementById('teacher-pass').value = '';
        }
    });

    async function loadAllLeaderboard() {
        const container = document.getElementById('results-container');
        if (!container) return;
        container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px">Loading records...</p>';

        let jsonRecords = [];
        try {
            const res = await fetch('../assessment/data/leaderboard-data.json');
            if (res.ok) {
                jsonRecords = await res.json();
            }
        } catch (fetchError) {
            console.debug('Leaderboard JSON not reachable:', fetchError.message);
        }

        const lsRecords = JSON.parse(localStorage.getItem('stemquest_results') || '[]').map(r => ({
            date: r.date || new Date().toISOString(),
            name: r.student?.name || 'Unknown',
            grade: r.student?.grade || '-',
            school: r.student?.school || '-',
            totalScore: r.score || 0,
            maxScore: r.maxScore || 100,
            percentage: r.percentage || 0,
            categoryScores: r.categoryBreakdown || {}
        }));

        const all = [...jsonRecords, ...lsRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
        window._leaderboardAllData = all;

        if (all.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px">No student records found.</p>';
            return;
        }

        container.innerHTML = all.map((r, i) => {
            const pct = r.percentage || 0;
            let pctColor;
            if (pct >= 75) {
                pctColor = '#4ade80';
            } else if (pct >= 50) {
                pctColor = '#fbbf24';
            } else {
                pctColor = '#f87171';
            }

            let formattedDate = r.date;
            try {
                const d = new Date(r.date);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleString('en-IN', { hour12: false });
                }
            } catch (_) { }

            return `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.1)">
                <strong style="color:#fff">${i + 1}. ${r.name}</strong>
                <span style="float:right;font-weight:800;color:${pctColor}">${pct}%</span><br>
                <span style="color:var(--accent)">${r.totalScore}/${r.maxScore} pts</span>
                <small style="color:#aaa;margin-left:12px">Grade: ${r.grade} | ${r.school} | ${formattedDate}</small>
            </div>`;
        }).join('');
    }

    document.getElementById('btn-download-all-csv')?.addEventListener('click', () => {
        const all = window._leaderboardAllData || [];
        if (all.length === 0) { alert('No student records to export!'); return; }

        const rows = [
            ['"Timestamp"', '"Student Name"', '"Grade"', '"School/College"',
                '"MCQ"', '"TF"', '"Match"', '"Fill Blank"', '"Calc"',
                '"Arduino IDE"', '"Audio ID"', '"Picto"', '"AI Question"', '"Image ID"',
                '"Score"', '"%"']
        ];
        all.forEach((r) => {
            const cs = r.categoryScores || {};

            let formattedDate = r.date;
            try {
                const d = new Date(r.date);
                if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleString('en-IN', { hour12: false });
                }
            } catch (_) { }

            rows.push([
                `"${formattedDate}"`,
                `"${r.name || '-'}"`,
                `"${r.grade || '-'}"`,
                `"${r.school || '-'}"`,
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
                `"${r.totalScore}/${r.maxScore}"`,
                `"${r.percentage || 0}%"`
            ]);
        });

        const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `STEM-Quest-All-Students-${new Date().toISOString().substring(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    });

    // Tab switching for pages/assessment.html
    document.getElementById('btn-tab-leaderboard')?.addEventListener('click', () => {
        document.getElementById('tab-content-leaderboard')?.classList.remove('hidden');
        document.getElementById('tab-content-qbank')?.classList.add('hidden');
        document.getElementById('btn-tab-leaderboard')?.classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('btn-tab-qbank')?.classList.replace('btn-primary', 'btn-secondary');
    });
    document.getElementById('btn-tab-qbank')?.addEventListener('click', () => {
        document.getElementById('tab-content-qbank')?.classList.remove('hidden');
        document.getElementById('tab-content-leaderboard')?.classList.add('hidden');
        document.getElementById('btn-tab-qbank')?.classList.replace('btn-secondary', 'btn-primary');
        document.getElementById('btn-tab-leaderboard')?.classList.replace('btn-primary', 'btn-secondary');
        loadQuestionBankSimple();
    });

    async function loadQuestionBankSimple() {
        const container = document.getElementById('qbank-container');
        if (!container || container.dataset.loaded) return;
        container.dataset.loaded = '1';
        container.innerHTML = '<p style="color:#aaa;padding:20px;text-align:center">Loading questions...</p>';

        let qs = [];
        const paths = [
            '../assessment/questions.json',
            './assessment/questions.json'
        ];
        for (const path of paths) {
            try {
                const res = await fetch(path);
                if (res.ok) {
                    const data = await res.json();
                    if (data.stem_baseline?.baseline?.questions) {
                        qs = data.stem_baseline.baseline.questions;
                        break;
                    }
                }
            } catch (_) { /* try next path */ }
        }

        if (qs.length === 0) {
            container.innerHTML = '<p style="color:#f87171;padding:20px;text-align:center">Could not load questions.</p>';
            return;
        }

        const typeLabels = {
            multiple_choice: '🔵 MCQ',
            true_false: '✅ True/False',
            fill_in_the_blank: '✏️ Fill Blank',
            match_the_following: '🔗 Match',
            image_selection: '🖼️ Image ID',
            audio_recognition: '🔊 Audio ID'
        };

        container.innerHTML = `
            <div style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:var(--accent,#a78bfa);font-size:1.1rem;">📚 Question Bank — ${qs.length} Questions</strong>
                <div style="display:flex;gap:8px;">
                    <button id="btn-export-qbank-csv" class="btn btn-secondary" style="padding:6px 14px;font-size:0.85rem;">⬇️ Export CSV</button>
                    <button id="btn-export-qbank-pdf" class="btn btn-primary" style="padding:6px 14px;font-size:0.85rem;background:#7c3aed;border:none;">📋 Export PDF</button>
                </div>
            </div>
            ${qs.map((q, i) => {
            const typeLabel = typeLabels[q.type] || q.type;
            let bodyHtml = '';
            if (q.options) {
                bodyHtml = `<ol style="margin:6px 0 0 16px;padding:0;color:#ccc;font-size:0.88rem;">
                        ${q.options.map((o, oi) => `<li style="margin:2px 0;${oi === q.answer ? 'color:#4ade80;font-weight:700;' : ''}">${o}${oi === q.answer ? ' ✓' : ''}</li>`).join('')}
                    </ol>`;
            } else if (q.pairs) {
                bodyHtml = `<div style="margin-top:6px;font-size:0.88rem;color:#ccc;">
                        ${q.pairs.map(p => `<div style="margin:2px 0;">• <b>${p.left}</b> → ${p.right}</div>`).join('')}
                    </div>`;
            } else if (q.answer) {
                bodyHtml = `<div style="margin-top:6px;font-size:0.88rem;color:#4ade80;">Answer: ${Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}</div>`;
            }
            if (q.media_url) {
                bodyHtml = `<div style="margin-top:6px;font-size:0.8rem;color:#aaa;">🔊 Audio: <a href="${q.media_url}" target="_blank" style="color:#a78bfa;">Listen</a></div>` + bodyHtml;
            }
            return `
                <div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                        <div style="flex:1;">
                            <span style="font-weight:700;color:#fff;">${i + 1}. ${q.text}</span>
                            ${bodyHtml}
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
                            <span style="background:rgba(167,139,250,0.15);color:#a78bfa;padding:2px 8px;border-radius:6px;font-size:0.75rem;white-space:nowrap;">${typeLabel}</span>
                            <span style="color:#fbbf24;font-size:0.78rem;">${q.marks || 1} pt${(q.marks || 1) !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>`;
        }).join('')}
        `;

        // Export Q-Bank as CSV
        document.getElementById('btn-export-qbank-csv')?.addEventListener('click', () => {
            const rows = [['#', 'Type', 'Question', 'Options/Pairs', 'Correct Answer', 'Marks']];
            qs.forEach((q, i) => {
                let opts = '';
                let ans = '';
                if (q.options) {
                    opts = q.options.join(' | ');
                    ans = q.options[q.answer] || String(q.answer);
                } else if (q.pairs) {
                    opts = q.pairs.map(p => `${p.left}→${p.right}`).join(' | ');
                    ans = 'All matched correctly';
                } else if (q.answer) {
                    ans = Array.isArray(q.answer) ? q.answer.join(', ') : String(q.answer);
                }
                rows.push([i + 1, `"${q.type}"`, `"${q.text.replace(/"/g, '""')}"`, `"${opts.replace(/"/g, '""')}"`, `"${ans.replace(/"/g, '""')}"`, q.marks || 1]);
            });
            const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `STEM-Quest-QuestionBank-${new Date().toISOString().substring(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        });

        // Export Q-Bank as PDF
        document.getElementById('btn-export-qbank-pdf')?.addEventListener('click', () => {
            generateQuestionBankPDF(qs, "STEM Quest — Baseline Question Bank");
        });
    }

    function generateQuestionBankPDF(questions, title) {
        const typeLabels = {
            multiple_choice: '🔵 MCQ',
            true_false: '✅ True/False',
            fill_in_the_blank: '✏️ Fill Blank',
            match_the_following: '🔗 Match',
            image_selection: '🖼️ Image ID',
            audio_recognition: '🔊 Audio ID',
            mcq: '🔵 MCQ',
            match: '🔗 Match',
            audio_id: '🔊 Audio ID',
            image_id: '🖼️ Image ID'
        };

        const questionsHTML = questions.map((q, i) => {
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
                                <img src="${opt}" style="max-height:80px; max-width: 100%; display:block; border-radius:4px; margin: 0 auto 4px; object-fit: contain;" />
                                <span style="font-size:0.75rem; font-weight: ${isCorrect ? 'bold' : 'normal'}; color: ${isCorrect ? '#16a34a' : '#64748b'}">Option ${oi + 1} ${isCorrect ? '✓' : ''}</span>
                            </div>`;
                        }).join('') + '</div>';
                }
            } else if (q.options && q.options.length) {
                answerHTML = '<ol style="margin:8px 0 4px 20px;padding:0;">' +
                    q.options.map((opt, oi) => {
                        const optText = typeof opt === 'object' ? (opt.text || opt.label || '') : opt;
                        const isCorrect = oi === q.answer;
                        return `<li class="${isCorrect ? 'correct-ans' : 'incorrect-ans'}" style="margin:4px 0; padding: 4px 8px; border-radius: 4px; ${isCorrect ? 'color: #16a34a !important; font-weight: bold !important; background-color: #f0fdf4 !important; border: 1px solid #bbf7d0 !important;' : 'color: #334155;'}">${optText}${isCorrect ? ' ✓' : ''}</li>`;
                    }).join('') + '</ol>';
            } else if (q.pairs) {
                answerHTML = '<ul style="margin:8px 0 4px 16px; padding:0; list-style-type: none;">' +
                    q.pairs.map(p => `<li style="color:#16a34a; font-weight:bold; background-color: #f0fdf4; border: 1px solid #bbf7d0; display: inline-block; padding: 4px 12px; margin: 4px; border-radius: 6px;">${p.left} &nbsp;➔&nbsp; ${p.right}</li>`).join('') +
                    '</ul>';
            } else if (q.answer !== undefined) {
                const correctText = Array.isArray(q.answer) ? q.answer.join(', ') : q.answer;
                answerHTML = `<div style="margin-top:8px; padding: 6px 12px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; display: inline-block; color: #16a34a; font-weight: bold;">Answer: ${correctText}</div>`;
            }

            return `
                <div class="question-box" style="page-break-inside:avoid; break-inside: avoid; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; background:#ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
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

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; color: #1e293b; font-family: 'Inter', sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
            body { background: #fff !important; padding: 20px 0; }
            .no-print { display: none !important; }
        }
        h1 { font-size: 2.2rem; color: #1e293b; margin-bottom: 6px; letter-spacing: -0.5px; }
        .subtitle { color: #64748b; font-size: 0.95rem; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .print-btn { display:inline-flex;align-items:center;gap:8px;margin-bottom:24px;padding:12px 24px;
            background:#4f46e5;color:#fff;border:none;border-radius:8px;
            font-family:'Inter',sans-serif;font-size:0.95rem;font-weight:600;cursor:pointer;box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); }
        .print-btn:hover { background: #4338ca; }
    </style>
</head>
<body>
    <div style="display:flex; justify-content:space-between; align-items: flex-start; flex-wrap: wrap;" class="no-print">
        <div>
            <h1>📚 ${title}</h1>
            <p class="subtitle" style="border:none; margin-bottom: 10px;">Generated: ${printDate} &nbsp;|&nbsp; ${questions.length} Questions with highlighted answers</p>
        </div>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save PDF</button>
    </div>
    
    <div class="subtitle" style="display:none; @media print { display:block; }">
        <h1>📚 ${title}</h1>
        <p>Generated: ${printDate} &nbsp;|&nbsp; ${questions.length} Questions with highlighted answers</p>
    </div>

    <div style="display:flex; flex-direction:column; gap:16px;">
        ${questionsHTML}
    </div>

    <p style="margin-top:40px;color:#94a3b8;font-size:0.85rem;text-align:center;border-top:1px solid #e2e8f0;padding-top:16px;">STEM Quest Question Bank &copy; ${new Date().getFullYear()} — Confidential Teacher Copy</p>
</body>
</html>`;

        const win = window.open('', '_blank');
        if (!win) {
            alert('Pop-up blocked! Please allow pop-ups for this site, then try again.');
            return;
        }
        win.document.write(html);
        win.document.close();
        win.addEventListener('load', () => setTimeout(() => win.print(), 600));
    }
}

);
