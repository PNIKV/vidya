// =============================================
//  SESSIONS LIST
// =============================================
function renderSessionsList() {
  const grid = document.getElementById('sessionsListGrid');
  if (!grid || !SITE) return;

  const gradeFilterEl = document.getElementById('gradeFilter');
  const gradeFilter = gradeFilterEl ? gradeFilterEl.value : 'all';

  // ✅ Get all sessions, filter by _grade tag
  let ordered = Object.values(SESSIONS);

  if (gradeFilter !== 'all') {
    ordered = ordered.filter(s => s._grade === gradeFilter);
  }

  // Sort by grade number then session number
  ordered.sort((a, b) => {
    const gA = parseInt(a._grade.replace('grade-', '')) || 0;
    const gB = parseInt(b._grade.replace('grade-', '')) || 0;
    if (gA !== gB) return gA - gB;
    return a.number - b.number;
  });

  grid.innerHTML = ordered.map(s => sessionCardHTML(s)).join('');
}

function sessionCardHTML(s) {
  if (!s) return '';
  const slideCount = s.slides?.images?.length || (s.slides?.pptx ? 'PPTX' : 0);
  const imgCount = s.images?.gallery?.length || 0;
  return `
    <div class="session-card" style="--card-color:${s.color}" onclick="openSession('${s.id}')">
      <div class="session-card-num">Session ${String(s.number).padStart(2, '0')} · ${s.phase}</div>
      <div class="session-card-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.overview.substring(0, 120)}…</p>
      <div class="session-card-tags">${(s.tags || []).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="session-card-footer">
        <span class="session-card-meta">⏱ ${s.duration} · ${slideCount} Slides · ${imgCount} Photos</span>
        <button class="btn-sm" style="background:${s.color}" onclick="event.stopPropagation();openSession('${s.id}')">Open ↗</button>
      </div>
    </div>`;
}

// =============================================
//  SESSION DETAIL
// =============================================
function openSession(id) {
  currentSession = SESSIONS[id];
  if (!currentSession) return;
  currentSlide = 0;
  renderSessionDetail();
  showPage('session-detail');
}

function renderSessionDetail() {
  const s = currentSession;
  const container = document.getElementById('sessionDetailContent');
  if (!container) return;

  const slideCount = s.slides?.images?.length || (s.slides?.pptx ? 'PPTX' : 0);
  const imgCount = s.images?.gallery?.length || 0;

  container.innerHTML = `
    <div class="session-detail-header">
      <div class="sd-back" onclick="showPage('sessions')">← Back to Sessions</div>
      <div class="sd-phase" style="color:${s.color}">Session ${String(s.number).padStart(2, '0')} · ${s.phase}</div>
      <h1 class="sd-title">${s.icon} ${s.title}</h1>
      <p class="sd-subtitle">${s.subtitle}</p>
      <div class="sd-meta-row">
        <span class="sd-meta-item">⏱ ${s.duration}</span>
        <span class="sd-meta-item">📅 ${s.date}</span>
        <span class="sd-meta-item">🗂 ${slideCount} Slides</span>
        <span class="sd-meta-item">🖼 ${imgCount} Photos</span>
        <span class="sd-meta-item">🧠 ${s.quiz.length} Quiz Qs</span>
        <span class="sd-meta-item">🎬 ${s.youtubeVideos.length} Videos</span>
      </div>
    </div>

    <div class="sd-tabs-container" style="position: sticky; top: 68px; z-index: 100; background: var(--bg); padding-top: 10px; margin-bottom: 32px;">
      <div class="sd-tabs" id="sdTabs" style="margin-bottom: 0;">
        <button class="sd-tab active" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('slides',this)">📊 Slides</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('topics',this)">📚 Key Topics</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('videos',this)">🎬 Videos</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('images',this)">🖼 Images (${imgCount})</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('activity',this)">🔧 Activity</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('resources',this)">🔗 Resources</button>
        <button class="sd-tab" style="font-size: 1rem; padding: 12px 24px;" onclick="switchTab('quiz',this)">🧠 Quiz</button>
      </div>
    </div>

    <div class="sd-overview" style="border-color:${s.color}; margin-bottom: 48px;">${s.overview}</div>

    <!-- SLIDES -->
    <div id="tab-slides" class="sd-tab-content active">
      ${renderSlidesTab(s)}
    </div>

    <!-- KEY TOPICS -->
    <div id="tab-topics" class="sd-tab-content">
      <div class="topics-list">
        ${(s.keyTopics || []).map(t => `
          <div class="topic-item">
            <div class="topic-bullet" style="background:${s.color}"></div>
            <span class="topic-text">${t}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- VIDEOS -->
    <div id="tab-videos" class="sd-tab-content">
      <div class="videos-grid">
        ${(s.youtubeVideos || []).map(v => `
          <div class="video-card">
            <div class="video-thumb">
              <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen loading="lazy"></iframe>
            </div>
            <div class="video-info">
              <div class="video-title">${v.title}</div>
              <div class="video-desc">${v.desc}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- IMAGES GALLERY -->
    <div id="tab-images" class="sd-tab-content">
      ${renderImagesTab(s)}
    </div>

    <!-- ACTIVITY -->
    <div id="tab-activity" class="sd-tab-content">
      <h2 style="font-family:var(--font-head);font-size:1.5rem;font-weight:800;margin-bottom:24px;color:${s.color}">
        🔧 ${s.activity.title}
      </h2>
      <div class="activity-box">
        <div class="activity-panel">
          <h3>🛒 What You Need</h3>
          <div class="activity-parts">
            ${(s.activity.parts || []).map(p => `
              <div class="activity-part">
                <div class="activity-part-dot" style="background:${s.color}"></div>${p}
              </div>`).join('')}
          </div>
        </div>
        <div class="activity-panel">
          <h3>📋 Steps</h3>
          <div class="activity-steps">
            ${(s.activity.steps || []).map((step, i) => `
              <div class="activity-step">
                <div class="activity-step-num" style="background:${s.color}">${i + 1}</div>
                <div class="activity-step-text">${step}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- RESOURCES -->
    <div id="tab-resources" class="sd-tab-content">
      <div class="resources-list">
        ${(s.resources || []).map(r => `
          <a href="${r.url}" target="_blank" class="resource-card">
            <span class="resource-icon">${r.icon}</span>
            <span class="resource-title">${r.title}</span>
            <span class="resource-arrow">→</span>
          </a>`).join('')}
      </div>
    </div>

    <!-- QUIZ -->
    <div id="tab-quiz" class="sd-tab-content">
      <div id="quizInline">${renderQuizStart(s)}</div>
    </div>
  `;
}

// =============================================
//  SLIDES TAB
// =============================================
function renderSlidesTab(s) {
  const pptx = s.slides?.pptx || null;
  const pdf = s.slides?.pdf || null;

  if (!pptx && !pdf) {
    return `
      <div class="slides-placeholder">
        <div class="placeholder-icon">📊</div>
        <h3>Slides Coming Soon</h3>
        <p>Place your Presentation.pdf or .pptx in<br>
           <code>sessions/${s.id}/slides/</code><br>
           then add its path to <code>session.json</code> under <code>slides.pdf</code></p>
      </div>`;
  }

  const iframeUrl = pdf ? `${pdf}#toolbar=0&navpanes=0&scrollbar=0&view=Fit` : pptx;
  const downloadUrl = pdf || pptx;
  const label = pdf ? "📄 Slides PDF" : "📊 PowerPoint File";

  return `
    <div class="slides-ppt" id="slidesPptWrap" style="position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); display: flex; flex-direction: column; height: 70vh; min-height: 500px; background: #f8fafc;">
      <div class="pdf-toolbar" style="background: var(--surface); padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; z-index: 10;">
        <span class="pdf-label" style="font-weight: 700; color: var(--text);">${label} — ${s.title}</span>
        <div style="display: flex; gap: 10px;">
          <button onclick="toggleFullScreen(document.getElementById('slidesPptWrap'))" style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer;">
            ⛶ Full Screen
          </button>
          <a href="${downloadUrl}" target="_blank" class="pdf-open-btn" style="text-decoration: none; background: var(--surface-alt); color: var(--text); padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; border: 1px solid var(--border);">Download ↗</a>
        </div>
      </div>
      <div style="flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: white;">
         <iframe src="${iframeUrl}" style="width: 100%; height: 100%; border: none;" title="${label}"></iframe>
      </div>
    </div>
  `;
}

// =============================================
//  IMAGES GALLERY TAB
// =============================================
function renderImagesTab(s) {
  const gallery = s.images?.gallery || [];

  if (gallery.length === 0) {
    return `
    <div class="slides-placeholder">
      <div class="placeholder-icon">🖼️</div>
      <h3>No Images Yet</h3>
      <p>Add photos from the session into<br>
         <code>sessions/${s.id}/images/</code><br>
         then add their paths to <code>session.json</code> under <code>images.gallery</code></p>
    </div>`;
  }

  const categories = [...new Set(gallery.map(g => g.category || 'General'))];

  return `
  <div class="gallery-filters" id="galleryFilters">
    <button class="gallery-filter-btn active" onclick="filterGallery('all', this)">All (${gallery.length})</button>
    ${categories.map(c => `
      <button class="gallery-filter-btn" onclick="filterGallery('${c}', this)">
        ${c} (${gallery.filter(g => (g.category || 'General') === c).length})
      </button>`).join('')}
  </div>
  <div class="gallery-grid" id="galleryGrid">
    ${gallery.map((img, i) => `
      <div class="gallery-item" data-category="${img.category || 'General'}" onclick="openLightbox(${i}, '${s.id}')">
        <div class="gallery-img-wrap">
          <img
            src="${img.file}"
            alt="${img.caption || ''}"
            class="gallery-img"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'gallery-img-missing\\'><span>🖼️</span><small>${img.file.split('/').pop()}</small></div>'"
          />
          <div class="gallery-overlay">
            <span class="gallery-zoom">🔍</span>
          </div>
        </div>
        <div class="gallery-caption">
          <span class="gallery-cat-badge">${img.category || 'General'}</span>
          <p>${img.caption || ''}</p>
        </div>
      </div>`).join('')}
  </div>

  <!-- Lightbox -->
  <div id="lightbox" class="lightbox" style="display:none" onclick="closeLightbox()">
    <div class="lightbox-inner" onclick="event.stopPropagation()">
      <button class="lightbox-close" onclick="closeLightbox()">✕</button>
      <button class="lightbox-prev" onclick="lightboxNav(-1)">←</button>
      <button class="lightbox-next" onclick="lightboxNav(1)">→</button>
      <img id="lightboxImg" src="" alt="" class="lightbox-img" />
      <div class="lightbox-caption" id="lightboxCaption"></div>
      <div class="lightbox-counter" id="lightboxCounter"></div>
    </div>
  </div>`;
}

let lightboxIndex = 0;
function openLightbox(idx, sessionId) {
  const s = SESSIONS[sessionId] || currentSession;
  const gallery = s.images?.gallery || [];
  lightboxIndex = idx;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.style.display = 'flex';
  updateLightbox(gallery);
}

function updateLightbox(gallery) {
  const img = gallery[lightboxIndex];
  const imgEl = document.getElementById('lightboxImg');
  const capEl = document.getElementById('lightboxCaption');
  const cntEl = document.getElementById('lightboxCounter');
  if (imgEl) imgEl.src = img.file;
  if (capEl) capEl.textContent = img.caption || '';
  if (cntEl) cntEl.textContent = `${lightboxIndex + 1} / ${gallery.length}`;
}

function lightboxNav(dir) {
  const gallery = currentSession?.images?.gallery || [];
  lightboxIndex = (lightboxIndex + dir + gallery.length) % gallery.length;
  updateLightbox(gallery);
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
}

function filterGallery(category, btn) {
  document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.gallery-item').forEach(item => {
    const show = category === 'all' || item.dataset.category === category;
    item.style.display = show ? '' : 'none';
  });
}

// =============================================
//  TAB SWITCHING
// =============================================
function switchTab(name, btn) {
  document.querySelectorAll('.sd-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sd-tab').forEach(t => t.classList.remove('active'));
  const tab = document.getElementById('tab-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
}
