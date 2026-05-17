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

  // Load all session JSONs in parallel
  const sessionLoads = SITE.sessions.map(async (entry) => {
    try {
      const res = await fetch(entry.file + '?t=' + Date.now());
      const data = await res.json();
      SESSIONS[data.id] = data;
    } catch (e) {
      console.warn(`Could not load ${entry.file}`, e);
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
    if (pathSegment && validPages.includes(pathSegment) && pathSegment !== 'vidya') {
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
  
  if (pathSegment && validPages.includes(pathSegment) && pathSegment !== 'vidya') {
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
