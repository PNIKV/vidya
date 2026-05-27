// =============================================
//  BOOTSTRAP — load all JSON files
// =============================================
async function init() {
  try {
    const siteRes = await fetch('site.json?t=' + Date.now());
    SITE = await siteRes.json();
  } catch (e) {
    console.error('Could not load site.json', e);
    return;
  }

  // Load all session JSONs in parallel (grade-grouped structure)
  const allSessionPaths = [];
  if (SITE.sessions && typeof SITE.sessions === 'object' && !Array.isArray(SITE.sessions)) {
    for (const [grade, paths] of Object.entries(SITE.sessions)) {
      if (Array.isArray(paths)) {
        for (const path of paths) {
          allSessionPaths.push({ grade, path });
        }
      }
    }
  }

  const sessionLoads = allSessionPaths.map(async ({ grade, path }) => {
    try {
      const res = await fetch(path + '?t=' + Date.now());
      if (!res.ok) return;                  // skip missing files silently
      const data = await res.json();

      // Parse grade and session number from path/filename to guarantee uniqueness
      // e.g. "sessions/grade-1/3session.json" -> grade = "grade-1", number = 3
      const match = path.match(/sessions\/(grade-\d+)\/(\d+)session\.json/i);
      let sessionGrade = grade;
      let sessionNum = data.number;
      if (match) {
        sessionGrade = match[1];
        sessionNum = parseInt(match[2]);
      }

      data.id = `${sessionGrade}-session-${sessionNum}`;
      data.number = sessionNum;
      data._grade = sessionGrade;                  // tag which grade it belongs to

      SESSIONS[data.id] = data;
    } catch (e) {
      console.warn(`Could not load ${path}`, e);
    }
  });

  // Load projects JSON
  const projectLoad = (async () => {
    try {
      const res = await fetch(SITE.projects_file + '?t=' + Date.now());
      const data = await res.json();
      PROJECTS = data.projects || [];
    } catch (e) {
      console.warn('Could not load projects.json', e);
    }
  })();

  await Promise.all([...sessionLoads, projectLoad]);

  // Sort successfully loaded sessions and reconstruct SITE.sessions array for backward compatibility
  const loadedSessions = Object.values(SESSIONS).sort((a, b) => {
    const gA = parseInt(a._grade.replace('grade-', '')) || 0;
    const gB = parseInt(b._grade.replace('grade-', '')) || 0;
    if (gA !== gB) return gA - gB;
    return a.number - b.number;
  });

  SITE.sessions = loadedSessions.map(s => ({
    id: s.id,
    number: s.number,
    file: `sessions/${s._grade}/${s.number}session.json`
  }));

  renderHome();
  renderSessionsList();
  renderProjects();
  renderLeaderboard();
  renderAbout();

  // Handle initial load based on path or redirect
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPage = urlParams.get('p');
  let targetPage = 'home';
  const validPages = ['home', 'sessions', 'projects', 'whiteboard', 'live-quiz', 'about', 'session-detail'];

  if (redirectPage && validPages.includes(redirectPage)) {
    targetPage = redirectPage;
    // Clean up the URL in history (removes ?p=live-quiz)
    window.history.replaceState(null, null, redirectPage);
  } else {
    const pathSegment = window.location.pathname.split('/').filter(Boolean).pop();
    if (pathSegment && validPages.includes(pathSegment) && pathSegment !== 'VIDYA') {
      targetPage = pathSegment;
    }
  }
  showPage(targetPage);
}

// =============================================
//  HISTORY NAV (Back/Forward)
// =============================================
window.addEventListener('popstate', () => {
  const pathSegment = window.location.pathname.split('/').filter(Boolean).pop();
  const validPages = ['home', 'sessions', 'projects', 'whiteboard', 'live-quiz', 'about', 'session-detail'];

  if (pathSegment && validPages.includes(pathSegment) && pathSegment !== 'VIDYA') {
    showPage(pathSegment);
  } else {
    showPage('home');
  }
});

// =============================================
//  KEYBOARD NAV (Lightbox only)
// =============================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

// =============================================
//  NAVBAR SCROLL
// =============================================
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.style.background =
    window.scrollY > 20 ? 'rgba(13,15,26,0.98)' : 'rgba(13,15,26,0.9)';
});

// =============================================
//  BOOT
// =============================================
document.addEventListener('DOMContentLoaded', init);
