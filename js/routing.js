// =============================================
//  PAGE ROUTING
// =============================================
async function showPage(name, pathParam = null) {
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === name)
  );

  // Update URL history
  const base = globalThis.BASE_PATH || '/';
  if (name === 'home') {
    globalThis.history.pushState(null, null, base);
  } else if (name === 'project-detail' && pathParam) {
    globalThis.history.pushState(null, null, base + 'project/' + encodeURIComponent(pathParam));
  } else {
    globalThis.history.pushState(null, null, base + name);
  }

  // Fetch HTML view and inject
  try {
    const res = await fetch(`pages/${name}.html`);
    if (!res.ok) throw new Error(`Page not found: pages/${name}.html`);
    const html = await res.text();
    document.getElementById('app-root').innerHTML = html;

    await runPageLogic(name);
  } catch (err) {
    console.error("Error in showPage:", err);
    document.getElementById('app-root').innerHTML = '<div class="page active"><div class="page-inner"><h1>404 - Page Not Found</h1></div></div>';
  }

  globalThis.scrollTo({ top: 0, behavior: 'smooth' });
}

async function runPageLogic(name) {
  if (name === 'home') renderHome();
  else if (name === 'sessions') renderSessionsList();
  else if (name === 'session-detail') renderSessionDetail();
  else if (name === 'projects') await renderProjects();
  else if (name === 'project-detail') await renderProjectDetail();
  else if (name === 'about') renderAbout();
  else if (name === 'whiteboard' && globalThis.initWhiteboard) globalThis.initWhiteboard();
}

function toggleMobileMenu() {
  const navMobile = document.getElementById('navMobile');
  if (navMobile) navMobile.classList.toggle('open');
}

function toggleFullScreen(element) {
  if (document.fullscreenElement) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  } else if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) { /* Safari */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) { /* IE11 */
    element.msRequestFullscreen();
  }
}
