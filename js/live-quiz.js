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
let lqQuizData = null;  // Contains the specific grade being played
let lqCurrentQuestionIndex = -1;
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
        const [qRes, sRes, tRes] = await Promise.all([
            fetch('live-quiz-data/questions.json'),
            fetch('live-quiz-data/students.json'),
            fetch('live-quiz-data/teachers.json')
        ]);
        allQuizData = await qRes.json();
        studentsData = await sRes.json();
        teachersData = await tRes.json();
    } catch(e) {
        console.error("Failed to load live quiz data files", e);
    }
};

window.lqHostLogin = async () => {
    const hostName = document.getElementById('lq-host-name').value.trim();
    const hostPass = document.getElementById('lq-host-pass').value.trim();
    const gradeSelect = document.getElementById('lq-host-grade').value;

    if (teachersData && teachersData.teachers) {
        const validTeacher = teachersData.teachers.find(t => t.name === hostName && t.password === hostPass);
        if (!validTeacher) {
            alert("Invalid Teacher Name or Password!");
            return;
        }
    } else {
        alert("Teacher data not loaded!");
        return;
    }

    if (!allQuizData || !allQuizData[gradeSelect]) {
        alert("Quiz data for selected class/grade not found!");
        return;
    }

    lqQuizData = allQuizData[gradeSelect];
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

    // Add teacher to players list so they can play along
    await set(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}`), { 
        name: lqPlayerName,
        score: 0,
        school: "Teacher"
    });

    window.lqShowView('lq-host-setup-page');
    lqListenToPlayers();
    lqListenToGame();
}

window.lqStartGame = () => {
    update(ref(db, `rooms/${lqRoomCode}`), {
        status: 'active',
        currentQuestion: 0,
        startTime: Date.now() // Start the 10 min timer
    });
    const hostControls = document.getElementById('lq-host-controls');
    if(hostControls) hostControls.style.display = 'block';
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
        const validStudent = studentsData.students.find(s => s.name === lqPlayerName && s.password === lqPlayerPass);
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
            document.getElementById('lq-timer-display').innerText = "⏱️ Time's Up!";
            
            // Disable buttons locally
            document.getElementById('lq-options-container').innerHTML = '<h3 style="color:var(--red);">Time is up! Waiting for host...</h3>';

            // Only host actually calls endQuiz to update DB
            if (isHost) {
                window.lqEndQuiz();
            }
            return;
        }

        const m = Math.floor(remaining / 60).toString().padStart(2, '0');
        const s = (remaining % 60).toString().padStart(2, '0');
        document.getElementById('lq-timer-display').innerText = `⏱️ ${m}:${s}`;
    }, 1000);
}

function lqListenToGame() {
    onValue(ref(db, `rooms/${lqRoomCode}`), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        if (data.status === 'active') {
            if (lqCurrentQuestionIndex === -1 && data.currentQuestion >= 0) {
                lqCurrentQuestionIndex = 0;
                lqAnsweredCurrent = false;
                
                // If this is the first question, start the 10-minute timer using the DB start time
                if(data.startTime) {
                    startTimer(data.startTime);
                }

                lqRenderQuestion();
            }
        } else if (data.status === 'ended') {
            if(timerInterval) clearInterval(timerInterval);
            lqShowLeaderboard(data.players);
        }
    });
}

function lqRenderQuestion() {
    window.lqShowView('lq-quiz-page');
    let qData = lqQuizData?.questions[lqCurrentQuestionIndex];
    if (!qData) return;
    
    document.getElementById('lq-question-text').innerText = qData.text || qData.question;

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
        const btn = document.createElement('button');
        btn.className = 'btn-primary lq-btn';
        btn.innerText = 'Submit';
        btn.onclick = () => window.lqSubmitAnswer(document.getElementById('lq-text-answer').value, qData.answer, qData.marks, btn);
        optionsContainer.appendChild(input);
        optionsContainer.appendChild(btn);
    }
}

window.lqSubmitAnswer = (selected, correct, marks, btnElement) => {
    if (lqAnsweredCurrent) return;
    lqAnsweredCurrent = true;

    const isCorrect = selected.toString().toLowerCase().trim() === correct.toString().toLowerCase().trim();

    if (isCorrect) {
        lqMyScore += marks;
        update(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}`), { score: lqMyScore });
    }

    const answerData = {
        answer: selected.toString(),
        correct: isCorrect
    };
    
    set(ref(db, `rooms/${lqRoomCode}/players/${lqPlayerName}/answers/${lqCurrentQuestionIndex}`), answerData);
    set(ref(db, `rooms/${lqRoomCode}/responses/${lqCurrentQuestionIndex}/${lqPlayerName}`), answerData);

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
