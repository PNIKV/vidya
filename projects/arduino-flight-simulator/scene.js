// ============================================================
// VECTOR-1 FLIGHT SIM — 3D World (Enhanced Graphics)
// ============================================================

let scene, camera, renderer, plane, clouds = [], terrainChunks = [];
const globalStations = [];
let jetThrusterMat;
let skyMesh, sunLight, sunMesh, glowMesh, moonLight, moonMesh, starMesh, ambientLight;
let timeOfDay = 0.20; // Start at early morning
const CHUNK_SIZE = 800;
const RENDER_DIST = 2;

function initScene() {
  scene = new THREE.Scene();

  // Dynamic Sky Gradient Shader (Beautiful Sunset)
  const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    uniform float time;
    uniform float nightPhase;
    varying vec3 vWorldPosition;
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      vec4 baseColor = vec4(mix(bottomColor, topColor, max(pow(max(h , 0.0), exponent), 0.0)), 1.0);
      
      // Aurora Borealis
      float auroraVal = 0.0;
      vec2 uv = vWorldPosition.xz * 0.0003;
      float wave = 0.0;
      
      if (nightPhase > 0.0 && h > 0.1) {
          float t = time * 0.6;
          float wave1 = sin(uv.x * 2.0 + t + sin(uv.y * 1.5));
          float wave2 = sin(uv.y * 2.5 - t * 0.8 + sin(uv.x * 2.0));
          wave = (wave1 + wave2) * 0.5;
          
          float intensity = smoothstep(0.3, 0.9, wave);
          float mask = smoothstep(0.1, 0.4, h) * smoothstep(0.9, 0.6, h);
          auroraVal = intensity * mask * nightPhase * 1.2;
      }
      
      vec3 auroraColor = mix(vec3(0.1, 0.9, 0.4), vec3(0.5, 0.1, 0.8), wave * 0.5 + 0.5);
      gl_FragColor = vec4(baseColor.rgb + auroraColor * auroraVal, 1.0);
    }
  `;
  const uniforms = {
    topColor: { value: new THREE.Color(0x1a0b2e) },
    bottomColor: { value: new THREE.Color(0xff7b54) },
    offset: { value: 33 },
    exponent: { value: 0.6 },
    time: { value: 0.0 },
    nightPhase: { value: 0.0 }
  };

  scene.fog = new THREE.FogExp2(0xff7b54, 0.00028);
  const skyGeo = new THREE.SphereGeometry(6000, 32, 15);
  const skyMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.BackSide });
  skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 8000);

  // Cinematic Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  document.body.appendChild(renderer.domElement);

  // Lighting & Sun
  // Lighting & Sun
  ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xffeedd, 3.0);
  sunLight.position.set(1000, 1000, -2000);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 100;
  sunLight.shadow.camera.far = 4000;
  sunLight.shadow.camera.left = -800; sunLight.shadow.camera.right = 800;
  sunLight.shadow.camera.top = 800; sunLight.shadow.camera.bottom = -800;
  sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  // Cinematic Sunset Sun
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffee, transparent: true, opacity: 0.95 }));
  sunMesh.position.copy(sunLight.position);
  scene.add(sunMesh);

  // Massive Additive Glow
  glowMesh = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
  glowMesh.position.copy(sunLight.position);
  scene.add(glowMesh);

  // Night elements
  moonLight = new THREE.DirectionalLight(0xaaccff, 0.5);
  moonLight.castShadow = true;
  moonLight.shadow.camera.near = 100;
  moonLight.shadow.camera.far = 4000;
  moonLight.shadow.camera.left = -800; moonLight.shadow.camera.right = 800;
  moonLight.shadow.camera.top = 800; moonLight.shadow.camera.bottom = -800;
  moonLight.shadow.mapSize.width = 2048; moonLight.shadow.mapSize.height = 2048;
  scene.add(moonLight);

  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(120, 32, 32), new THREE.MeshBasicMaterial({ color: 0xddddff }));
  scene.add(moonMesh);

  // Stars
  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 2000;
  const posArray = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    const r = 5500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI / 2.2; // upper hemisphere only
    posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = r * Math.cos(phi);
    posArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  // fog: false makes the stars visible despite the heavy atmosphere at night
  const starsMat = new THREE.PointsMaterial({ size: 12, color: 0xffffff, transparent: true, opacity: 0, fog: false });
  starMesh = new THREE.Points(starsGeo, starsMat);
  scene.add(starMesh);

  buildPlane();
  initTerrain();
  buildClouds();

  // Create main base at origin
  buildLaunchPad(0, 0);

  // Generate 8 random far-away outposts
  for (let i = 0; i < 8; i++) {
    const rx = (Math.random() > 0.5 ? 1 : -1) * (3000 + Math.random() * 12000);
    const rz = (Math.random() > 0.5 ? 1 : -1) * (3000 + Math.random() * 12000);
    buildLaunchPad(rx, rz);
  }

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function buildPlane() {
  plane = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 0.4, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.9, roughness: 0.1 });
  const detailMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.3, roughness: 0.7 });

  // Main Fuselage (Long nose)
  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 8, 16), hullMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.z = -2.0;
  fuselage.castShadow = true;
  plane.add(fuselage);

  // Nose Cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.5, 16), hullMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -7.25;
  nose.castShadow = true;
  plane.add(nose);

  // Cockpit
  const cockpit = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 12), glassMat);
  cockpit.rotation.x = Math.PI / 2;
  cockpit.position.set(0, 0.5, -1.0);
  cockpit.scale.set(0.8, 1, 0.5);
  plane.add(cockpit);

  // Back Body (where wings attach)
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3.5), hullMat);
  back.position.set(0, 0, 2.5);
  back.castShadow = true;
  plane.add(back);

  // Astromech Droid
  const droid = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.8 }));
  droid.position.set(0, 0.6, 1.0);
  plane.add(droid);

  // Wings (X configuration)
  const wingGeo = new THREE.BoxGeometry(3.5, 0.1, 1.5);

  const angles = [
    { zRot: 0.35, yPos: 0.4, xSign: 1 },   // Top Right
    { zRot: -0.35, yPos: 0.4, xSign: -1 }, // Top Left
    { zRot: -0.35, yPos: -0.4, xSign: 1 }, // Bottom Right
    { zRot: 0.35, yPos: -0.4, xSign: -1 }  // Bottom Left
  ];

  jetThrusterMat = new THREE.MeshBasicMaterial({ color: 0xff77aa, transparent: true, blending: THREE.AdditiveBlending });

  angles.forEach((config) => {
    // Wing Group
    const wingGroup = new THREE.Group();
    wingGroup.position.set(config.xSign * 0.8, config.yPos, 2.5);
    wingGroup.rotation.z = config.zRot;

    // Wing Mesh
    const wing = new THREE.Mesh(wingGeo, hullMat);
    wing.position.set(config.xSign * 1.75, 0, 0);
    wing.castShadow = true;
    wingGroup.add(wing);

    // Laser Cannon (long thin cylinder)
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.0, 8), darkMat);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(config.xSign * 3.4, 0, -1.0);
    wingGroup.add(cannon);

    // Laser details
    const cannonTip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8), hullMat);
    cannonTip.rotation.x = Math.PI / 2;
    cannonTip.position.set(config.xSign * 3.4, 0, -2.5);
    wingGroup.add(cannonTip);

    // Red wing stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 1.51), detailMat);
    stripe.position.set(config.xSign * 2.5, 0, 0);
    wingGroup.add(stripe);

    plane.add(wingGroup);

    // Engine Cylinders
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3.0, 16), hullMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(config.xSign * 1.2, config.yPos * 1.5, 2.5);
    engine.castShadow = true;
    plane.add(engine);

    // Engine Intake (Dark front)
    const intake = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), darkMat);
    intake.rotation.x = Math.PI / 2;
    intake.position.set(config.xSign * 1.2, config.yPos * 1.5, 0.9);
    plane.add(intake);

    // Thruster Glow (Back)
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 1.0, 16), jetThrusterMat);
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(config.xSign * 1.2, config.yPos * 1.5, 4.2);
    plane.add(thruster);
  });

  // Aircraft Night Illumination
  const navLightR = new THREE.PointLight(0xff0000, 1.5, 30);
  navLightR.position.set(-3.5, 0, 1.5);
  plane.add(navLightR);

  const navLightG = new THREE.PointLight(0x00ff00, 1.5, 30);
  navLightG.position.set(3.5, 0, 1.5);
  plane.add(navLightG);

  const bodyLight = new THREE.PointLight(0xffffff, 1.0, 40);
  bodyLight.position.set(0, 5, 0);
  plane.add(bodyLight);

  scene.add(plane);
}

function updatePlaneVisuals(throttle, speed) {
  if (jetThrusterMat) {
    jetThrusterMat.opacity = throttle > 0.05 ? 0.4 + (throttle * 0.6) : 0;
    jetThrusterMat.color.setHex(Math.random() > 0.8 ? 0xffbbdd : 0xff77aa);
  }
}

function makeTerrainChunk(cx, cz) {
  const segs = 32;
  const geo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx * CHUNK_SIZE;
    const z = pos.getZ(i) + cz * CHUNK_SIZE;
    pos.setY(i, terrainHeight(x, z));
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0x24331e, roughness: 0.95, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
  mesh.receiveShadow = true;
  mesh.userData.cx = cx; mesh.userData.cz = cz;
  scene.add(mesh);

  if (typeof treeGeo !== 'undefined') {
    const treeCount = 80;
    const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
    trees.castShadow = true;
    trees.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeCount; i++) {
      const tx = (Math.random() - 0.5) * CHUNK_SIZE;
      const tz = (Math.random() - 0.5) * CHUNK_SIZE;
      const wX = tx + cx * CHUNK_SIZE;
      const wZ = tz + cz * CHUNK_SIZE;
      const ty = terrainHeight(wX, wZ);

      dummy.position.set(wX, ty, wZ);
      dummy.scale.setScalar(0.4 + Math.random() * 1.2);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.rotation.z = (Math.random() - 0.5) * 0.2;
      dummy.rotation.x = (Math.random() - 0.5) * 0.2;
      dummy.updateMatrix();
      trees.setMatrixAt(i, dummy.matrix);
    }
    scene.add(trees);
    mesh.userData.trees = trees;
  }

  return mesh;
}

function terrainHeight(x, z) {
  const h1 = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 70;
  const h2 = Math.sin(x * 0.015) * Math.cos(z * 0.01) * 15;
  const h3 = Math.sin(x * 0.04) * Math.cos(z * 0.03) * 5;
  return h1 + h2 + h3 - 35;
}

let treeGeo, treeMat;
function initTerrain() {
  treeGeo = new THREE.ConeGeometry(12, 35, 5);
  treeGeo.translate(0, 17.5, 0);
  treeMat = new THREE.MeshStandardMaterial({ color: 0x1c3814, roughness: 0.9, flatShading: true });

  for (let cx = -RENDER_DIST; cx <= RENDER_DIST; cx++) {
    for (let cz = -RENDER_DIST; cz <= RENDER_DIST; cz++) terrainChunks.push(makeTerrainChunk(cx, cz));
  }
}

function updateTerrain(px, pz) {
  const ccx = Math.round(px / CHUNK_SIZE);
  const ccz = Math.round(pz / CHUNK_SIZE);
  const needed = new Set();
  for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
    for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) needed.add((ccx + dx) + ',' + (ccz + dz));
  }
  terrainChunks = terrainChunks.filter(chunk => {
    const key = chunk.userData.cx + ',' + chunk.userData.cz;
    if (!needed.has(key)) {
      scene.remove(chunk);
      chunk.geometry.dispose();
      if (chunk.userData.trees) {
        scene.remove(chunk.userData.trees);
        chunk.userData.trees.dispose();
      }
      return false;
    }
    needed.delete(key); return true;
  });
  needed.forEach(key => {
    const [cx, cz] = key.split(',').map(Number);
    terrainChunks.push(makeTerrainChunk(cx, cz));
  });
}

function buildClouds() {
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffddcc, transparent: true, opacity: 0.8, roughness: 1.0, flatShading: true });

  for (let i = 0; i < 70; i++) {
    const group = new THREE.Group();
    const puffs = 5 + Math.floor(Math.random() * 5);
    for (let p = 0; p < puffs; p++) {
      const r = 30 + Math.random() * 40;
      const geo = new THREE.IcosahedronGeometry(r, 1);

      const puff = new THREE.Mesh(geo, cloudMat);
      puff.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 120);
      puff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(puff);
    }
    // Altitude: 750 * 3.5 = 2625 ft to ~6000 ft
    group.position.set((Math.random() - 0.5) * 4000, 750 + Math.random() * 1000, (Math.random() - 0.5) * 4000);
    scene.add(group);
    clouds.push(group);
  }
}

function recycleClouds(px, py, pz) {
  clouds.forEach(c => {
    const dx = c.position.x - px, dy = c.position.y - py, dz = c.position.z - pz;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 2500) {
      c.position.x = px + (Math.random() - 0.5) * 4000;
      c.position.y = Math.max(750, py + (Math.random() - 0.5) * 1500); // Always > 2500 ft (y=714)
      c.position.z = pz + (Math.random() - 0.5) * 4000;
    }
  });
}

function updateEnvironment(px, py, pz, dt) {
  // 240 seconds for a full 4 min cycle => dt / 240.0
  if (dt) timeOfDay = (timeOfDay + dt / 240.0) % 1.0;

  const angle = timeOfDay * Math.PI * 2;
  const sunY = Math.sin(angle) * 2000;
  const sunZ = Math.cos(angle) * 2000;
  const sunX = 1000;

  if (sunLight) {
    sunLight.position.set(px + sunX, py + sunY, pz + sunZ);
    sunLight.target.position.set(px, py, pz);
    sunLight.target.updateMatrixWorld();
    if (sunMesh) sunMesh.position.copy(sunLight.position);
    if (glowMesh) glowMesh.position.copy(sunLight.position);
    sunLight.intensity = Math.max(0, Math.sin(angle)) * 3.0;
  }

  if (moonLight) {
    moonLight.position.set(px - sunX, py - sunY, pz - sunZ);
    moonLight.target.position.set(px, py, pz);
    moonLight.target.updateMatrixWorld();
    if (moonMesh) moonMesh.position.copy(moonLight.position);
    moonLight.intensity = Math.max(0, -Math.sin(angle)) * 0.8;
  }

  if (skyMesh) {
    skyMesh.position.set(px, py, pz);

    let topCol, botCol, fogCol;
    if (sunY > 500) {
      topCol = new THREE.Color(0x1a438a); botCol = new THREE.Color(0x8bc3f0);
    } else if (sunY > 0) {
      const t = sunY / 500;
      topCol = new THREE.Color(0x1a0b2e).lerp(new THREE.Color(0x1a438a), t);
      botCol = new THREE.Color(0xff7b54).lerp(new THREE.Color(0x8bc3f0), t);
    } else if (sunY > -500) {
      const t = (sunY + 500) / 500;
      topCol = new THREE.Color(0x020111).lerp(new THREE.Color(0x1a0b2e), t);
      botCol = new THREE.Color(0x0a0a2a).lerp(new THREE.Color(0xff7b54), t);
    } else {
      topCol = new THREE.Color(0x020111); botCol = new THREE.Color(0x0a0a2a);
    }
    fogCol = botCol;

    skyMesh.material.uniforms.topColor.value.copy(topCol);
    skyMesh.material.uniforms.bottomColor.value.copy(botCol);
    scene.fog.color.copy(fogCol);

    if (ambientLight) ambientLight.intensity = sunY > 0 ? 0.2 + (sunY / 2000) * 0.3 : 0.05;

    // Update Aurora Uniforms
    skyMesh.material.uniforms.time.value += dt;
    skyMesh.material.uniforms.nightPhase.value = Math.max(0, -Math.sin(angle));
  }

  if (starMesh) {
    starMesh.position.set(px, py, pz);
    starMesh.material.opacity = Math.max(0, -Math.sin(angle));
  }
}

function buildLaunchPad(x, z) {
  // Pad is suspended 50 units above terrain
  const y = terrainHeight(x, z) + 50;
  globalStations.push({ x: x, y: y, z: z });

  const padGroup = new THREE.Group();
  padGroup.position.set(x, 0, z); // Group localized at x, z

  // Star Wars aesthetic materials
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.6 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6, metalness: 0.8 });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });

  // Main runway deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(100, 4, 200), floorMat);
  deck.position.set(0, y - 2, 0); // Top is at y
  deck.receiveShadow = true;
  deck.castShadow = true;
  padGroup.add(deck);

  // Pillars deep into the ground
  const pillarGeo = new THREE.CylinderGeometry(4, 4, 200, 16);
  const pillarYOffset = y - 2 - 100; // Shift down to attach to deck
  const p1 = new THREE.Mesh(pillarGeo, accentMat); p1.position.set(-40, pillarYOffset, -80); padGroup.add(p1);
  const p2 = new THREE.Mesh(pillarGeo, accentMat); p2.position.set(40, pillarYOffset, -80); padGroup.add(p2);
  const p3 = new THREE.Mesh(pillarGeo, accentMat); p3.position.set(-40, pillarYOffset, 80); padGroup.add(p3);
  const p4 = new THREE.Mesh(pillarGeo, accentMat); p4.position.set(40, pillarYOffset, 80); padGroup.add(p4);

  // Star Wars style trench edges
  const wallGeo = new THREE.BoxGeometry(4, 10, 200);
  const leftWall = new THREE.Mesh(wallGeo, accentMat); leftWall.position.set(-52, y + 1, 0); padGroup.add(leftWall);
  const rightWall = new THREE.Mesh(wallGeo, accentMat); rightWall.position.set(52, y + 1, 0); padGroup.add(rightWall);

  // Glowing runway strip lights
  for (let lz = -90; lz <= 90; lz += 20) {
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 6), lightMat);
    stripL.position.set(-30, y + 0.1, lz);
    padGroup.add(stripL);

    const stripR = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 6), lightMat);
    stripR.position.set(30, y + 0.1, lz);
    padGroup.add(stripR);
  }

  scene.add(padGroup);
}