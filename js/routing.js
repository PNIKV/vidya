// =============================================
//  PAGE ROUTING
// =============================================
async function showPage(name) {
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === name)
  );

  // Update URL history
  if (name === 'home') {
    window.history.pushState(null, null, window.location.pathname);
  } else {
    window.history.pushState(null, null, '#' + name);
  }

  // Fetch HTML view and inject
  try {
    const res = await fetch(`pages/${name}.html`);
    if (!res.ok) throw new Error('Page not found');
    const html = await res.text();
    document.getElementById('app-root').innerHTML = html;

    // Run specific logic for the loaded page
    if (name === 'home') renderHome();
    if (name === 'sessions') renderSessionsList();
    if (name === 'session-detail') renderSessionDetail();
    if (name === 'projects') renderProjects();
    if (name === 'about') renderAbout();
    if (name === 'whiteboard' && window.initWhiteboard) window.initWhiteboard();
    if (name === 'live-quiz' && window.initLiveQuiz) window.initLiveQuiz();
    renderLeaderboard();
  } catch (err) {
    document.getElementById('app-root').innerHTML = '<div class="page active"><div class="page-inner"><h1>404 - Page Not Found</h1></div></div>';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  const navMobile = document.getElementById('navMobile');
  if (navMobile) navMobile.classList.toggle('open');
}

function toggleFullScreen(element) {
  if (!document.fullscreenElement) {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { /* Safari */
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { /* IE11 */
      element.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  }
}
