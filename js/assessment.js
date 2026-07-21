// GAMIFIED assessment.js

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
        sfxClick.play().catch(e => {});
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
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeToggle.innerHTML = newTheme === 'light' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', newTheme);
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
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
        if(!isMusicPlaying) toggleMusic();
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
                // try next path
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

    // --- Renderers ---
    const renderOptions = (q) => {
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            
            if (q.type === 'image_selection') {
                btn.innerHTML = `<img src="${opt}" style="max-height:100px; border-radius:10px;"><br>Option ${index+1}`;
            } else {
                btn.innerText = opt;
            }

            btn.onclick = () => {
                playClick();
                document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                currentAnswer = index;
                btnNextQuestion.disabled = false;
                btnSubmitAssessment.disabled = false;
            };
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

        q.pairs.forEach((pair, index) => {
            const btnL = document.createElement('div');
            btnL.className = 'match-item';
            btnL.innerText = pair.left;
            btnL.onclick = () => {
                if (btnL.classList.contains('matched')) {
                    // Unmatch
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
                Array.from(col1.children).forEach(c => c.classList.remove('selected-left'));
                btnL.classList.add('selected-left');
                selectedLeft = index;
                checkMatch();
            };
            col1.appendChild(btnL);

            const btnR = document.createElement('div');
            btnR.className = 'match-item';
            btnR.innerText = pair.right;
            btnR.onclick = () => {
                if (btnR.classList.contains('matched')) {
                    // Unmatch
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
                Array.from(col2.children).forEach(c => c.classList.remove('selected-right'));
                btnR.classList.add('selected-right');
                selectedRight = index;
                checkMatch();
            };
            col2.appendChild(btnR);
        });

        // Simple shuffle for col2 to make it a game
        for (let i = col2.children.length; i >= 0; i--) {
            col2.appendChild(col2.children[Math.random() * i | 0]);
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
            isCorrect = q.answer.map(a=>a.toLowerCase()).includes(currentAnswer);
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
            sfxCorrect.play().catch(e=>{});
        } else {
            sfxWrong.currentTime = 0;
            sfxWrong.play().catch(e=>{});
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
        if(isMusicPlaying) toggleMusic();

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
        const rows = [['Student Name','Grade','School','Q#','Question ID','Type','Correct?','Marks Earned','Max Marks']];
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
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `STEM-Quest-${(studentData.name||'student').replace(/\s+/g,'-')}-${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <strong>${i+1}. ${r.student?.name || 'Unknown'}</strong>
                <span style="float:right;color:var(--secondary-color)">${r.score}/${r.maxScore} (${r.percentage}%)</span><br>
                <small style="color:#aaa">Grade: ${r.student?.grade || '-'} | ${r.student?.school || '-'} | ${new Date(r.date).toLocaleDateString()}</small>
            </div>`).join('');
    }

    // --- Teacher Login ---
    document.getElementById('form-teacher-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        playClick();
        const tid = document.getElementById('teacher-id').value;
        const tpass = document.getElementById('teacher-pass').value;
        showLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/teacher-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: tid, password: tpass })
            });
            if(res.ok) { switchView(views.teacherLogin, views.teacherDash); loadTeacherResults(); }
            else alert("Invalid Credentials");
        } catch (error) {
            if (tid === 'admin' && tpass === 'password') { switchView(views.teacherLogin, views.teacherDash); loadTeacherResults(); }
            else alert("Backend not reachable. Use admin/password for dev mock.");
        }
        showLoading(false);
    });

});
