import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAECGMk5F130LcGzpEN1nbJubBSG1AVmgI",
    authDomain: "stem-8237e.firebaseapp.com",
    databaseURL: "https://stem-8237e-default-rtdb.firebaseio.com",
    projectId: "stem-8237e",
    storageBucket: "stem-8237e.firebasestorage.app",
    messagingSenderId: "528768244250",
    appId: "1:528768244250:web:d1b839f579a0eb372e0fa3",
    measurementId: "G-HP35KPYMF6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let lqRoomCode = "";
let lqPlayerName = "";
let allQuizData = null; // Contains all grades
let lqQuizData = null;  // Contains the specific grade & unit being played
let lqCurrentQuestionIndex = -1;
let lqQuestionOrder = []; // Shuffled order of questions
let lqMyScore = 0;
let lqAnsweredCurrent = false;
let studentsData = null;
let teachersData = null;
let isHost = false;
let timerInterval = null;

window.lqShowView = (viewId) => {
    document.querySelectorAll('.lq-view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(viewId);
    if(el) el.classList.add('active');
};

window.initLiveQuiz = async () => {
    try {
        const snapshot = await get(ref(db, 'liveQuizData'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            allQuizData = data.questions;
            studentsData = data.students;
            teachersData = data.teachers;
        } else {
            console.error("No live quiz data available in database");
        }
    } catch (e) {
        console.error("Failed to load live quiz data from database", e);
    }
};

window.lqHostLogin = async () => {
    const hostName = document.getElementById('lq-host-name').value.trim();
    const hostPass = document.getElementById('lq-host-pass').value.trim();
    const gradeSelect = document.getElementById('lq-host-grade').value;
    const unitSelect = document.getElementById('lq-host-unit') ? document.getElementById('lq-host-unit').value : 'unit1';

    if (teachersData && teachersData.teachers) {
        const teachersArray = Array.isArray(teachersData.teachers) ? teachersData.teachers : Object.values(teachersData.teachers);
        const validTeacher = teachersArray.find(t => t && t.name === hostName && t.password === hostPass);
        if (!validTeacher) {
            alert("Invalid Teacher Name or Password!");
            return;
        }
    } else {
        alert("Teacher data not loaded!");
        return;
    }

    if (!allQuizData || !allQuizData[gradeSelect] || !allQuizData[gradeSelect][unitSelect]) {
        alert("Exam data for selected class/grade and unit not found!");
        return;
    }

    lqQuizData = allQuizData[gradeSelect][unitSelect];
    lqPlayerName = hostName; // Host plays under their own name!

    await lqCreateRoom();
};

async function lqCreateRoom() {
    isHost = true;
    lqRoomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    document.getElementById('lq-display-room-code').innerText = lqRoomCode;

    const roomRef = ref(db, 'rooms/' + lqRoomCode);
    await set(roomRef, {
        status: 'waiting',
        currentQuestion: -1,
        hostId: lqPlayerName,
        quiz: lqQuizData,
        startTime: 0,
        players: {},
        responses: {}
    });

    window.lqShowView('lq-host-setup-page');
    document.getElementById('lq-host-pre-start').style.display = 'block';
    const activeDash = document.getElementById('lq-host-active-dashboard');
    if(activeDash) activeDash.style.display = 'none';

    lqListenToPlayers();
    lqListenToGame();
}

window.lqStartGame = () => {
    update(ref(db, `rooms/${lqRoomCode}`), {
        status: 'active',
        currentQuestion: 0,
        startTime: Date.now() // Start the 10 min timer
    });
    const preStart = document.getElementById('lq-host-pre-start');
    if (preStart) preStart.style.display = 'none';
    const activeDash = document.getElementById('lq-host-active-dashboard');
    if (activeDash) activeDash.style.display = 'block';
};

window.lqNextQuestion = async () => {
    const snapshot = await get(ref(db, `rooms/${lqRoomCode}/currentQuestion`));
    let nextIndex = snapshot.val() + 1;

    if (nextIndex >= lqQuizData.questions.length) {
        window.lqEndQuiz();
    } else {
        update(ref(db, `rooms/${lqRoomCode}`), { currentQuestion: nextIndex });
    }
};

window.lqEndQuiz = () => {
    update(ref(db, `rooms/${lqRoomCode}`), { status: 'ended' });
};


window.lqJoinGame = async () => {
    lqRoomCode = document.getElementById('lq-join-code').value.trim();
    lqPlayerName = document.getElementById('lq-join-name').value.trim();
    const lqPlayerPass = document.getElementById('lq-join-pass').value.trim();

    if (lqRoomCode.length !== 6 || lqPlayerName === "" || lqPlayerPass === "") {
        alert("Please enter a valid 6-digit code, name, and password!");
        return;
    }

    if (studentsData && studentsData.students) {
        const studentsArray = Array.isArray(studentsData.students) ? studentsData.students : Object.values(studentsData.students);
        const validStudent = studentsArray.find(s => s && s.name === lqPlayerName && s.password === lqPlayerPass);
        if (!validStudent) {
            alert("Invalid Name or Password!");
            return;
        }
    }

    const roomSnapshot = await get(ref(db, `rooms/${lqRoomCode}`));
    if (!roomSnapshot.exists()) {
        alert("Room not found!");
        return;
    }

    isHost = false;
    
    // Read the room's quiz data so the client knows the questions
    const roomData = roomSnapshot.val();
    lqQuizData = roomData.quiz;

    await set(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}`), { 
        name: lqPlayerName,
        score: 0,
        school: studentsData?.school_name || "Unknown"
    });

    document.getElementById('lq-waiting-room-code').innerText = lqRoomCode;
    window.lqShowView('lq-player-waiting-page');

    lqListenToGame();
    lqListenToPlayers();
};

function lqListenToPlayers() {
    onValue(ref(db, `rooms/${lqRoomCode}/players`), (snapshot) => {
        const players = snapshot.val() || {};
        
        // 1. Update waiting room count
        const count = Object.keys(players).length;
        const countEl = document.getElementById('lq-players-count');
        if(countEl) countEl.innerText = count;

        // 2. Update Host Dashboard list (if visible)
        const hostList = document.getElementById('lq-host-player-list');
        if(hostList) {
            hostList.innerHTML = '';
            const hostCountEl = document.getElementById('lq-host-player-count');
            if(hostCountEl) hostCountEl.innerText = count;
            for (let p in players) {
                const li = document.createElement('li');
                li.innerText = p; // Score hidden
                hostList.appendChild(li);
            }
        }

        // 3. Update Live Sidebar Leaderboard (during quiz)
        const sidebarList = document.getElementById('lq-live-sidebar-list');
        if(sidebarList) {
            sidebarList.innerHTML = '';
            const sorted = Object.entries(players).sort((a,b) => b[1].score - a[1].score);
            sorted.forEach(([p, data], i) => {
                const li = document.createElement('li');
                li.style.padding = '10px 0';
                li.style.borderBottom = '1px solid var(--border)';
                li.style.fontSize = '0.95rem';
                
                let rankStr = `<strong>#${i+1}</strong>`;
                if(i===0) rankStr = '🥇';
                if(i===1) rankStr = '🥈';
                if(i===2) rankStr = '🥉';

                li.innerHTML = `<span>${rankStr} ${p}</span>`;
                sidebarList.appendChild(li);
            });
        }

        // 4. Update Host Big Leaderboard
        const hostLiveList = document.getElementById('lq-host-live-leaderboard');
        if (hostLiveList) {
            const liveCountEl = document.getElementById('lq-host-live-count');
            if (liveCountEl) liveCountEl.innerText = count;

            hostLiveList.innerHTML = '';
            const sorted = Object.entries(players).sort((a, b) => b[1].score - a[1].score);
            sorted.forEach(([p, data], i) => {
                const li = document.createElement('li');
                li.style.padding = '15px 0';
                li.style.borderBottom = '1px solid var(--border)';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                
                let rankStr = `<strong>#${i + 1}</strong>`;
                if (i === 0) rankStr = '<span style="font-size:2rem;">🥇</span>';
                if (i === 1) rankStr = '<span style="font-size:1.8rem;">🥈</span>';
                if (i === 2) rankStr = '<span style="font-size:1.6rem;">🥉</span>';

                li.innerHTML = `<span>${rankStr} ${p}</span> <span style="color:var(--cyan); font-weight:bold; font-size: 1.3rem;">${data.score} pts</span>`;
                hostLiveList.appendChild(li);
            });
        }
    });
}

function startTimer(startTimeMs) {
    if(timerInterval) clearInterval(timerInterval);
    const totalTimeSeconds = 10 * 60; // 10 minutes

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeMs) / 1000);
        const remaining = totalTimeSeconds - elapsed;

        if (remaining <= 0) {
            clearInterval(timerInterval);
            const timerEl = document.getElementById('lq-timer-display');
            if(timerEl) timerEl.innerText = "⏱️ Time's Up!";
            const hostTimerEl = document.getElementById('lq-host-timer-display');
            if(hostTimerEl) hostTimerEl.innerText = "⏱️ Time's Up!";
            
            // Disable buttons locally
            const optsContainer = document.getElementById('lq-options-container');
            if(optsContainer) optsContainer.innerHTML = '<h3 style="color:var(--red);">Time is up! Waiting for teacher...</h3>';

            // Only host actually calls endQuiz to update DB
            if (isHost) {
                window.lqEndQuiz();
            }
            return;
        }

        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        const timeStr = `⏱️ ${m}:${s}`;
        
        const timerEl = document.getElementById('lq-timer-display');
        if(timerEl) timerEl.innerText = timeStr;
        const hostTimerEl = document.getElementById('lq-host-timer-display');
        if(hostTimerEl) hostTimerEl.innerText = timeStr;
    }, 1000);
}

function lqListenToGame() {
    onValue(ref(db, `rooms/${lqRoomCode}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.status === 'active') {
            if (isHost) {
                // Host stays on the setup page but starts the timer
                if(data.startTime && !timerInterval) {
                    startTimer(data.startTime);
                }
            } else {
                if (lqCurrentQuestionIndex === -1 && data.currentQuestion >= 0) {
                    lqCurrentQuestionIndex = 0;
                    lqAnsweredCurrent = false;
                    
                    // Shuffle questions for this student
                    lqQuestionOrder = Array.from({length: lqQuizData.questions.length}, (_, i) => i);
                    lqQuestionOrder.sort(() => Math.random() - 0.5);
                    
                    // If this is the first question, start the 10-minute timer using the DB start time
                    if(data.startTime) {
                        startTimer(data.startTime);
                    }

                    lqRenderQuestion();
                }
            }
        } else if (data.status === 'ended') {
            if(timerInterval) clearInterval(timerInterval);
            lqShowLeaderboard(data.players);
        }
    });
}

function lqRenderQuestion() {
    window.lqShowView('lq-quiz-page');
    let realIndex = lqQuestionOrder[lqCurrentQuestionIndex];
    let qData = lqQuizData?.questions[realIndex];
    if (!qData) return;
    
    let qText = qData.text || qData.question;
    if (qData.image) {
        qText += `<br><img src="${qData.image}" style="max-width:100%; border-radius:12px; margin-top:15px; box-shadow: 0 6px 15px rgba(0,0,0,0.3); border: 2px solid var(--border);">`;
    }
    document.getElementById('lq-question-text').innerHTML = qText;

    const optionsContainer = document.getElementById('lq-options-container');
    optionsContainer.innerHTML = '';

    if (qData.type === 'mcq' || qData.type === 'multiple_choice' || qData.type === 'true_false') {
        qData.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn lq-btn';
            btn.innerText = opt;
            // Support both string answers and index answers
            const correctVal = (typeof qData.answer === 'number') ? qData.options[qData.answer] : qData.answer;
            btn.onclick = () => window.lqSubmitAnswer(opt, correctVal, qData.marks, btn);
            optionsContainer.appendChild(btn);
        });
    } else if (qData.type === 'fill_blank' || qData.type === 'short_answer') {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'lq-text-answer';
        input.placeholder = 'Type your answer here...';
        input.style.width = '100%';
        input.style.padding = '15px';
        input.style.borderRadius = '8px';
        input.style.border = '2px solid var(--border)';
        input.style.background = 'var(--surface2)';
        input.style.color = 'var(--text)';
        input.style.fontSize = '1.1rem';
        
        const btn = document.createElement('button');
        btn.className = 'btn-primary lq-btn';
        btn.innerText = 'Submit';
        btn.style.marginTop = '15px';
        btn.onclick = () => window.lqSubmitAnswer(document.getElementById('lq-text-answer').value, qData.answer, qData.marks, btn);
        optionsContainer.appendChild(input);
        optionsContainer.appendChild(btn);
    } else if (qData.type === 'match_following') {
        const wrap = document.createElement('div');
        wrap.className = 'match-grid';
        wrap.style.display = 'flex';
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '15px';

        qData.left.forEach((leftItem, i) => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.gap = '15px';
            row.style.alignItems = 'center';

            const leftLbl = document.createElement('div');
            leftLbl.innerText = leftItem;
            leftLbl.style.flex = '1';
            leftLbl.style.padding = '12px 15px';
            leftLbl.style.background = 'var(--surface)';
            leftLbl.style.borderRadius = '8px';
            leftLbl.style.border = '1px solid var(--cyan)';
            leftLbl.style.fontWeight = 'bold';

            const rightSel = document.createElement('select');
            rightSel.className = 'lq-match-select';
            rightSel.style.flex = '1';
            rightSel.style.padding = '12px 15px';
            rightSel.style.borderRadius = '8px';
            rightSel.style.border = '1px solid var(--border)';
            rightSel.style.background = 'var(--bg2)';
            rightSel.style.color = 'var(--text)';
            
            const defOpt = document.createElement('option');
            defOpt.innerText = '-- Select Match --';
            defOpt.value = '';
            rightSel.appendChild(defOpt);

            // Scramble right items for the dropdown
            const rightScrambled = [...qData.right].sort(() => Math.random() - 0.5);
            rightScrambled.forEach(rightItem => {
                const opt = document.createElement('option');
                opt.value = rightItem;
                opt.innerText = rightItem;
                rightSel.appendChild(opt);
            });

            row.appendChild(leftLbl);
            row.appendChild(rightSel);
            wrap.appendChild(row);
        });

        const btn = document.createElement('button');
        btn.className = 'btn-primary lq-btn';
        btn.innerText = 'Submit Match';
        btn.style.marginTop = '20px';
        btn.onclick = () => {
            const selects = wrap.querySelectorAll('.lq-match-select');
            let userAns = {};
            let correctCount = 0;
            let allSelected = true;
            selects.forEach((sel, i) => {
                if(!sel.value) allSelected = false;
                userAns[qData.left[i]] = sel.value;
                if (sel.value === qData.answer[qData.left[i]]) correctCount++;
            });
            if(!allSelected) { alert("Please match all items!"); return; }
            const isCorrect = correctCount === qData.left.length;
            window.lqSubmitAnswer(JSON.stringify(userAns), JSON.stringify(qData.answer), isCorrect ? qData.marks : 0, btn, isCorrect);
        };

        optionsContainer.appendChild(wrap);
        optionsContainer.appendChild(btn);
    }
}

window.lqSubmitAnswer = (selected, correct, marks, btnElement, customIsCorrect = null) => {
    if (lqAnsweredCurrent) return;
    lqAnsweredCurrent = true;

    const isCorrect = customIsCorrect !== null ? customIsCorrect : (selected.toString().toLowerCase().trim() === correct.toString().toLowerCase().trim());

    if (isCorrect) {
        lqMyScore += marks;
        update(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}`), { score: lqMyScore });
    }

    const answerData = {
        answer: selected.toString(),
        correct: isCorrect
    };
    
    let realIndex = lqQuestionOrder[lqCurrentQuestionIndex];
    set(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}/answers/${realIndex}`), answerData);
    set(ref(db, `rooms/${lqRoomCode}/responses/${realIndex}/${lqPlayerName}`), answerData);

    if (btnElement) {
        btnElement.style.backgroundColor = 'var(--green)';
        btnElement.style.color = '#111';
        btnElement.style.borderColor = 'var(--green)';
        btnElement.style.transform = 'scale(1.05)';
    }

    // Disable all options so they can't click again
    document.querySelectorAll('#lq-options-container .lq-btn').forEach(b => {
        b.style.pointerEvents = 'none';
        if (b !== btnElement) {
            b.style.opacity = '0.5';
        }
    });

    const optionsContainer = document.getElementById('lq-options-container');
    const nextBtnContainer = document.createElement('div');
    nextBtnContainer.style.marginTop = '20px';
    
    if (lqCurrentQuestionIndex >= lqQuizData.questions.length - 1) {
        nextBtnContainer.innerHTML = '<h4 style="color:var(--cyan);">Answer submitted! Waiting for host to end the session...</h4>';
    } else {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn-primary lq-btn';
        nextBtn.innerText = 'Next Question ➡️';
        nextBtn.onclick = () => {
            lqCurrentQuestionIndex++;
            lqAnsweredCurrent = false;
            lqRenderQuestion();
        };
        nextBtnContainer.appendChild(nextBtn);
    }
    optionsContainer.appendChild(nextBtnContainer);
};

function lqShowLeaderboard(players) {
    window.lqShowView('lq-leaderboard-page');
    const list = document.getElementById('lq-leaderboard-list');
    list.innerHTML = '';

    const sortedPlayers = Object.entries(players || {}).sort((a, b) => b[1].score - a[1].score);

    sortedPlayers.forEach(([name, data], index) => {
        const li = document.createElement('li');
        let medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        li.innerHTML = `<strong>${medal} ${name}</strong>`;
        list.appendChild(li);
    });

    if (isHost) {
        const finalControls = document.getElementById('lq-final-host-controls');
        if(finalControls) finalControls.style.display = 'block';
    }
}

window.lqDownloadCSV = async () => {
    try {
        const snapshot = await get(ref(db, `rooms/${lqRoomCode}/players`));
        const players = snapshot.val() || {};
        
        // Header
        let csvContent = "Name,Total Score";
        for(let i=0; i<lqQuizData.questions.length; i++) {
            csvContent += `,Q${i+1} Answer`;
        }
        csvContent += "\n";

        // Sort players by score
        const sortedPlayers = Object.entries(players).sort((a,b) => b[1].score - a[1].score);

        // Player rows
        for (const [pName, player] of sortedPlayers) {
            let row = `"${player.name || pName}",${player.score || 0}`;
            for(let i=0; i<lqQuizData.questions.length; i++) {
                const ans = (player.answers && player.answers[i]) ? player.answers[i].answer : "Not Answered";
                const escapedAns = ans.replace(/"/g, '""');
                row += `,"${escapedAns}"`;
            }
            csvContent += row + "\n";
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Quiz_Results_Room_${lqRoomCode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Error downloading CSV:", e);
        alert("Failed to download results.");
    }
};
