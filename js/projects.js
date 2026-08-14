// =============================================
//  PROJECTS GALLERY
// =============================================

function initProjectFilters() {
  if (typeof PROJECTS === 'undefined' || !PROJECTS || PROJECTS.length === 0) return;
  const mcSelect = document.getElementById('filterMicrocontroller');
  const compSelect = document.getElementById('filterComponent');
  if (!mcSelect || !compSelect) return;
  if (mcSelect.children.length > 1 && compSelect.children.length > 1) return;

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

  mcSelect.innerHTML = '<option value="all">All Boards</option>';
  Array.from(mcSet).sort((a, b) => a.localeCompare(b)).forEach(mc => {
    mcSelect.innerHTML += `<option value="${mc}">${mc}</option>`;
  });

  compSelect.innerHTML = '<option value="all">All Components</option>';
  Array.from(compSet).sort((a, b) => a.localeCompare(b)).forEach(c => {
    compSelect.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

async function renderProjects() {
  console.log('[renderProjects] START — PROJECTS type:', typeof PROJECTS, ', length:', (typeof PROJECTS !== 'undefined' && PROJECTS) ? PROJECTS.length : 'N/A');
  const grid = document.getElementById('projectsGrid');
  const countEl = document.getElementById('projectsCount');
  if (!grid) {
    console.warn('[renderProjects] ABORT — #projectsGrid not found in DOM');
    return;
  }

  try {
    // Step 1: If PROJECTS is empty, try to fetch it
    if (typeof PROJECTS === 'undefined' || !PROJECTS || PROJECTS.length === 0) {
      console.log('[renderProjects] PROJECTS is empty, attempting fallback fetch...');
      grid.innerHTML = `<div class="projects-empty"><div class="projects-empty-icon">⏳</div><h3>Loading Projects...</h3></div>`;
      if (countEl) countEl.textContent = 'Loading...';

      try {
        const res = await fetch('projects/datafolder/compiled_projects.json');
        console.log('[renderProjects] Fallback fetch status:', res.status, res.ok);
        if (res.ok) {
          const data = await res.json();
          console.log('[renderProjects] Fallback fetch got', Array.isArray(data) ? data.length : 'non-array', 'items');
          if (data && Array.isArray(data) && data.length > 0) {
            PROJECTS.length = 0;
            data.forEach(p => PROJECTS.push(p));
          }
        }
      } catch (fetchErr) {
        console.error('[renderProjects] Fallback fetch FAILED:', fetchErr);
      }
    }

    // Step 2: Initialize filters (with safety wrapper)
    try {
      initProjectFilters();
    } catch (filterErr) {
      console.error('[renderProjects] initProjectFilters() threw:', filterErr);
    }

    // Step 3: Check if we have projects after loading
    if (!PROJECTS || PROJECTS.length === 0) {
      console.warn('[renderProjects] PROJECTS still empty after fallback fetch');
      grid.innerHTML = `<div class="projects-empty"><div class="projects-empty-icon">📂</div><h3>No Projects Found</h3><p style="color:var(--text-dim);font-size:0.85rem">Check browser console for errors</p></div>`;
      if (countEl) countEl.textContent = '0 Projects';
      return;
    }

    console.log('[renderProjects] Rendering', PROJECTS.length, 'projects...');

    // Step 4: Get filter values
    const searchInput = document.getElementById('projectSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const diffSelect = document.getElementById('filterDifficulty');
    const diffVal = diffSelect ? diffSelect.value : 'all';

    const mcSelect = document.getElementById('filterMicrocontroller');
    const mcVal = mcSelect ? mcSelect.value : 'all';

    const compSelect = document.getElementById('filterComponent');
    const compVal = compSelect ? compSelect.value : 'all';

    // Step 5: Filter projects
    let filtered = PROJECTS.filter(p => {
      const searchString = `${p.id || ''} ${p.title || ''} ${p.subtitle || ''} ${p.desc || ''} ${p.fullDesc || ''}`.toLowerCase();
      const matchesSearch = searchTerm === '' || searchString.includes(searchTerm);
      const matchesDiff = diffVal === 'all' || p.difficulty == diffVal;
      const matchesMc = mcVal === 'all' || (p.hardwareSpecs && p.hardwareSpecs.microcontroller === mcVal);
      const matchesComp = compVal === 'all' || (p.componentRefs && p.componentRefs.includes(compVal));
      return matchesSearch && matchesDiff && matchesMc && matchesComp;
    });

    console.log('[renderProjects] Filtered down to', filtered.length, 'projects');

    // Step 6: Update counts
    if (countEl) {
      countEl.textContent = `Showing ${filtered.length} Project${filtered.length === 1 ? '' : 's'}`;
    }
    const inlineCount = document.getElementById('projectsCountInline');
    if (inlineCount) {
      inlineCount.textContent = `(${filtered.length})`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="projects-empty"><div class="projects-empty-icon">🔍</div><h3>No Matches</h3><p>Try adjusting your filters or search term.</p></div>`;
      return;
    }

    // Step 7: Build card HTML (with null-safe access)
    grid.innerHTML = filtered.map(p => `
      <div class="project-card" onclick="openProject('${p.id || ''}')" style="--card-glow: ${p.color || 'var(--orange)'}33">
        <div class="project-img-wrap">
          <img src="${p.image || ''}" alt="${p.title || 'Project'}" onerror="this.src='icons/vidya-logo.png'; this.classList.add('fallback-img')" class="project-img" />
          <div class="project-img-overlay"></div>
        </div>
        
        <div class="project-body">
          <div class="project-body-top">
            <span class="project-level level-${p.level || 'Beginner'}">${p.level || 'Beginner'}</span>
          </div>
          <h3>${p.title || 'Untitled Project'}</h3>
          <p>${p.desc || p.subtitle || 'No description available'}</p>
          
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
          <button class="project-card-open" style="background-color: ${p.color || 'var(--orange)'};" onclick="event.stopPropagation();openProject('${p.id || ''}')">Open ↗</button>
        </div>
      </div>
    `).join('');

    console.log('[renderProjects] DONE — injected', filtered.length, 'cards into grid');

  } catch (err) {
    console.error('[renderProjects] FATAL ERROR:', err);
    if (grid) {
      grid.innerHTML = `<div class="projects-empty" style="color:#ff6b6b"><div class="projects-empty-icon">⚠️</div><h3>Error Loading Projects</h3><p style="font-size:0.85rem;color:#aaa;word-break:break-all">${err.message}</p></div>`;
    }
  }
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
  const vivaList = p.vivaQuestions || p.viva_questions || [];
  const vivaCount = vivaList.length;

  const hasPoster = !!p.poster || (p.posters && p.posters.length > 0);
  const hasResearch = !!p.researchPaper || (p.presentationPdfs && p.presentationPdfs.length > 0);
  const hasCircuit = !!p.circuitDiagram;
  const hasComponents = (p.componentRefs && p.componentRefs.length > 0) || (p.components && p.components.length > 0);
  const hasAchievements = p.achievements && p.achievements.length > 0;
  const hasPresentationTab = hasPoster || hasResearch || hasCircuit || ytVideoCount > 0;
  const hasLiveDashboard = !!p.liveUrl;

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
    descHtml = `<div style="margin-bottom: 32px; line-height: 1.7; color: var(--text-muted); font-size: 1.05rem;">${p.fullDesc.replaceAll('\n', '<br>')}</div>`;
  } else if (p.desc) {
    descHtml = `<div style="margin-bottom: 32px; line-height: 1.7; color: var(--text-muted); font-size: 1.05rem;">${p.desc}</div>`;
  }

  const workingSteps = (p.working && p.working.length > 0)
    ? p.working.map(w => typeof w === 'object' ? w.action : w)
    : (p.algorithm && p.algorithm.length > 0)
      ? p.algorithm
      : (p.guide && p.guide.length > 0)
        ? p.guide
        : [];

  const circuitConnObj = p.circuitConnections || p.circuit_connections;
  const benefitsList = p.benefits || p.advantages;
  const appsList = p.applications || p.realLifeApplications;
  const futureList = p.futureScope || p.future_scope;

  container.innerHTML = `
    <!-- Top Sticky Navigation & Action Bar -->
    <div class="pd-top-navbar">
      <div class="pd-top-navbar-inner">
        <!-- Back Button -->
        <button class="pd-back" onclick="showPage('projects')">
          <span class="pd-back-arrow">←</span> <span class="pd-back-text">Back</span>
        </button>

        <!-- Tabs Nav filling horizontal space beside Back button -->
        <div class="pd-tabs" id="projectTopTabs">
          <button class="pd-tab active" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('overview', this)">📋 Overview</button>
          ${hasLiveDashboard ? `<button class="pd-tab pd-tab-dashboard" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('dashboard', this)">🖥️ Live Dashboard</button>` : ''}
          ${hasPresentationTab ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('presentation', this)">📑 Presentation</button>` : ''}
          ${vivaCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('viva', this)">❓ Viva & FAQ (${vivaCount})</button>` : ''}
          ${hasAchievements ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('achievements', this)">🏆 Achievements</button>` : ''}
          ${files3dCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('3d', this)">🖨️ 3D (${files3dCount})</button>` : ''}
          ${codeCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('code', this)">💻 Code (${codeCount})</button>` : ''}
          ${dataVideoCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('videos', this)">🎬 Videos (${dataVideoCount})</button>` : ''}
          ${imgCount > 0 ? `<button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('gallery', this)">🖼️ Gallery (${imgCount})</button>` : ''}
          <button class="pd-tab" style="--project-color: ${p.color || 'var(--orange)'}" onclick="switchProjectTab('resources', this)">🔗 Resources & Components</button>
        </div>

        <!-- Quick Hardware Action Tools -->
        <div class="pd-top-tools">
          <button onclick="openDriversModal()" class="pd-nav-tool-btn pd-tool-drivers" title="Download CH340 / CP210x USB Drivers">
            <span>💾</span> <span class="tool-text">Drivers</span>
          </button>
          <button onclick="openWebSerialMonitorModal()" class="pd-nav-tool-btn pd-tool-serial" title="Open Web Serial Monitor">
            <span>🔌</span> <span class="tool-text">Serial Monitor</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Project Banner & Hero Header -->
    <div class="pd-header" style="position:relative; overflow:hidden;">
      <div class="pd-banner" style="background: #000; position:relative;">
        ${bannerContent}
        <div class="pd-banner-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to top, #0d0f1a, transparent); z-index:1;"></div>
        <div class="pd-banner-content" style="z-index:2;">
          <h1 class="pd-banner-title" style="--project-color: ${p.color || 'var(--orange)'}">${p.title}</h1>
          
          <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
            ${p.liveUrl ? `<button onclick="switchProjectTab('dashboard', document.querySelector('.pd-tab-dashboard'))" class="btn-primary" style="background: ${p.color || 'var(--orange)'}; border: none; box-shadow: 0 0 20px ${p.color || 'var(--orange)'}44; padding: 10px 20px; font-size: 0.92rem; cursor: pointer;">🚀 Launch Live Project</button>` : ''}
            ${p.githubUrl ? `<a href="${p.githubUrl}" target="_blank" class="btn-outline" style="border-color: #fff; color: #fff; padding: 10px 20px; font-size: 0.92rem;">GitHub Repo ↗</a>` : ''}
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <span class="pd-meta-chip">👤 ${p.author || 'Tinkering Lab'}</span>
              <span class="pd-meta-chip">🕒 ${p.date || '2026'}</span>
              <div class="pd-difficulty-stars" style="color: ${p.color || 'var(--orange)'}; font-size: 1.1rem; margin-left: 2px;">
                ${'★'.repeat(p.difficulty || 1)}${'☆'.repeat(5 - (p.difficulty || 1))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="pd-team-section" style="margin-bottom: 24px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
        ${(p.team || []).length > 0 ? p.team.map(member => `
          <div class="pd-team-member" style="display: flex; align-items: center; gap: 10px;">
            <div class="pd-team-avatar" style="width: 38px; height: 38px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.85rem; border: 2px solid ${p.color || 'var(--orange)'};">${member.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <div style="font-weight: bold; font-size: 0.92rem;">${member.name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${member.role}</div>
            </div>
          </div>
        `).join('') : ''}
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

          <!-- Working Steps Timeline -->
          ${workingSteps.length > 0 ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">⚙️ How It Works / Working Steps</h3>
              <div style="display: flex; flex-direction: column; gap: 14px;">
                ${workingSteps.map((stepText, idx) => `
                  <div style="display: flex; align-items: flex-start; gap: 16px; background: var(--surface); padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border); transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='${p.color || 'var(--orange)'}'; this.style.transform='translateX(4px)'" onmouseout="this.style.borderColor='var(--border)'; this.style.transform='none'">
                    <div style="background: linear-gradient(135deg, ${p.color || 'var(--orange)'}, #ff7b00); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 4px 12px ${p.color || 'var(--orange)'}44;">${idx + 1}</div>
                    <div style="font-size: 0.98rem; line-height: 1.6; color: var(--text); padding-top: 3px;">${stepText}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Circuit Connections Table -->
          ${circuitConnObj ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">🔌 Circuit Connections & Pinout</h3>
              ${p.circuitDiagramDescription ? `<p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 16px; line-height: 1.6;">${p.circuitDiagramDescription}</p>` : ''}
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                  <thead>
                    <tr style="background: var(--surface2); border-bottom: 1px solid var(--border);">
                      <th style="padding: 12px 20px; text-align: left; color: var(--text-muted); font-weight: 600; width: 50%;">From Component / Pin</th>
                      <th style="padding: 12px 20px; text-align: left; color: var(--text-muted); font-weight: 600; width: 50%;">To Microcontroller / Pin</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(circuitConnObj).map(([fromPin, toPin]) => `
                      <tr style="border-bottom: 1px solid var(--border);">
                        <td style="padding: 12px 20px; font-weight: 600; color: var(--text);">${fromPin}</td>
                        <td style="padding: 12px 20px;">
                          <span style="background: rgba(0, 212, 255, 0.1); color: #00d4ff; border: 1px solid rgba(0, 212, 255, 0.3); padding: 4px 12px; border-radius: 6px; font-weight: bold; font-family: monospace;">${toPin}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Key Benefits -->
          ${benefitsList && benefitsList.length > 0 ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">💡 Key Benefits & Advantages</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px;">
                ${benefitsList.map(b => `
                  <div style="background: var(--surface); padding: 14px 18px; border-radius: 12px; border-left: 4px solid ${p.color || 'var(--orange)'}; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 1.2rem;">✨</span>
                    <span style="font-size: 0.95rem; font-weight: 500; color: var(--text);">${b}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Real World Impact -->
          ${p.impact ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">🌱 Real-World Impact</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px;">
                ${p.impact.community ? `
                  <div style="background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.3); padding: 18px; border-radius: 12px;">
                    <div style="color: #00d4ff; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">👥 Community Impact</div>
                    <p style="font-size: 0.92rem; color: var(--text); line-height: 1.6; margin: 0;">${p.impact.community}</p>
                  </div>
                ` : ''}
                ${p.impact.environment ? `
                  <div style="background: rgba(0, 255, 136, 0.05); border: 1px solid rgba(0, 255, 136, 0.3); padding: 18px; border-radius: 12px;">
                    <div style="color: #00FF88; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">🌿 Environmental Impact</div>
                    <p style="font-size: 0.92rem; color: var(--text); line-height: 1.6; margin: 0;">${p.impact.environment}</p>
                  </div>
                ` : ''}
                ${p.impact.social ? `
                  <div style="background: rgba(255, 165, 0, 0.05); border: 1px solid rgba(255, 165, 0, 0.3); padding: 18px; border-radius: 12px;">
                    <div style="color: #FFA500; font-weight: bold; font-size: 0.95rem; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">🤝 Social Impact</div>
                    <p style="font-size: 0.92rem; color: var(--text); line-height: 1.6; margin: 0;">${p.impact.social}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Applications -->
          ${appsList && appsList.length > 0 ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">🌍 Target Applications</h3>
              <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                ${appsList.map(app => `
                  <span style="background: var(--surface2); color: var(--text); padding: 8px 16px; border-radius: 20px; font-size: 0.88rem; font-weight: 500; border: 1px solid var(--border); display: flex; align-items: center; gap: 6px;">
                    📌 ${app}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Future Scope -->
          ${futureList && futureList.length > 0 ? `
            <div style="margin-top: 36px; margin-bottom: 32px;">
              <h3 style="font-size: 1.3rem; color: ${p.color || 'var(--orange)'}; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; font-family: var(--font-head);">🚀 Future Enhancements</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">
                ${futureList.map(f => `
                  <div style="background: var(--surface); padding: 14px 18px; border-radius: 10px; border: 1px dashed var(--border); display: flex; align-items: center; gap: 10px;">
                    <span style="color: ${p.color || 'var(--orange)'};">⚡</span>
                    <span style="font-size: 0.9rem; color: var(--text-muted);">${f}</span>
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

    <!-- Live Dashboard Tab -->
    ${hasLiveDashboard ? `
      <div id="ptab-dashboard" class="pd-tab-content">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 14px 20px; border-radius: 12px; border: 1px solid var(--border); flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.2rem;">🖥️</span>
              <span style="font-weight: 600; font-size: 1rem;">Live Project Dashboard</span>
              <span style="background: rgba(0,255,136,0.15); color: #00FF88; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(0,255,136,0.3);">ACTIVE</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <button onclick="const f=document.getElementById('liveDashboardIframe'); if(f) f.src=f.src;" class="btn-outline" style="padding: 8px 14px; font-size: 0.85rem; cursor:pointer;">🔄 Refresh</button>
              <button onclick="globalThis.toggleDashboardFullscreen()" class="btn-outline" style="padding: 8px 14px; font-size: 0.85rem; cursor:pointer;">⛶ Full Screen</button>
              <a href="${p.liveUrl}" target="_blank" class="btn-primary" style="padding: 8px 16px; font-size: 0.85rem; background: ${p.color || 'var(--orange)'}; border: none;">Open in New Tab ↗</a>
            </div>
          </div>
          <div id="liveDashboardContainer" style="width: 100%; height: 750px; background: #000; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <iframe id="liveDashboardIframe" src="${p.liveUrl}" style="width: 100%; height: 100%; border: none;" title="Live Project Dashboard" allowfullscreen></iframe>
          </div>
        </div>
      </div>
    ` : ''}

    <!-- Viva & FAQ Tab -->
    ${vivaCount > 0 ? `
      <div id="ptab-viva" class="pd-tab-content">
        <div style="max-width: 900px; margin: 0 auto;">
          <h3 style="margin-bottom: 24px; font-size: 1.4rem; color: ${p.color || 'var(--orange)'}; display: flex; align-items: center; gap: 10px;">❓ Viva Voce Questions & Answers</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${vivaList.map((v, idx) => `
              <div class="viva-accordion-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s;">
                <div onclick="const a=this.nextElementSibling; const icon=this.querySelector('.viva-toggle-icon'); if(a.style.display==='none'){a.style.display='block'; icon.textContent='−';}else{a.style.display='none'; icon.textContent='+';}" style="padding: 16px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: var(--surface2);">
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <span style="background: ${p.color || 'var(--orange)'}; color: #fff; border-radius: 6px; padding: 4px 10px; font-weight: bold; font-size: 0.85rem;">Q${idx + 1}</span>
                    <span style="font-weight: 600; font-size: 1rem; color: var(--text);">${v.q}</span>
                  </div>
                  <span class="viva-toggle-icon" style="font-size: 1.4rem; color: var(--text-muted); font-weight: bold;">+</span>
                </div>
                <div style="display: none; padding: 18px 24px; border-top: 1px solid var(--border); background: var(--surface); color: var(--text-muted); font-size: 0.98rem; line-height: 1.6;">
                  <strong style="color: #00FF88;">Answer:</strong> ${v.a}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    ` : ''}
    
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
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
                <h4 style="margin: 0; color: #00d4ff; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
                  <span>⚡ Pre-compiled Firmware & Serial Tools</span>
                </h4>
                <button onclick="openWebSerialMonitorModal()" class="btn-secondary" style="background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  🔌 Open Serial Monitor
                </button>
              </div>
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

globalThis.switchProjectTab = function(name, btn) {
  document.querySelectorAll('.pd-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pd-tab').forEach(t => t.classList.remove('active'));

  const tab = document.getElementById('ptab-' + name);
  if (tab) {
    tab.classList.add('active');
  }

  // Find matching button element
  const targetBtn = btn || document.querySelector(`.pd-tab[onclick*="'${name}'"]`);
  if (targetBtn) {
    targetBtn.classList.add('active');
    try {
      targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } catch (e) {}
  }
};

globalThis._galleryIndex = 0;

globalThis.openProjectLightbox = function(idx) {
  const p = currentProject;
  if (!p || !p.gallery || !p.gallery.length) return;

  globalThis._galleryIndex = idx;
  let modal = document.getElementById('projectGalleryPresentationModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'projectGalleryPresentationModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.96); z-index:99999; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:20px; backdrop-filter:blur(10px);';
    modal.innerHTML = `
      <!-- Top Bar -->
      <div style="width:100%; display:flex; justify-content:space-between; align-items:center; z-index:100001; padding: 0 10px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.1rem; font-weight:bold; color:#fff;" id="pGalleryTitle"></span>
          <span style="background:var(--surface2); color:var(--text-muted); padding:4px 10px; border-radius:12px; font-size:0.85rem;" id="pGalleryCounter"></span>
        </div>
        <div style="display:flex; gap:12px; align-items:center;">
          <button onclick="globalThis.toggleGalleryFullscreen()" class="btn-outline" style="padding:6px 12px; font-size:0.85rem; border-color:rgba(255,255,255,0.3); color:#fff; cursor:pointer;" title="Full Screen">⛶ Fullscreen</button>
          <a id="pGalleryDownload" href="" download target="_blank" class="btn-outline" style="padding:6px 12px; font-size:0.85rem; border-color:rgba(255,255,255,0.3); color:#fff; text-decoration:none;" title="Download">⬇️ Download</a>
          <button onclick="globalThis.closeProjectLightbox()" style="background:none; border:none; color:#fff; font-size:2rem; cursor:pointer; padding:0 8px;" title="Close (Esc)">✕</button>
        </div>
      </div>

      <!-- Main Image View area -->
      <div style="flex:1; width:100%; display:flex; align-items:center; justify-content:space-between; position:relative; overflow:hidden;">
        <button onclick="globalThis.navProjectLightbox(-1)" style="position:absolute; left:20px; z-index:100001; background:rgba(0,0,0,0.6); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:50%; width:50px; height:50px; font-size:1.5rem; cursor:pointer; backdrop-filter:blur(4px); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">❮</button>
        
        <div style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px;">
          <img id="pGalleryImg" src="" style="max-width:92%; max-height:82vh; object-fit:contain; border-radius:12px; box-shadow: 0 20px 50px rgba(0,0,0,0.8); transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);" />
          <div id="pGalleryCaption" style="margin-top:14px; color:#e0e0e0; font-size:1rem; text-align:center; max-width:800px; background:rgba(255,255,255,0.1); padding:8px 18px; border-radius:20px; backdrop-filter:blur(8px);"></div>
        </div>

        <button onclick="globalThis.navProjectLightbox(1)" style="position:absolute; right:20px; z-index:100001; background:rgba(0,0,0,0.6); color:#fff; border:1px solid rgba(255,255,255,0.2); border-radius:50%; width:50px; height:50px; font-size:1.5rem; cursor:pointer; backdrop-filter:blur(4px); transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'">❯</button>
      </div>

      <!-- Bottom Thumbnail Strip -->
      <div id="pGalleryThumbs" style="width:100%; display:flex; gap:10px; justify-content:center; overflow-x:auto; padding:10px 0;"></div>
    `;
    document.body.appendChild(modal);

    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('projectGalleryPresentationModal');
      if (modal && modal.style.display === 'flex') {
        if (e.key === 'Escape') globalThis.closeProjectLightbox();
        else if (e.key === 'ArrowLeft') globalThis.navProjectLightbox(-1);
        else if (e.key === 'ArrowRight') globalThis.navProjectLightbox(1);
      }
    });
  }

  modal.style.display = 'flex';
  globalThis.updateProjectLightboxState();
};

globalThis.updateProjectLightboxState = function() {
  const p = currentProject;
  if (!p || !p.gallery || !p.gallery.length) return;
  const idx = globalThis._galleryIndex;
  const imgData = p.gallery[idx];

  const titleEl = document.getElementById('pGalleryTitle');
  const counterEl = document.getElementById('pGalleryCounter');
  const imgEl = document.getElementById('pGalleryImg');
  const capEl = document.getElementById('pGalleryCaption');
  const dlEl = document.getElementById('pGalleryDownload');
  const thumbsEl = document.getElementById('pGalleryThumbs');

  if (titleEl) titleEl.textContent = p.title;
  if (counterEl) counterEl.textContent = `${idx + 1} / ${p.gallery.length}`;
  if (imgEl) imgEl.src = imgData.file;
  if (capEl) capEl.textContent = imgData.caption || p.title;
  if (dlEl) dlEl.href = imgData.file;

  if (thumbsEl) {
    thumbsEl.innerHTML = p.gallery.map((g, i) => `
      <img src="${g.file}" onclick="globalThis._galleryIndex=${i}; globalThis.updateProjectLightboxState();" style="width:50px; height:50px; object-fit:cover; border-radius:8px; cursor:pointer; opacity:${i === idx ? 1 : 0.4}; border: 2px solid ${i === idx ? (p.color || 'var(--orange)') : 'transparent'}; transition: all 0.2s;" />
    `).join('');
  }
};

globalThis.navProjectLightbox = function(dir) {
  const p = currentProject;
  if (!p || !p.gallery) return;
  globalThis._galleryIndex = (globalThis._galleryIndex + dir + p.gallery.length) % p.gallery.length;
  globalThis.updateProjectLightboxState();
};

globalThis.closeProjectLightbox = function() {
  const modal = document.getElementById('projectGalleryPresentationModal');
  if (modal) modal.style.display = 'none';
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
};

globalThis.toggleGalleryFullscreen = function() {
  const modal = document.getElementById('projectGalleryPresentationModal');
  if (!modal) return;
  if (!document.fullscreenElement) {
    if (modal.requestFullscreen) modal.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

globalThis.toggleDashboardFullscreen = function() {
  const container = document.getElementById('liveDashboardContainer');
  if (!container) return;
  if (!document.fullscreenElement) {
    if (container.requestFullscreen) container.requestFullscreen();
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

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
//  REAL FIRMWARE UPLOAD (esp-web-tools) & WEB SERIAL MONITOR
// =============================================
globalThis.openRealFirmwareFlasher = function (url, boardName = '') {
  const lcUrl = (url || '').toLowerCase();
  const mc = (currentProject?.hardwareSpecs?.microcontroller || boardName || '').toLowerCase();

  // If AVR / Arduino Hex binary
  if (lcUrl.endsWith('.hex') || mc.includes('arduino') || mc.includes('atmega') || mc.includes('uno') || mc.includes('nano')) {
    if (typeof openAvrFlasherModal === 'function') {
      openAvrFlasherModal(url, currentProject?.title || 'Arduino Firmware');
    } else {
      alert('AVR Web Flasher module is loading. Please try again in a moment.');
    }
    return;
  }

  // Check Web Serial API support in Chrome/Edge
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported in your browser.\nPlease open this webpage in Chrome or Edge desktop over HTTPS or http://localhost.');
    return;
  }

  // Dynamic Chip Family Detection (ESP8266 vs ESP32)
  const isESP8266 = lcUrl.includes('esp8266') || mc.includes('8266') || mc.includes('nodemcu') || mc.includes('wemos');
  const chipFamily = isESP8266 ? "ESP8266" : "ESP32";

  // 1. Inject esp-web-tools module script if not present
  if (!document.getElementById('espWebToolsScript')) {
    const script = document.createElement('script');
    script.type = 'module';
    script.id = 'espWebToolsScript';
    script.src = 'https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module';
    document.head.appendChild(script);
  }

  // 2. Resolve firmware path to absolute URL (required because manifest is a Blob URL
  //    and relative paths won't resolve against the page origin from a blob: context)
  const absoluteFirmwareUrl = new URL(url, window.location.href).href;

  // 3. Generate dynamic manifest Blob URL for ESP Web Tools
  const manifest = {
    name: currentProject ? currentProject.title : "Firmware",
    version: "1.0.0",
    builds: [
      {
        chipFamily: chipFamily,
        parts: [
          { path: absoluteFirmwareUrl, offset: 0 } // Absolute URL for reliable download
        ]
      }
    ]
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(blob);

  // 3. Inject Flasher Modal HTML
  if (!document.getElementById('firmwareModalOverlay')) {
    const modalHtml = `
      <div class="firmware-modal-overlay" id="firmwareModalOverlay">
        <div class="firmware-modal">
          <div class="firmware-header">
            <h3 id="fwModalTitle">⚡ Flash Firmware via Web Serial</h3>
            <button class="firmware-close" onclick="closeFirmwareModal()">✕</button>
          </div>
          <div class="firmware-body" style="text-align: center; padding: 24px 20px;">
            <div style="background: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.3); padding: 14px; border-radius: 10px; margin-bottom: 20px; font-size: 0.85rem; color: #a5f3fc; text-align: left; line-height: 1.5;">
              ℹ️ <b>Quick Flashing Guide:</b><br>
              1. Connect your <b>${chipFamily}</b> board via USB.<br>
              2. Close any open Serial Monitor tools in Arduino IDE.<br>
              3. Unplug any wires connected to <b>RX (GPIO3)</b> during flashing.<br>
              4. Click <b>INSTALL / CONNECT</b> below and select your board's COM port.
            </div>
            <p class="firmware-instructions" style="margin-bottom: 20px; font-weight: 600;">
              Firmware File: <b id="fwFileName" style="color: #00d4ff;"></b>
            </p>
            <div id="espInstallContainer" style="display: flex; justify-content: center; min-height: 60px; align-items: center;">
              <!-- Web Install Button dynamically rendered -->
            </div>
            <div style="margin-top: 24px; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
              <button onclick="openWebSerialMonitorModal()" class="btn-secondary" style="padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: bold; cursor: pointer; background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; display: flex; align-items: center; gap: 6px;">
                🔌 Open Live Serial Monitor
              </button>
            </div>
            <p style="margin-top: 20px; font-size: 0.78rem; color: var(--text-dim);">Powered by ESP Web Tools • Native Chrome/Edge WebSerial</p>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  const fileNameOnly = url.split('/').pop() || url;
  document.getElementById('fwFileName').textContent = fileNameOnly;
  document.getElementById('fwModalTitle').textContent = `⚡ Flash ${chipFamily} Firmware`;

  // 4. Inject Install Button Component
  const container = document.getElementById('espInstallContainer');
  container.innerHTML = '';
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
//  WEB SERIAL MONITOR MODULE (Live Console & Control)
// =============================================
let serialPort = null;
let serialReader = null;
let isSerialConnected = false;
let autoScrollSerial = true;

globalThis.openWebSerialMonitorModal = function() {
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported in this browser.\nPlease use Chrome or Edge desktop over HTTPS or http://localhost.');
    return;
  }

  if (!document.getElementById('serialMonitorOverlay')) {
    const html = `
      <div class="firmware-modal-overlay" id="serialMonitorOverlay">
        <div class="firmware-modal" style="max-width: 850px; width: 95%;">
          <div class="firmware-header">
            <h3>🔌 Live Web Serial Monitor & Telemetry</h3>
            <button class="firmware-close" onclick="closeSerialMonitorModal()">✕</button>
          </div>
          <div class="firmware-body" style="padding: 20px;">
            <!-- Serial Control Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);">
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <button id="serialConnectBtn" onclick="toggleWebSerialConnection()" style="background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                  🔌 Connect Serial
                </button>
                <select id="serialBaudRate" style="background: #0f172a; color: #f8fafc; border: 1px solid #334155; padding: 8px; border-radius: 8px; font-size: 0.85rem;">
                  <option value="115200" selected>115200 Baud (ESP8266/ESP32)</option>
                  <option value="9600">9600 Baud</option>
                  <option value="57600">57600 Baud</option>
                  <option value="74880">74880 Baud (ESP Boot)</option>
                  <option value="230400">230400 Baud</option>
                </select>
                <span id="serialStatusBadge" style="padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; background: #334155; color: #94a3b8;">
                  DISCONNECTED
                </span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <label style="font-size: 0.8rem; color: #94a3b8; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" id="serialAutoScroll" checked onchange="autoScrollSerial = this.checked"> Auto-Scroll
                </label>
                <button onclick="clearSerialConsole()" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                  🗑️ Clear
                </button>
              </div>
            </div>

            <!-- Terminal Output Console -->
            <pre id="serialTerminalLog" style="height: 350px; background: #0a0f1d; color: #38bdf8; padding: 14px; border-radius: 10px; overflow-y: auto; font-family: 'SF Mono', Consolas, monospace; font-size: 0.85rem; line-height: 1.4; border: 1px solid #1e293b; text-align: left; white-space: pre-wrap; word-break: break-all;">Select a COM port and click 'Connect Serial' to stream live telemetry logs...\n</pre>

            <!-- Serial Input Bar -->
            <div style="display: flex; gap: 8px; margin-top: 14px;">
              <input type="text" id="serialSendInput" placeholder="Type serial command here..." onkeypress="if(event.key==='Enter') sendSerialCommand()" style="flex: 1; background: #0f172a; color: #fff; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem;">
              <select id="serialLineEnding" style="background: #0f172a; color: #94a3b8; border: 1px solid #334155; padding: 8px; border-radius: 8px; font-size: 0.8rem;">
                <option value="both">Both NL & CR (\r\n)</option>
                <option value="nl">Newline (\n)</option>
                <option value="none">No ending</option>
              </select>
              <button onclick="sendSerialCommand()" style="background: #0284c7; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  const overlay = document.getElementById('serialMonitorOverlay');
  overlay.classList.add('active');
};

globalThis.closeSerialMonitorModal = function() {
  const overlay = document.getElementById('serialMonitorOverlay');
  if (overlay) overlay.classList.remove('active');
};

// =============================================
//  USB DRIVERS DOWNLOAD MODAL
// =============================================
globalThis.openDriversModal = function() {
  if (!document.getElementById('driversModalOverlay')) {
    const html = `
      <div class="firmware-modal-overlay" id="driversModalOverlay">
        <div class="firmware-modal" style="max-width: 720px; width: 95%;">
          <div class="firmware-header" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.1));">
            <h3 style="display: flex; align-items: center; gap: 10px; margin: 0; font-size: 1.25rem;">
              <span>💾</span> USB Microcontroller Drivers & Troubleshooting
            </h3>
            <button class="firmware-close" onclick="closeDriversModal()">✕</button>
          </div>
          <div class="firmware-body" style="padding: 24px;">
            <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 0; margin-bottom: 20px; line-height: 1.6;">
              If your PC does not recognize your Arduino, NodeMCU, or ESP32 board in the Serial Monitor or IDE, install the required USB-to-UART bridge driver below:
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin-bottom: 24px;">
              <!-- Driver 1: CH340 -->
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='#3b82f6'" onmouseout="this.style.borderColor='var(--border)'">
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #60a5fa; font-size: 1.05rem;">CH340 / CH341 Driver</strong>
                    <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">v3.4 (Windows)</span>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 16px;">
                    For Arduino Uno / Nano (CH340 chip), NodeMCU V3, Wemos D1 Mini clone boards.
                  </p>
                </div>
                <a href="data/drivers/CH34x_Install_Windows_v3_4.EXE" download class="btn-primary" style="text-align: center; text-decoration: none; padding: 10px 16px; font-size: 0.9rem; background: #2563eb; border: none; border-radius: 8px; color: #fff; font-weight: 600; display: block;">
                  ⬇️ Download CH340 Driver (243 KB)
                </a>
              </div>

              <!-- Driver 2: CP210x -->
              <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.borderColor='#10b981'" onmouseout="this.style.borderColor='var(--border)'">
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #34d399; font-size: 1.05rem;">Silicon Labs CP210x VCP</strong>
                    <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;">x64 (Windows)</span>
                  </div>
                  <p style="color: var(--text-muted); font-size: 0.88rem; line-height: 1.5; margin-bottom: 16px;">
                    For ESP32 NodeMCU, ESP-WROOM-32, NodeMCU V2 (CP2102 chip), and official boards.
                  </p>
                </div>
                <a href="data/drivers/CP210xVCPInstaller_x64.exe" download class="btn-primary" style="text-align: center; text-decoration: none; padding: 10px 16px; font-size: 0.9rem; background: #059669; border: none; border-radius: 8px; color: #fff; font-weight: 600; display: block;">
                  ⬇️ Download CP210x Driver (1.0 MB)
                </a>
              </div>
            </div>

            <!-- Quick Troubleshooting Steps -->
            <div style="background: var(--surface2); padding: 16px 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <strong style="color: #f59e0b; font-size: 0.95rem; display: block; margin-bottom: 6px;">💡 Hardware Troubleshooting Tips:</strong>
              <ul style="margin: 0; padding-left: 20px; color: var(--text); font-size: 0.88rem; line-height: 1.6;">
                <li>Always use a <strong>4-wire USB data cable</strong> (avoid charging-only 2-wire cables).</li>
                <li>After installing, un-plug and re-plug your microcontroller USB cable.</li>
                <li>Click <strong>🔌 Serial Monitor</strong> on the top bar to verify live communication!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  const overlay = document.getElementById('driversModalOverlay');
  if (overlay) overlay.classList.add('active');
};

globalThis.closeDriversModal = function() {
  const overlay = document.getElementById('driversModalOverlay');
  if (overlay) overlay.classList.remove('active');
};

globalThis.toggleWebSerialConnection = async function() {
  if (isSerialConnected) {
    await disconnectWebSerial();
  } else {
    await connectWebSerial();
  }
};

globalThis.connectWebSerial = async function() {
  try {
    const baudRate = Number.parseInt(document.getElementById('serialBaudRate').value, 10) || 115200;
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: baudRate });

    isSerialConnected = true;
    updateSerialUI(true);
    appendSerialLog(`\n[WEB SERIAL] Connected successfully at ${baudRate} baud.\n`);

    readSerialLoop();
  } catch (err) {
    console.error("Serial Connection Error:", err);
    appendSerialLog(`\n[WEB SERIAL ERROR] ${err.message || err}\n`);
  }
};

globalThis.disconnectWebSerial = async function() {
  try {
    if (serialReader) {
      await serialReader.cancel();
      serialReader = null;
    }
    if (serialPort) {
      await serialPort.close();
      serialPort = null;
    }
  } catch (err) {
    console.error("Disconnect Error:", err);
  } finally {
    isSerialConnected = false;
    updateSerialUI(false);
    appendSerialLog(`\n[WEB SERIAL] Disconnected.\n`);
  }
};

async function readSerialLoop() {
  const textDecoder = new TextDecoderStream();
  serialPort.readable.pipeTo(textDecoder.writable).catch(() => {});
  serialReader = textDecoder.readable.getReader();

  try {
    while (true) {
      const { value, done } = await serialReader.read();
      if (done) {
        serialReader.releaseLock();
        break;
      }
      if (value) {
        appendSerialLog(value);
      }
    }
  } catch (err) {
    console.error("Serial Read Error:", err);
  }
}

globalThis.sendSerialCommand = async function() {
  const input = document.getElementById('serialSendInput');
  const ending = document.getElementById('serialLineEnding').value;
  let text = input.value;
  if (!text || !serialPort || !isSerialConnected) return;

  if (ending === 'both') text += '\r\n';
  else if (ending === 'nl') text += '\n';

  const textEncoder = new TextEncoderStream();
  textEncoder.readable.pipeTo(serialPort.writable).catch(() => {});
  const writer = textEncoder.writable.getWriter();

  await writer.write(text);
  writer.releaseLock();

  appendSerialLog(`> ${input.value}\n`);
  input.value = '';
};

globalThis.clearSerialConsole = function() {
  const term = document.getElementById('serialTerminalLog');
  if (term) term.textContent = '[Console Cleared]\n';
};

function appendSerialLog(text) {
  const term = document.getElementById('serialTerminalLog');
  if (!term) return;
  term.textContent += text;
  if (autoScrollSerial) {
    term.scrollTop = term.scrollHeight;
  }
}

function updateSerialUI(connected) {
  const btn = document.getElementById('serialConnectBtn');
  const badge = document.getElementById('serialStatusBadge');
  if (connected) {
    btn.innerText = '🔌 Disconnect';
    btn.style.background = '#ef4444';
    badge.innerText = 'CONNECTED';
    badge.style.background = 'rgba(16, 185, 129, 0.2)';
    badge.style.color = '#10b981';
  } else {
    btn.innerText = '🔌 Connect Serial';
    btn.style.background = '#10b981';
    badge.innerText = 'DISCONNECTED';
    badge.style.background = '#334155';
    badge.style.color = '#94a3b8';
  }
}


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

// End of projects.js

