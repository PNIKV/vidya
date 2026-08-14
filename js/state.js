// =============================================
//  GLOBAL STATE
// =============================================
window.BASE_PATH = window.location.pathname.includes('/vidya') ? '/vidya/' : '/';
let SITE = null;          // site.json
let SESSIONS = {};        // { id: sessionData }
let PROJECTS = [];        // from projects.json
let currentSession = null;
let currentSlide = 0;
let inlineQuizState = {};
let currentProject = null;

// Helper to resolve absolute path from app base root
globalThis.getAppPath = function(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) return path;
  const base = globalThis.BASE_PATH || (globalThis.location.pathname.includes('/vidya') ? '/vidya/' : '/');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base.endsWith('/') ? base + cleanPath : base + '/' + cleanPath;
};
