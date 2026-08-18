const fs = require('node:fs');
const PROJECTS = JSON.parse(fs.readFileSync('projects/datafolder/compiled_projects.json', 'utf8'));

try {
  const html = PROJECTS.map(p => `
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
  console.log('SUCCESS: Generated HTML for all ' + PROJECTS.length + ' projects. Length: ' + html.length);
} catch (err) {
  console.error('Error generating HTML:', err);
}
