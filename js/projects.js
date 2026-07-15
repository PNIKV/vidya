// =============================================
//  PROJECTS GALLERY
// =============================================

let tagsInitialized = false;

function initProjectFilters() {
  if (tagsInitialized || typeof PROJECTS === 'undefined' || !PROJECTS) return;
  const mcSet = new Set();
  const compSet = new Set();

  PROJECTS.forEach(p => {
    if (p.hardwareSpecs?.microcontroller) {
      mcSet.add(p.hardwareSpecs.microcontroller);
    }
    if (p.componentRefs) {
      p.componentRefs.forEach(c => compSet.add(c));
    }
  });

  const mcSelect = document.getElementById('filterMicrocontroller');
  if (mcSelect) {
    Array.from(mcSet).sort((a, b) => a.localeCompare(b)).forEach(mc => {
      mcSelect.innerHTML += `<option value="${mc}">${mc}</option>`;
    });
  }

  const compSelect = document.getElementById('filterComponent');
  if (compSelect) {
    Array.from(compSet).sort((a, b) => a.localeCompare(b)).forEach(c => {
      compSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  tagsInitialized = true;
}

function renderProjects() {
  initProjectFilters();
  const grid = document.getElementById('projectsGrid');
  const countEl = document.getElementById('projectsCount');
  if (!grid) return;

  if (typeof PROJECTS === 'undefined' || !PROJECTS?.length) {
    grid.innerHTML = `<div class="projects-empty"><div class="projects-empty-icon">📂</div><h3>No Projects Found</h3></div>`;
    if (countEl) countEl.textContent = '0 Projects';
    return;
  }

  const searchInput = document.getElementById('projectSearchInput');
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const diffSelect = document.getElementById('filterDifficulty');
  const diffVal = diffSelect ? diffSelect.value : 'all';

  const mcSelect = document.getElementById('filterMicrocontroller');
  const mcVal = mcSelect ? mcSelect.value : 'all';

  const compSelect = document.getElementById('filterComponent');
  const compVal = compSelect ? compSelect.value : 'all';

  let filtered = PROJECTS.filter(p => {
    // Search match
    const searchString = `${p.id} ${p.title} ${p.subtitle || ''} ${p.desc || ''} ${p.fullDesc || ''}`.toLowerCase();
    const matchesSearch = searchTerm === '' || searchString.includes(searchTerm);

    const matchesDiff = diffVal === 'all' || p.difficulty == diffVal;

    const matchesMc = mcVal === 'all' || (p.hardwareSpecs && p.hardwareSpecs.microcontroller === mcVal);

    const matchesComp = compVal === 'all' || p.componentRefs?.includes(compVal);

    return matchesSearch && matchesDiff && matchesMc && matchesComp;
  });

  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} Project${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="projects-empty"><div class="projects-empty-icon">🔍</div><h3>No Matches</h3><p>Try adjusting your filters or search term.</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div class="project-card" onclick="openProject('${p.id}')" style="--card-glow: ${p.color || 'var(--orange)'}33">
      <div class="project-img-wrap">
        <img src="${p.image || ''}" alt="${p.title}" onerror="this.src='icons/vidya-logo.png'; this.classList.add('fallback-img')" class="project-img" />
        <div class="project-img-overlay"></div>
      </div>
      
      <div class="project-body">
        <div class="project-body-top">
          <span class="project-level level-${p.level || 'Beginner'}">${p.level || 'Beginner'}</span>
        </div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        
        <div class="project-difficulty-wrap">
          <span class="project-difficulty-label">Diff</span>
          <div class="project-difficulty-bars">
            ${[1, 2, 3, 4, 5].map(n => `<div class="difficulty-bar ${n <= (p.difficulty || 1) ? 'filled' : ''}" style="--bar-color: ${p.color || 'var(--orange)'}"></div>`).join('')}
          </div>
        </div>
      </div>
      
      <div class="project-card-footer">
        <div class="project-card-meta">
        </div>
        <button class="project-card-open" style="background-color: ${p.color || 'var(--orange)'};" onclick="event.stopPropagation();openProject('${p.id}')">Open ↗</button>
      </div>
    </div>
  `).join('');
}

function filterProjects() {
  renderProjects();
}

// =============================================
//  PROJECT DETAIL
// =============================================

function openProject(id) {
  currentProject = PROJECTS.find(p => p.id === id);
  if (!currentProject) return;
  showPage('project-detail', id);
}

async function renderProjectDetail() {
  const p = currentProject;
  const container = document.getElementById('projectDetailContent');
  if (!container) return;

  const files3dCount = p.files3d?.length || 0;
  const codeCount = p.codeFiles?.length || 0;
  const dataVideoCount = p.dataVideos?.length || 0;
  const ytVideoCount = p.youtubeVideos?.length || 0;
  const imgCount = p.gallery?.length || 0;
  const resCount = p.resources?.length || 0;

  const hasPoster = !!p.poster || (p.posters && p.posters.length > 0);
  const hasResearch = !!p.researchPaper || (p.presentationPdfs && p.presentationPdfs.length > 0);
  const hasCircuit = !!p.circuitDiagram;
  const hasComponents = (p.componentRefs && p.componentRefs.length > 0) || (p.components && p.components.length > 0);
  const hasAchievements = p.achievements && p.achievements.length > 0;
  const hasPresentationTab = hasPoster || hasResearch || hasCircuit || ytVideoCount > 0;

  // Custom slider for banner images
  const slideImages = p.bannerImages && p.bannerImages.length > 0
    ? p.bannerImages
    : [p.image || ''];

  const hasMultipleBanners = slideImages.length > 1;

  const bannerContent = hasMultipleBanners ? `
    <div class="ws-slider" id="wsSliderTrack" style="position:absolute; top:0; left:0; width:${slideImages.length * 100}%; height:100%; display:flex; transition: transform 0.8s cubic-bezier(0.25,0.46,0.45,0.94);">
        ${slideImages.map((src, i) => `
          <div style="width:${100 / slideImages.length}%; height:100%; flex-shrink:0;">
            <img src="${src}" style="width:100%; height:100%; object-fit:cover; display:block;" />
          </div>
        `).join('')}
    </div>
    <button class="ws-slider-arrow ws-slider-prev" onclick="event.stopPropagation(); wsSliderNav(-1)" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); z-index:5; background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:50%; width:36px; height:36px; font-size:1.2rem; cursor:pointer; backdrop-filter:blur(4px); transition:background 0.2s;">❮</button>
    <button class="ws-slider-arrow ws-slider-next" onclick="event.stopPropagation(); wsSliderNav(1)" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); z-index:5; background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:50%; width:36px; height:36px; font-size:1.2rem; cursor:pointer; backdrop-filter:blur(4px); transition:background 0.2s;">❯</button>
    <div class="ws-slider-dots" id="wsSliderDots" style="position:absolute; bottom:80px; left:50%; transform:translateX(-50%); z-index:5; display:flex; gap:8px;">
      ${slideImages.map((_, i) => `<span onclick="event.stopPropagation(); wsSliderGoTo(${i})" style="width:10px; height:10px; border-radius:50%; background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.4)'}; cursor:pointer; transition:background 0.3s;"></span>`).join('')}
    </div>
  ` : `<div style="background-image: url('${slideImages[0]}'); width:100%; height:100%; position:absolute; top:0; left:0; background-size:cover; background-position:center; opacity:0.6;"></div>`;

  let descHtml = '';
  if (p.fullDesc) {
    descHtml = `<div style="margin-bottom: 32px; line-height: 1.7; color: var(--text-muted);">${p.fullDesc.replaceAll('\n', '<br>')}</div>`;
  } else if (p.desc) {
    descHtml = `<div style="margin-bottom: 32px; line-height: 1.7; color: var(--text-muted);">${p.desc}</div>`;
  }

  container.innerHTML = `
    <!-- Header -->
    <div class="pd-header" style="position:relative; overflow:hidden;">
      <button class="pd-back" onclick="showPage('projects')" style="position:relative; z-index:10;">← Back to Projects</button>
      
      <div class="pd-banner" style="background: #000; position:relative;">
        ${bannerContent}
        <div class="pd-banner-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, #0d0f1a, transparent); z-index:1;"></div>
        <div class="pd-banner-content" style="z-index:2;">
          <h1 class="pd-banner-title" style="--project-color: ${p.color || 'var(--orange)'}">${p.title}</h1>
          
          <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            ${p.liveUrl ? `<a href="${p.liveUrl}" target="_blank" class="btn-primary" style="background: ${p.color || 'var(--orange)'}; border: none; box-shadow: 0 0 20px ${p.color || 'var(--orange)'}44; padding: 12px 24px; font-size: 0.95rem;">🚀 Launch Live Project</a>` : ''}
            ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" class="btn-outline" style="border-color: #fff; color: #fff; padding: 12px 24px; font-size: 0.95rem;">GitHub Repo ↗</a>` : ''}
            <div style="display: flex; gap: 12px; align-items: center;">
              <span class="pd-meta-chip">👤 ${p.author || 'Tinkering Lab'}</span>
              <span class="pd-meta-chip">🕒 ${p.date || 'Unknown'}</span>
              <div class="pd-difficulty-stars" style="color: ${p.color || 'var(--orange)'}; font-size: 1.2rem; margin-left: 4px;">
                ${'★'.repeat(p.difficulty || 1)}${'☆'.repeat(5 - (p.difficulty || 1))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pd-team-section" style="margin-bottom: 32px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
        ${(p.team || []).length > 0 ? p.team.map(member => `
          <div class="pd-team-member" style="display: flex; align-items: center; gap: 10px;">
            <div class="pd-team-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid ${p.color || 'var(--orange)'};">${member.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style="font-weight: bold; font-size: 0.95rem;">${member.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${member.role}</div>
            </div>
          </div>
        `).join('') : ''}
      </div>
    </div>

    <!-- Tabs Nav -->
    <div class="pd-tabs-container">
      <div class="pd-tabs" style="overflow-x: auto; flex-wrap: nowrap; padding-bottom: 10px;">
        <button class="pd-tab active" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('overview', this)">📋 Overview</button>
        ${hasPresentationTab ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('presentation', this)">📑 Presentation</button>` : ''}
        ${hasAchievements ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('achievements', this)">🏆 Achievements</button>` : ''}
        ${files3dCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('3d', this)">🖨️ 3D (${files3dCount})</button>` : ''}
        ${codeCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('code', this)">💻 Code (${codeCount})</button>` : ''}
        ${dataVideoCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('videos', this)">🎬 Videos (${dataVideoCount})</button>` : ''}
        ${imgCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('gallery', this)">🖼️ Gallery (${imgCount})</button>` : ''}
        <button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('resources', this)">🔗 Resources & Components</button>
      </div>
    </div>

    <!-- Overview Tab -->
    <div id="ptab-overview" class="pd-tab-content active">
      <div class="pd-overview-grid">
        <div class="pd-overview-main" style="width: 100%;">
          ${p.innovation ? `<div class="pd-innovation-quote" style="--project-color: ${p.color || 'var(--orange)'};">"${p.innovation}"</div>` : ''}
          ${p.problemStatement || p.solutionApproach ? `
            <div class="pd-problem-solution" style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; align-items: center; margin-bottom: 40px;">
              <div class="pd-problem-card" style="background: rgba(255, 71, 87, 0.05); border: 1px solid rgba(255, 71, 87, 0.4); padding: 24px; border-radius: 16px; box-shadow: 0 0 20px rgba(255, 71, 87, 0.15); transition: transform 0.3s; height: 100%;">
                <h4 style="color: #FF4757; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 1.1rem; text-shadow: 0 0 10px rgba(255, 71, 87, 0.3);">⚠️ Problem</h4>
                <p style="font-size: 1rem; line-height: 1.6; color: var(--text);">${p.problemStatement || 'Not specified'}</p>
              </div>
              <div class="pd-animated-arrow" style="background: var(--bg); padding: 10px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">➔</div>
              <div class="pd-solution-card" style="background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.4); padding: 24px; border-radius: 16px; box-shadow: 0 0 20px rgba(0, 255, 136, 0.15); transition: transform 0.3s; height: 100%;">
                <h4 style="color: #00FF88; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 1.1rem; text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);">✅ Solution</h4>
                <p style="font-size: 1rem; line-height: 1.6; color: var(--text);">${p.solutionApproach || 'Not specified'}</p>
              </div>
            </div>
          ` : ''}
          ${descHtml}
          
          ${p.guide && p.guide.length > 0 ? `
            <div class="pd-guide-section">
              <h3 class="pd-guide-title">🛠️ Step-by-Step Guide</h3>
              <div class="pd-guide-list">
                ${p.guide.map((step, idx) => `
                  <div class="pd-guide-step">
                    <div class="pd-guide-num">${idx + 1}</div>
                    <div class="pd-guide-text">${step}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${p.hardwareSpecs ? `
            <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-top: 40px; margin-bottom: 24px;">
              <h4 style="margin-bottom: 20px; font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; display: flex; align-items: center; gap: 8px; font-family: var(--font-head);">⚙️ Hardware Specs</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                ${Object.entries(p.hardwareSpecs).map(([key, val]) => `
                  <tr>
                    <td style="padding: 14px 0; border-bottom: 1px solid var(--border); color: var(--text-muted); text-transform: capitalize; width: 30%;">${key.replace(/([A-Z])/g, ' $1')}</td>
                    <td style="padding: 14px 0; border-bottom: 1px solid var(--border); color: var(--text);">${Array.isArray(val) ? val.join('<br>') : val}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <!-- Unified Presentation Tab -->
    <div id="ptab-presentation" class="pd-tab-content">
      <div style="max-width: 1000px; margin: 0 auto;">
        
        <!-- Square grid for poster, circuit, research -->
        <div class="presentation-grid">
          ${p.poster ? `
            <div class="presentation-box" onclick="openFullscreenMedia('${p.poster}', 'img')">
              <div class="presentation-box-img">
                <img src="${p.poster}" alt="Poster" onerror="this.parentElement.innerHTML='<div class=&quot;pd-placeholder&quot; style=&quot;height:100%;&quot;>Image not found</div>'" />
              </div>
              <div class="presentation-box-label">
                <span class="presentation-box-icon">📊</span>
                <span>Poster</span>
              </div>
            </div>
          ` : ''}

          ${p.posters ? p.posters.map(poster => `
            <div class="presentation-box" onclick="openFullscreenMedia('${poster.file}', 'img')">
              <div class="presentation-box-img">
                <img src="${poster.file}" alt="${poster.caption}" onerror="this.parentElement.innerHTML='<div class=&quot;pd-placeholder&quot; style=&quot;height:100%;&quot;>Image not found</div>'" />
              </div>
              <div class="presentation-box-label">
                <span class="presentation-box-icon">📊</span>
                <span>${poster.caption}</span>
              </div>
            </div>
          `).join('') : ''}
          
          ${hasCircuit ? `
            <div class="presentation-box" onclick="openFullscreenMedia('${p.circuitDiagram}', 'img')">
              <div class="presentation-box-img">
                <img src="${p.circuitDiagram}" alt="Circuit Diagram" onerror="this.parentElement.innerHTML='<div class=&quot;pd-placeholder&quot; style=&quot;height:100%;&quot;>Image not found</div>'" />
              </div>
              <div class="presentation-box-label">
                <span class="presentation-box-icon">🔌</span>
                <span>Circuit Diagram</span>
              </div>
            </div>
          ` : ''}
          
          ${p.researchPaper ? `
            <div class="presentation-box" onclick="openFullscreenMedia('${p.researchPaper}', 'pdf')">
              <div class="presentation-box-img" style="background: #fff;">
                <iframe src="${p.researchPaper}#toolbar=0&navpanes=0&scrollbar=0&view=Fit" style="width: 100%; height: 100%; border: none; pointer-events: none;" title="Research Paper"></iframe>
              </div>
              <div class="presentation-box-label">
                <span class="presentation-box-icon">🔬</span>
                <span>Research Paper</span>
                <a href="${p.researchPaper}" target="_blank" onclick="event.stopPropagation()" class="presentation-box-dl">↗</a>
              </div>
            </div>
          ` : ''}

          ${p.presentationPdfs ? p.presentationPdfs.map(doc => {
            const isPptx = doc.type === 'pptx' || doc.file.toLowerCase().endsWith('.pptx') || doc.file.toLowerCase().endsWith('.ppt');
            if (isPptx) {
              return `
              <div class="presentation-box" onclick="window.open('${doc.file}', '_blank')">
                <div class="presentation-box-img" style="background: linear-gradient(135deg, #D04423 0%, #B7312C 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 12px;">
                  <span style="font-size: 3.5rem;">📊</span>
                  <span style="background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; color: #fff; letter-spacing: 1px;">PPTX</span>
                </div>
                <div class="presentation-box-label">
                  <span class="presentation-box-icon">📊</span>
                  <span>${doc.name}</span>
                  <a href="${doc.file}" download onclick="event.stopPropagation()" class="presentation-box-dl" title="Download PPTX">⬇️</a>
                </div>
              </div>`;
            } else {
              return `
              <div class="presentation-box" onclick="openFullscreenMedia('${doc.file}', 'pdf')">
                <div class="presentation-box-img" style="background: #fff;">
                  <iframe src="${doc.file}#toolbar=0&navpanes=0&scrollbar=0&view=Fit" style="width: 100%; height: 100%; border: none; pointer-events: none;" title="${doc.name}"></iframe>
                </div>
                <div class="presentation-box-label">
                  <span class="presentation-box-icon">🔬</span>
                  <span>${doc.name}</span>
                  <a href="${doc.file}" target="_blank" onclick="event.stopPropagation()" class="presentation-box-dl">↗</a>
                </div>
              </div>`;
            }
          }).join('') : ''}
        </div>
        
        ${ytVideoCount > 0 ? `
          <div style="margin-top: 32px;">
            <h3 class="pd-videos-section-title">📺 YouTube Guides</h3>
            <div class="pd-videos-grid" style="margin-bottom: 0;">
              ${p.youtubeVideos.map(v => `
                <div class="pd-video-card">
                  <div class="pd-video-thumb">
                    <iframe src="https://www.youtube.com/embed/${v.videoId}" allowfullscreen loading="lazy"></iframe>
                  </div>
                  <div class="pd-video-info">
                    <div class="pd-video-title">${v.title || 'Video'}</div>
                    <div class="pd-video-desc">${v.desc || ''}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- Achievements Tab -->
    <div id="ptab-achievements" class="pd-tab-content">
      ${hasAchievements ? `
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${p.achievements.map(ach => `
            <div style="background: var(--surface); padding: 20px 24px; border-radius: 12px; border-left: 4px solid var(--yellow); display: flex; align-items: center; gap: 16px;">
              <span style="font-size: 2rem;">🏆</span>
              <span style="font-size: 1.1rem; font-weight: 600;">${ach}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <!-- 3D Files Tab -->
    <div id="ptab-3d" class="pd-tab-content">
      ${files3dCount === 0 ? renderProjectEmptyState('🖨️', 'No 3D Files Yet', '3D printable files will appear here.') : `
        <div class="pd-files-grid" style="grid-template-columns: 1fr; gap: 24px;">
          ${p.files3d.map((f, idx) => `
            <div class="pd-file-card" style="display:flex; flex-direction:column; gap:16px; background:var(--surface); padding:20px; border-radius:12px; border:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
                <div style="display:flex; align-items:center; gap: 12px;">
                  <div class="pd-file-icon" style="font-size:2rem;">🖨️</div>
                  <div class="pd-file-info">
                    <div class="pd-file-name" title="${f.name}" style="font-weight:bold; font-size:1.1rem;">${f.name}</div>
                    <div class="pd-file-size" style="color:var(--text-muted);">${f.size || 'STL Format'}</div>
                  </div>
                </div>
                <a href="${f.url}" download target="_blank" class="pd-file-download btn-outline" style="padding:10px 16px; border-radius:8px; border:1px solid var(--border); color:var(--text); text-decoration:none;">⬇️ Download STL</a>
              </div>
              <div id="stl-viewer-container-${idx}" class="stl-viewer-container" data-url="${f.url}" style="width:100%; height:400px; background:#1e1e1e; border-radius:12px; overflow:hidden; position:relative; display:flex; justify-content:center; align-items:center; border: 1px solid #333;">
                <div class="stl-loading" style="color:#888;">Loading 3D Viewer...</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Code Tab -->
    <div id="ptab-code" class="pd-tab-content">
      ${(codeCount === 0 && !(p.firmware && p.firmware.length > 0)) ? renderProjectEmptyState('💻', 'No Code Files Yet', 'Arduino sketches and scripts will appear here.') : `
        <div class="pd-code-list">
          ${p.firmware && p.firmware.length > 0 ? `
            <div style="margin-bottom: 24px; padding: 20px; background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.3); border-radius: 12px;">
              <h4 style="margin-bottom: 16px; color: #00d4ff;">⚡ Pre-compiled Firmware</h4>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                ${p.firmware.map(fw => `
                  <button onclick="openRealFirmwareFlasher('${fw.url}')" class="btn-primary" style="background: #00d4ff; border: none; box-shadow: 0 0 15px rgba(0,212,255,0.4); color: #000; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Flash ${fw.name || 'Firmware'}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <div class="gallery-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
            ${p.codeFiles ? p.codeFiles.map((c, i) => `
              <div class="gallery-item" onclick="toggleCodePreview(${i})" style="cursor:pointer;">
                <div class="gallery-img-wrap" style="background: #1e1e2e; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px; min-height: 120px;">
                  <span style="font-size: 2.5rem; margin-bottom: 8px;">📝</span>
                  <span style="font-size: 0.85rem; font-weight: 700; color: #e0e0e0; text-align:center; word-break:break-all;">${c.name}</span>
                  ${c.language ? `<span style="font-size: 0.7rem; color: ${p.color || 'var(--orange)'}; margin-top: 6px; padding: 2px 8px; border: 1px solid ${p.color || 'var(--orange)'}44; border-radius: 4px;">${c.language}</span>` : ''}
                </div>
                <div class="gallery-caption" style="display:flex; justify-content:space-between; align-items:center; padding: 8px 12px;">
                  <p style="margin:0; font-size: 0.8rem;">${c.name}</p>
                  <a href="${c.url}" target="_blank" onclick="event.stopPropagation()" style="font-size: 0.8rem; color: var(--text-muted); text-decoration: none;" title="Download">⬇️</a>
                </div>
              </div>
            `).join('') : ''}
          </div>
          <div id="code-expanded-preview" style="display:none; margin-top: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding: 12px 20px; border-bottom: 1px solid var(--border);">
              <span id="code-expanded-name" style="font-weight: bold;"></span>
              <button onclick="document.getElementById('code-expanded-preview').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">✕</button>
            </div>
            <pre class="code-preview vscode-code-block" id="code-expanded-content" style="margin:0; padding: 16px 20px; max-height: 500px; overflow: auto;">Select a file to preview</pre>
          </div>
        </div>
      `}
    </div>

    <!-- Videos Tab (Local Only) -->
    <div id="ptab-videos" class="pd-tab-content">
      ${dataVideoCount === 0 ? renderProjectEmptyState('🎬', 'No Videos Yet', 'Local videos will appear here.') : `
        <h3 class="pd-videos-section-title">📂 Local Videos</h3>
        <div class="pd-videos-grid">
          ${p.dataVideos.map(v => `
            <div class="pd-video-card">
              <div class="pd-video-thumb">
                <video src="${v.url}" controls preload="metadata"></video>
              </div>
              <div class="pd-video-info">
                <div class="pd-video-title">${v.name || 'Local Video'}</div>
                <div class="pd-video-desc">${v.desc || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Gallery Tab -->
    <div id="ptab-gallery" class="pd-tab-content">
      ${imgCount === 0 ? renderProjectEmptyState('🖼️', 'No Gallery Images Yet', 'Photos of the project will appear here.') : `
        <div class="gallery-grid">
          ${p.gallery.map((img, i) => `
            <div class="gallery-item" onclick="openProjectLightbox(${i})">
              <div class="gallery-img-wrap">
                <img src="${img.file}" alt="${img.caption || ''}" class="gallery-img" loading="lazy" 
                  onerror="this.parentElement.innerHTML='<div class=&quot;gallery-img-missing&quot;><span>🖼️</span><small>Missing Image</small></div>'" />
                <div class="gallery-overlay"><span class="gallery-zoom">🔍</span></div>
              </div>
              <div class="gallery-caption">
                ${img.category ? `<span class="gallery-cat-badge">${img.category}</span>` : ''}
                <p>${img.caption || ''}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Resources Tab (includes Components) -->
    <div id="ptab-resources" class="pd-tab-content">
      ${(resCount === 0 && !hasComponents) ? renderProjectEmptyState('🔗', 'No Resources or Components Yet', 'Datasheets and external links will appear here.') : ''}
      
      ${resCount > 0 ? `
        <h3 class="pd-panel-title" style="margin-bottom:24px;">🔗 External Links & Datasheets</h3>
        <div class="pd-resources-list">
          ${p.resources.map(r => `
            <a href="${r.url}" target="_blank" class="pd-resource-card">
              <span class="pd-resource-icon">${r.icon || '🔗'}</span>
              <span class="pd-resource-title">${r.title}</span>
              <span class="pd-resource-arrow">→</span>
            </a>
          `).join('')}
        </div>
      ` : ''}
      
      ${hasComponents ? `
        <h3 class="pd-panel-title" style="margin-top:40px; margin-bottom:24px;">🧩 Hardware Components</h3>
        <div id="components-loading" style="text-align:center; padding: 40px; color: var(--text-muted);">Loading component data...</div>
        <div id="components-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; display: none;"></div>
      ` : ''}
    </div>
  `;

  if (hasComponents) {
    loadComponentCards(p);
  }

  // Code preview is now loaded on-demand via toggleCodePreview()

  // Initialize slider auto-play if there are multiple banners
  if (hasMultipleBanners) {
    window._wsSliderIndex = 0;
    window._wsSliderCount = slideImages.length;
    window._wsSliderInterval = setInterval(() => { wsSliderNav(1); }, 4000);
  }

  // Initialize STL viewers if needed
  if (files3dCount > 0) {
    setTimeout(globalThis.initStlViewers, 100);
  }
}

// =============================================
//  CODE PREVIEW (click-to-expand)
// =============================================
globalThis.toggleCodePreview = function (idx) {
  const p = currentProject;
  if (!p || !p.codeFiles || !p.codeFiles[idx]) return;

  const c = p.codeFiles[idx];
  const preview = document.getElementById('code-expanded-preview');
  const nameEl = document.getElementById('code-expanded-name');
  const contentEl = document.getElementById('code-expanded-content');

  if (!preview || !contentEl) return;

  nameEl.textContent = `📝 ${c.name}`;
  contentEl.textContent = 'Loading...';
  preview.style.display = 'block';

  // Scroll to preview
  preview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  fetch(c.url)
    .then(res => res.text())
    .then(text => {
      if (globalThis.highlightCode) {
        contentEl.innerHTML = globalThis.highlightCode(text);
      } else {
        contentEl.textContent = text;
      }
    })
    .catch(() => {
      contentEl.textContent = 'Error loading code preview.';
    });
};

// Lightbox for media (Poster, Circuit, PDF)
globalThis.openFullscreenMedia = function (url, type) {
  let modal = document.getElementById('mediaFullscreenModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mediaFullscreenModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; align-items:center; justify-content:center; flex-direction:column;';
    modal.innerHTML = `
      <div style="position:absolute; top:20px; right:20px; color:#fff; font-size:2rem; cursor:pointer; z-index:10001;" onclick="closeFullscreenMedia()">✕</div>
      <div id="mediaFullscreenContent" style="width:90%; height:90%; display:flex; align-items:center; justify-content:center; position:relative;"></div>
      <div style="color:var(--text-muted); font-size:0.9rem; margin-top:10px;">Press ESC to close</div>
    `;
    document.body.appendChild(modal);

    // Keydown event
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('mediaFullscreenModal');
        if (modal && modal.style.display === 'flex') {
          closeFullscreenMedia();
        }
      }
    });
  }

  const content = document.getElementById('mediaFullscreenContent');
  if (type === 'img') {
    content.innerHTML = `<img src="${url}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />`;
  } else if (type === 'pdf') {
    content.innerHTML = `<iframe src="${url}#toolbar=0&navpanes=0&view=Fit" style="width:100%; height:100%; border:none; border-radius:8px; background:white;"></iframe>`;
  }

  modal.style.display = 'flex';
};

globalThis.closeFullscreenMedia = function () {
  const modal = document.getElementById('mediaFullscreenModal');
  if (modal) {
    modal.style.display = 'none';
    const content = document.getElementById('mediaFullscreenContent');
    if (content) content.innerHTML = ''; // clear iframe
  }
};

// =============================================
//  WEATHER STATION SLIDER CONTROLS
// =============================================
globalThis._wsSliderIndex = 0;
globalThis._wsSliderCount = 0;

globalThis.wsSliderNav = function (dir) {
  const track = document.getElementById('wsSliderTrack');
  const dots = document.getElementById('wsSliderDots');
  if (!track) return;
  const count = globalThis._wsSliderCount;
  if (count <= 1) return;
  globalThis._wsSliderIndex = (globalThis._wsSliderIndex + dir + count) % count;
  track.style.transform = `translateX(-${globalThis._wsSliderIndex * (100 / count)}%)`;
  // Update dots
  if (dots) {
    Array.from(dots.children).forEach((dot, i) => {
      dot.style.background = i === globalThis._wsSliderIndex ? '#fff' : 'rgba(255,255,255,0.4)';
    });
  }
  // Reset auto-slide timer
  if (globalThis._wsSliderInterval) clearInterval(globalThis._wsSliderInterval);
  globalThis._wsSliderInterval = setInterval(() => { globalThis.wsSliderNav(1); }, 4000);
};

globalThis.wsSliderGoTo = function (idx) {
  const track = document.getElementById('wsSliderTrack');
  const dots = document.getElementById('wsSliderDots');
  if (!track) return;
  const count = globalThis._wsSliderCount;
  globalThis._wsSliderIndex = idx;
  track.style.transform = `translateX(-${idx * (100 / count)}%)`;
  if (dots) {
    Array.from(dots.children).forEach((dot, i) => {
      dot.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.4)';
    });
  }
  if (globalThis._wsSliderInterval) clearInterval(globalThis._wsSliderInterval);
  globalThis._wsSliderInterval = setInterval(() => { globalThis.wsSliderNav(1); }, 4000);
};

// =============================================
//  LOAD COMPONENT CARDS (from data/components/)
// =============================================
async function loadComponentCards(project) {
  const loadingEl = document.getElementById('components-loading');
  const containerEl = document.getElementById('components-container');
  if (!containerEl) return;

  // Determine which component refs to load
  const refs = project.componentRefs || [];
  if (refs.length === 0 && project.components && project.components.length > 0) {
    // Fallback: just show a simple list if no componentRefs
    if (loadingEl) loadingEl.style.display = 'none';
    containerEl.style.display = 'grid';
    containerEl.innerHTML = project.components.map(c => `
      <div style="background: var(--surface); padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.5rem;">🔧</span>
        <span style="font-weight: 600;">${c}</span>
      </div>
    `).join('');
    return;
  }

  try {
    const componentData = await Promise.all(
      refs.map(async (refId) => {
        try {
          const res = await fetch(`data/components/${refId}.json`);
          if (!res.ok) return null;
          return await res.json();
        } catch (e) {
          console.warn('Could not load component:', refId, e);
          return null;
        }
      })
    );

    const validComponents = componentData.filter(Boolean);

    if (loadingEl) loadingEl.style.display = 'none';
    containerEl.style.display = 'grid';

    if (validComponents.length === 0) {
      containerEl.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-muted); grid-column: 1/-1;">No component data found.</div>`;
      return;
    }

    containerEl.innerHTML = validComponents.map(comp => `
      <div class="component-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${comp.color || '#FF6B35'}22, ${comp.color || '#FF6B35'}08); padding: 20px; border-bottom: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${comp.image ? `<img src="${comp.image}" alt="${comp.name}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid ${comp.color || 'var(--border)'};" onerror="this.style.display='none'" />` : ''}
            <div>
              <div style="font-size: 0.75rem; color: ${comp.color || 'var(--orange)'}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${comp.category || 'Component'}</div>
              <h4 style="margin: 4px 0 0; font-size: 1.2rem;">${comp.fullName || comp.name}</h4>
            </div>
          </div>
          ${comp.tagline ? `<p style="margin-top: 12px; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">${comp.tagline}</p>` : ''}
        </div>

        <div style="padding: 20px;">
          <!-- Description -->
          ${comp.description ? `<p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 20px;">${comp.description}</p>` : ''}

          <!-- Specs Table -->
          ${comp.specs ? `
            <div style="margin-bottom: 20px;">
              <h5 style="font-size: 0.85rem; color: ${comp.color || 'var(--orange)'}; margin-bottom: 10px;">⚙️ Specifications</h5>
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                ${Object.entries(comp.specs).map(([key, val]) => `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid var(--border); color: var(--text-muted); text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid var(--border); text-align: right; color: var(--text); font-weight: 500;">${val}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}

          <!-- Pinout -->
          ${comp.pinout && comp.pinout.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h5 style="font-size: 0.85rem; color: ${comp.color || 'var(--orange)'}; margin-bottom: 10px;">📌 Pinout</h5>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${comp.pinout.map(pin => `
                  <div style="display: flex; align-items: center; gap: 10px; background: var(--surface2); padding: 8px 12px; border-radius: 8px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${pin.color || '#888'}; flex-shrink: 0;"></div>
                    <span style="font-weight: 700; min-width: 50px; font-size: 0.85rem;">${pin.name}</span>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${pin.desc}</span>
                  </div>
                `).join('')}
              </div>
              ${(() => {
          return comp.wiringNote ? `<div style="margin-top: 10px; padding: 10px 14px; background: rgba(255, 200, 0, 0.1); border: 1px solid rgba(255, 200, 0, 0.3); border-radius: 8px; font-size: 0.85rem; color: #FFC800;">⚠️ ${comp.wiringNote}</div>` : '';
        })()}
            </div>
          ` : ''}

          <!-- Code Snippet -->
          ${comp.codeSnippet ? `
            <div style="margin-bottom: 20px;">
              <h5 style="font-size: 0.85rem; color: ${comp.color || 'var(--orange)'}; margin-bottom: 10px;">💻 Quick Start Code</h5>
              ${(() => {
          return comp.libraryName ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">📦 Library: ${comp.libraryName}</div>` : '';
        })()}
              <pre style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.8rem; line-height: 1.5; max-height: 250px; overflow-y: auto;">${comp.codeSnippet.replaceAll('\\n', '\n')}</pre>
            </div>
          ` : ''}

          <!-- Common Mistakes -->
          ${comp.commonMistakes && comp.commonMistakes.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h5 style="font-size: 0.85rem; color: #FF4757; margin-bottom: 10px;">🚫 Common Mistakes</h5>
              <ul style="padding-left: 20px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.7;">
                ${comp.commonMistakes.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Links -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            ${comp.datasheetUrl ? `<a href="${comp.datasheetUrl}" target="_blank" style="background: var(--surface2); color: var(--text); padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-decoration: none; border: 1px solid var(--border); transition: background 0.2s;" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='var(--surface2)'">📄 Datasheet</a>` : ''}
            ${comp.buyLink ? `<a href="${comp.buyLink}" target="_blank" style="background: ${comp.color || 'var(--orange)'}; color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">🛒 Buy</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading component cards:', err);
    if (loadingEl) loadingEl.textContent = 'Failed to load component data.';
  }
}

function renderProjectEmptyState(icon, title, desc) {
  return `
    <div class="pd-placeholder">
      <div class="pd-placeholder-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

function switchProjectTab(name, btn) {
  document.querySelectorAll('.pd-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pd-tab').forEach(t => t.classList.remove('active'));

  const tab = document.getElementById('ptab-' + name);
  if (tab) tab.classList.add('active');
  if (btn) btn.classList.add('active');
}

// Project Lightbox (Reusing existing lightbox container from sessions if possible, or handling uniquely)
function openProjectLightbox(idx) {
  const p = currentProject;
  if (!p || !p.gallery || !p.gallery.length) return;

  lightboxIndex = idx; // using global from session.js
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.style.display = 'flex';
  updateProjectLightbox(p.gallery);
}

function updateProjectLightbox(gallery) {
  const img = gallery[lightboxIndex];
  const imgEl = document.getElementById('lightboxImg');
  const capEl = document.getElementById('lightboxCaption');
  const cntEl = document.getElementById('lightboxCounter');

  if (imgEl) imgEl.src = img.file;
  if (capEl) capEl.textContent = img.caption || '';
  if (cntEl) cntEl.textContent = `${lightboxIndex + 1} / ${gallery.length}`;

  // Override lightbox nav for project gallery context
  document.querySelector('.lightbox-prev').onclick = () => projectLightboxNav(-1);
  document.querySelector('.lightbox-next').onclick = () => projectLightboxNav(1);
}

function projectLightboxNav(dir) {
  const p = currentProject;
  if (!p || !p.gallery) return;
  lightboxIndex = (lightboxIndex + dir + p.gallery.length) % p.gallery.length;
  updateProjectLightbox(p.gallery);
}

// =============================================
//  VS CODE SYNTAX HIGHLIGHTING (Basic)
// =============================================
globalThis.highlightCode = function (code) {
  let highlighted = code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\b(int|float|double|char|void|bool|String|auto)\b/g, '<span class="type">$1</span>')
    .replace(/\b(if|else|for|while|return|break|continue|switch|case|default|class|struct)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(true|false|null|NULL)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b([A-Za-z0-9_]+)\s*\(/g, '<span class="function">$1</span>(')
    .replace(/("[^"]*")/g, '<span class="string">$1</span>')
    .replace(/(\b\d+(\.\d+)?\b)/g, '<span class="number">$1</span>')
    .replace(/(\/\/[^\n]*)/g, '<span class="comment">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
  return highlighted;
};

// =============================================
//  REAL FIRMWARE UPLOAD (esp-web-tools)
// =============================================
globalThis.openRealFirmwareFlasher = function (filename) {
  // 1. Inject the esp-web-tools script if it doesn't exist
  if (!document.getElementById('espWebToolsScript')) {
    const script = document.createElement('script');
    script.type = 'module';
    script.id = 'espWebToolsScript';
    script.src = 'https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module';
    document.head.appendChild(script);
  }

  // 2. Generate a dynamic manifest Blob URL for the specific firmware file
  const manifest = {
    name: currentProject ? currentProject.title : "Firmware",
    version: "1.0.0",
    builds: [
      {
        chipFamily: "ESP32",
        parts: [
          { path: filename, offset: 0 } // Standard offset for full ESP32 binaries
        ]
      }
    ]
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(blob);

  // 3. Inject modal if it doesn't exist
  if (!document.getElementById('firmwareModalOverlay')) {
    const modalHtml = `
      <div class="firmware-modal-overlay" id="firmwareModalOverlay">
        <div class="firmware-modal">
          <div class="firmware-header">
            <h3>⚡ Upload Firmware via Web Serial</h3>
            <button class="firmware-close" onclick="closeFirmwareModal()">✕</button>
          </div>
          <div class="firmware-body" style="text-align: center; padding: 40px 20px;">
            <p class="firmware-instructions" style="margin-bottom: 30px;">
              Connect your ESP32 board via USB. Click the button below, select your device's COM port, and the browser will natively erase and flash the <b id="fwFileName"></b> binary.
            </p>
            <div id="espInstallContainer" style="display: flex; justify-content: center; min-height: 50px;">
              <!-- Web Install Button goes here -->
            </div>
            <p style="margin-top: 30px; font-size: 0.85rem; color: var(--text-dim);">Powered by ESP Web Tools. Requires Chrome/Edge desktop.</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  document.getElementById('fwFileName').textContent = filename;

  // 4. Inject the Web Component dynamically to pick up the new manifest URL
  const container = document.getElementById('espInstallContainer');
  container.innerHTML = ''; // clear previous
  const installButton = document.createElement('esp-web-install-button');
  installButton.setAttribute('manifest', manifestUrl);
  container.appendChild(installButton);

  const overlay = document.getElementById('firmwareModalOverlay');
  overlay.classList.add('active');
};

globalThis.closeFirmwareModal = function () {
  const overlay = document.getElementById('firmwareModalOverlay');
  if (overlay) overlay.classList.remove('active');
};

// =============================================
//  STL VIEWER INITIALIZATION
// =============================================
globalThis.initStlViewers = function () {
  const containers = document.querySelectorAll('.stl-viewer-container');
  if (containers.length === 0) return;

  // Load Three.js if not loaded
  if (typeof THREE === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = () => {
      // Load STLLoader
      const stlScript = document.createElement('script');
      stlScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js';
      stlScript.onload = () => {
        // Load OrbitControls
        const controlsScript = document.createElement('script');
        controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
        controlsScript.onload = () => {
          renderAllStlViewers(containers);
        };
        document.head.appendChild(controlsScript);
      };
      document.head.appendChild(stlScript);
    };
    document.head.appendChild(script);
  } else {
    renderAllStlViewers(containers);
  }
};

function renderAllStlViewers(containers) {
  containers.forEach(container => {
    if (container.dataset.initialized) return;
    container.dataset.initialized = "true";

    const url = container.dataset.url;
    container.innerHTML = ''; // clear loading text

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1e1e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-1, -1, -1);
    scene.add(dirLight2);

    const loader = new THREE.STLLoader();
    loader.load(url, function (geometry) {
      const material = new THREE.MeshPhongMaterial({ color: 0x00d4ff, specular: 0x111111, shininess: 200 });
      const mesh = new THREE.Mesh(geometry, material);

      // Center and scale
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox.getCenter(center);
      mesh.position.sub(center);

      const size = new THREE.Vector3();
      geometry.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 150 / maxDim;
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);

      // Update position after scale
      mesh.position.multiplyScalar(scale);

      camera.position.set(0, 0, 250);
      controls.update();

    }, undefined, function (error) {
      console.error(error);
      container.innerHTML = '<div style="color:#ff4757; text-align:center;">Failed to load STL model.<br>Please ensure the path is correct.</div>';
    });

    const animate = function () {
      // only animate if container is visible to save resources
      if (container.offsetParent !== null) {
        controls.update();
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    };
    animate();

    // Resize handling
    window.addEventListener('resize', () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
  });
}
