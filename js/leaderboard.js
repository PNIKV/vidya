// =============================================
//  LEADERBOARD
// =============================================
function getScores() {
  try { return JSON.parse(localStorage.getItem('VIDYASteamScores') || '{}'); }
  catch { return {}; }
}

function saveScore(sessionId, name, score, total) {
  const scores = getScores();
  if (!scores[sessionId]) scores[sessionId] = [];
  scores[sessionId].push({
    name, score, total,
    pct: Math.round((score / total) * 100),
    date: new Date().toLocaleDateString('en-IN')
  });
  scores[sessionId].sort((a, b) => b.pct - a.pct || b.score - a.score);
  scores[sessionId] = scores[sessionId].slice(0, 20);
  localStorage.setItem('VIDYASteamScores', JSON.stringify(scores));
}

function renderLeaderboard() {
  const wrap = document.getElementById('leaderboardWrap');
  if (!wrap || !SITE) return;
  const scores = getScores();
  const ordered = SITE.sessions.map(e => SESSIONS[e.id]).filter(Boolean);

  wrap.innerHTML = ordered.map(s => {
    const entries = scores[s.id] || [];
    const medals = ['🥇', '🥈', '🥉'];
    const rows = entries.slice(0, 10).map((e, i) => `
    <tr>
      <td class="lb-rank lb-rank-${i + 1}">${medals[i] || i + 1}</td>
      <td>${e.name}</td>
      <td>${e.date || ''}</td>
      <td class="lb-score">${e.score}/${e.total} (${e.pct}%)</td>
    </tr>`).join('');
    return `
    <div class="lb-section">
      <h3>
        <span style="background:${s.color};padding:4px 10px;border-radius:6px;font-size:0.75rem">
          Session ${s.number}
        </span>
        ${s.icon} ${s.title}
      </h3>
      ${entries.length === 0
        ? `<div class="lb-empty">No scores yet. Take the quiz to be first! 🏆</div>`
        : `<table class="lb-table">
            <thead><tr><th>#</th><th>Name</th><th>Date</th><th>Score</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>`}
    </div>`;
  }).join('');
}
