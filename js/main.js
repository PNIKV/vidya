// =============================================
//  BOOTSTRAP — load all JSON files
// =============================================
async function loadSessions() {
  const promises = [];
  if (SITE?.sessions) {
    for (const [grade, files] of Object.entries(SITE.sessions)) {
      if (Array.isArray(files)) {
        for (const file of files) {
          promises.push(
            fetch(file)
              .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
              })
              .then(data => {
                data._grade = grade;
                SESSIONS[data.id] = data;
              })
              .catch(e => console.warn(`Failed to load session ${file}:`, e))
          );
        }
      }
    }
  }
  await Promise.allSettled(promises);
}

async function loadProjects() {
  const filePath = SITE?.projects_file || 'projects/datafolder/compiled_projects.json';
  console.log('[loadProjects] Fetching:', filePath);
  try {
    const res = await fetch(filePath);
    console.log('[loadProjects] Response:', res.status, res.ok);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    console.log('[loadProjects] Parsed JSON, isArray:', Array.isArray(data), ', length:', data?.length);
    if (data && Array.isArray(data) && data.length > 0) {
      PROJECTS.length = 0;
      data.forEach(projData => PROJECTS.push(projData));
      console.log('[loadProjects] SUCCESS — loaded', PROJECTS.length, 'projects into PROJECTS array');
    }
  } catch (e) {
    console.error('[loadProjects] FAILED:', e);
  }
}

function resolveInitialRoute() {
  const urlParams = new URLSearchParams(globalThis.location.search);
  const redirectPage = urlParams.get('p');
  let targetPage = 'home';
  let targetParam = null;
  const validPages = new Set(['home', 'sessions', 'projects', 'whiteboard', 'about', 'session-detail', 'project-detail']);

  if (redirectPage) {
    const base = globalThis.BASE_PATH || '/';
    const projectMatch = /^project\/(.+)$/.exec(redirectPage);
    if (projectMatch) {
      targetPage = 'project-detail';
      targetParam = decodeURIComponent(projectMatch[1]);
      globalThis.history.replaceState(null, null, base + 'project/' + encodeURIComponent(targetParam));
    } else if (validPages.has(redirectPage)) {
      targetPage = redirectPage;
      globalThis.history.replaceState(null, null, base + redirectPage);
    }
  } else {
    const pathSegments = globalThis.location.pathname.split('/').filter(Boolean);
    const repoIndex = pathSegments.indexOf('vidya');
    const routeSegments = repoIndex >= 0 ? pathSegments.slice(repoIndex + 1) : pathSegments;

    if (routeSegments.length >= 2 && routeSegments.at(-2) === 'project') {
      targetPage = 'project-detail';
      targetParam = decodeURIComponent(routeSegments.at(-1));
    } else {
      const pathSegment = routeSegments.pop();
      if (pathSegment && validPages.has(pathSegment) && pathSegment !== 'VIDYA') {
        targetPage = pathSegment;
      }
    }
  }

  console.log('[resolveInitialRoute] targetPage:', targetPage, ', targetParam:', targetParam);
  return { targetPage, targetParam };
}

async function init() {
  console.log('[init] START — loading site.json...');
  try {
    const siteRes = await fetch('data/site.json');
    console.log('[init] site.json response:', siteRes.status, siteRes.ok);
    SITE = await siteRes.json(); // NOSONAR
  } catch (e) {
    console.error('[init] Could not load data/site.json — ABORTING init!', e);
    return;
  }

  globalThis.initTheme();
  console.log('[init] Loading sessions and projects...');
  await Promise.all([loadSessions(), loadProjects()]);
  console.log('[init] Data loaded — PROJECTS:', PROJECTS.length, ', SESSIONS:', Object.keys(SESSIONS).length);

  // Sort successfully loaded sessions and reconstruct SITE.sessions array for backward compatibility
  const loadedSessions = Object.values(SESSIONS).sort((a, b) => {
    const gA = Number.parseInt(a._grade.replace('grade-', '')) || 0;
    const gB = Number.parseInt(b._grade.replace('grade-', '')) || 0;
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
  renderAbout();

  const { targetPage: initialPage, targetParam } = resolveInitialRoute();
  let targetPage = initialPage;

  if (targetPage === 'project-detail') {
    currentProject = PROJECTS.find(p => p.id === targetParam); // NOSONAR
    if (currentProject) {
      console.log('[init] Showing project-detail for:', targetParam);
      await showPage(targetPage, targetParam);
      return;
    } else {
      targetPage = 'projects';
    }
  }

  console.log('[init] Calling showPage("' + targetPage + '")...');
  await showPage(targetPage);
  console.log('[init] DONE');
}

// =============================================
//  HISTORY NAV (Back/Forward)
// =============================================
globalThis.addEventListener('popstate', () => {
  const pathSegments = globalThis.location.pathname.split('/').filter(Boolean);
  const validPages = ['home', 'sessions', 'projects', 'whiteboard', 'about', 'session-detail', 'project-detail'];

  // Filter out the repo name (e.g. "vidya") from the path segments
  const repoIndex = pathSegments.indexOf('vidya');
  const routeSegments = repoIndex >= 0 ? pathSegments.slice(repoIndex + 1) : pathSegments;

  if (routeSegments.length >= 2 && routeSegments.at(-2) === 'project') {
    const targetParam = decodeURIComponent(routeSegments.at(-1));
    currentProject = PROJECTS.find(p => p.id === targetParam);
    if (currentProject) {
      showPage('project-detail', targetParam);
      return;
    }
  }

  const pathSegment = routeSegments.pop();
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

// =============================================
//  THEME TOGGLE
// =============================================
globalThis.initTheme = function() {
  const saved = localStorage.getItem('vidya_theme') || 'dark';
  if (saved === 'light') {
    document.documentElement.dataset.theme = 'light';
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '🌙';
  }
};

globalThis.toggleTheme = function() {
  const isLight = document.documentElement.dataset.theme === 'light';
  if (isLight) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem('vidya_theme', 'dark');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '☀️';
  } else {
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem('vidya_theme', 'light');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = '🌙';
  }
};
