// ============================================================
// VECTOR-1 FLIGHT SIM — 3D World & High-Fidelity Jet Fighter
// ============================================================

let scene, camera, renderer, plane, clouds = [], terrainChunks = [];
const globalStations = [];
let jetThrusterMat, jetFlameMesh1, jetFlameMesh2;
let leftAileron, rightAileron, leftElevator, rightElevator, leftRudder, rightRudder, canards;
let noseGear, leftGear, rightGear;
let taxiLight, navLightR, navLightG, strobeLight;
let skyMesh, sunLight, sunMesh, glowMesh, moonLight, moonMesh, starMesh, ambientLight;
let timeOfDay = 0.50; // Default to crisp afternoon daylight (0.5 = noon, 0.78 = sunset, 0.0 = midnight)
let isAutoTimeCycle = false;
const CHUNK_SIZE = 800;
const RENDER_DIST = 2;

// Challenge & Course System
let challengeRings = [];
let activeRingIndex = 0;
let challengeActive = true;
let totalRingsCount = 10;
let ringBeams = [];
let rotatingRadars = [];
let animatedApproachLights = [];

function initScene() {
  scene = new THREE.Scene();

  // Dynamic Sky Gradient Shader with Aurora Borealis & Atmospheric Scattering
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
      
      // Dynamic Aurora Borealis in polar night sky
      float auroraVal = 0.0;
      vec2 uv = vWorldPosition.xz * 0.0003;
      float wave = 0.0;
      
      if (nightPhase > 0.05 && h > 0.12) {
          float t = time * 0.5;
          float wave1 = sin(uv.x * 2.2 + t + sin(uv.y * 1.4));
          float wave2 = sin(uv.y * 2.8 - t * 0.7 + sin(uv.x * 2.1));
          wave = (wave1 + wave2) * 0.5;
          
          float intensity = smoothstep(0.25, 0.85, wave);
          float mask = smoothstep(0.12, 0.45, h) * smoothstep(0.9, 0.65, h);
          auroraVal = intensity * mask * nightPhase * 1.4;
      }
      
      vec3 auroraColor = mix(vec3(0.08, 0.95, 0.5), vec3(0.65, 0.15, 0.95), wave * 0.5 + 0.5);
      gl_FragColor = vec4(baseColor.rgb + auroraColor * auroraVal, 1.0);
    }
  `;
  const uniforms = {
    topColor: { value: new THREE.Color(0x134e8d) },
    bottomColor: { value: new THREE.Color(0x9bd0f5) },
    offset: { value: 33 },
    exponent: { value: 0.6 },
    time: { value: 0.0 },
    nightPhase: { value: 0.0 }
  };

  scene.fog = new THREE.FogExp2(0x9bd0f5, 0.00022);
  const skyGeo = new THREE.SphereGeometry(6500, 32, 16);
  const skyMat = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, side: THREE.BackSide });
  skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 9000);

  // Cinematic Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.appendChild(renderer.domElement);

  // Lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xfffaed, 3.2);
  sunLight.position.set(1200, 1500, -2000);
  sunLight.castShadow = true;
  sunLight.shadow.camera.near = 100;
  sunLight.shadow.camera.far = 4500;
  sunLight.shadow.camera.left = -900; sunLight.shadow.camera.right = 900;
  sunLight.shadow.camera.top = 900; sunLight.shadow.camera.bottom = -900;
  sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);

  // Visual Sun Disc
  sunMesh = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 32), new THREE.MeshBasicMaterial({ color: 0xfffbee, transparent: true, opacity: 0.95 }));
  sunMesh.position.copy(sunLight.position);
  scene.add(sunMesh);

  // Sun Glow Halo
  glowMesh = new THREE.Mesh(new THREE.SphereGeometry(650, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending }));
  glowMesh.position.copy(sunLight.position);
  scene.add(glowMesh);

  // Night Moon
  moonLight = new THREE.DirectionalLight(0xaaccff, 0.6);
  moonLight.castShadow = true;
  moonLight.shadow.camera.near = 100;
  moonLight.shadow.camera.far = 4500;
  moonLight.shadow.camera.left = -900; moonLight.shadow.camera.right = 900;
  moonLight.shadow.camera.top = 900; moonLight.shadow.camera.bottom = -900;
  moonLight.shadow.mapSize.width = 1024; moonLight.shadow.mapSize.height = 1024;
  scene.add(moonLight);

  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 32), new THREE.MeshBasicMaterial({ color: 0xddeeff }));
  scene.add(moonMesh);

  // Starfield
  const starsGeo = new THREE.BufferGeometry();
  const starsCount = 2500;
  const posArray = new Float32Array(starsCount * 3);
  for (let i = 0; i < starsCount; i++) {
    const r = 5800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI / 2.1;
    posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    posArray[i * 3 + 1] = r * Math.cos(phi);
    posArray[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const starsMat = new THREE.PointsMaterial({ size: 14, color: 0xffffff, transparent: true, opacity: 0, fog: false });
  starMesh = new THREE.Points(starsGeo, starsMat);
  scene.add(starMesh);

  // Build World Components
  buildPlane();
  initTerrain();
  buildClouds();

  // Create Start Airbase at origin (runway y = 50)
  buildAirfield(0, 0, 50, "BASE ALPHA (START)", 0);

  // Create Destination Aerodrome at (0, -4500) with runway elevated at y = 140
  buildAirfield(0, -4800, 120, "DESTINATION BASE (LAND HERE)", 1);

  // Build the Ring Challenge Flight Path
  buildRingChallengeCourse();

  // Add scenic ocean water plane at low altitude
  const waterGeo = new THREE.PlaneGeometry(24000, 24000);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x09253d,
    roughness: 0.2,
    metalness: 0.8,
    transparent: true,
    opacity: 0.88
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = -34;
  scene.add(waterMesh);

  // Initialize time of day to Day
  setTimeOfDay(0.50);

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================
// HIGH-FIDELITY JET FIGHTER MODEL ("VECTOR-24 APEX")
// ============================================================
function buildPlane() {
  plane = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x3a4454,
    metalness: 0.5,
    roughness: 0.35,
    flatShading: false
  });
  const darkSkinMat = new THREE.MeshStandardMaterial({
    color: 0x1b2029,
    metalness: 0.6,
    roughness: 0.4
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x061522,
    metalness: 0.95,
    roughness: 0.08,
    transparent: true,
    opacity: 0.65
  });
  const interiorMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x00d8b4, roughness: 0.3, metalness: 0.5 });
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x222226, metalness: 0.9, roughness: 0.2 });

  // 1. Central Lifting Fuselage
  const fuseGeo = new THREE.CylinderGeometry(0.55, 0.9, 7.5, 16);
  fuseGeo.scale(1.4, 0.65, 1.0);
  const fuselage = new THREE.Mesh(fuseGeo, skinMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.position.set(0, 0, -0.5);
  fuselage.castShadow = true;
  plane.add(fuselage);

  // 2. Chined Nose Cone & Stealth Radome
  const noseGeo = new THREE.ConeGeometry(0.55, 3.2, 16);
  noseGeo.scale(1.4, 0.65, 1.0);
  const nose = new THREE.Mesh(noseGeo, skinMat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, -5.8);
  nose.castShadow = true;
  plane.add(nose);

  // Pitot Probe at Nose Tip
  const pitot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8), darkSkinMat);
  pitot.rotation.x = Math.PI / 2;
  pitot.position.set(0, 0, -7.8);
  plane.add(pitot);

  // 3. Cockpit Canopy & Interior
  const canopyGeo = new THREE.SphereGeometry(0.7, 16, 16);
  canopyGeo.scale(0.65, 0.55, 2.6);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.42, -2.2);
  plane.add(canopy);

  // Pilot Ejection Seat & HUD Projector
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.4), interiorMat);
  seat.position.set(0, 0.35, -2.0);
  plane.add(seat);

  const hudGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.15, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x7fdbca, transparent: true, opacity: 0.6 })
  );
  hudGlass.position.set(0, 0.48, -3.1);
  hudGlass.rotation.x = -0.3;
  plane.add(hudGlass);

  // 4. Twin Air Intakes (Left & Right)
  [-1, 1].forEach(side => {
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 3.2), skinMat);
    intake.position.set(side * 0.9, -0.15, -0.8);
    intake.castShadow = true;
    plane.add(intake);

    const intakeLip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.38, 0.2), darkSkinMat);
    intakeLip.position.set(side * 0.9, -0.15, -2.4);
    plane.add(intakeLip);
  });

  // 5. Main Swept Wings with Moving Ailerons
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4.8, 1.8);
  wingShape.lineTo(4.7, 2.7);
  wingShape.lineTo(0.5, 2.8);
  wingShape.lineTo(0, 0);

  const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
  const wingGeometry = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeometry.rotateX(Math.PI / 2);
  wingGeometry.rotateY(Math.PI);
  wingGeometry.translate(0, 0, 0);

  // Right Wing
  const rightWingGroup = new THREE.Group();
  rightWingGroup.position.set(0.6, 0.02, 1.2);
  const rightWingMesh = new THREE.Mesh(wingGeometry, skinMat);
  rightWingMesh.castShadow = true;
  rightWingGroup.add(rightWingMesh);

  // Right Aileron (Rotates on roll)
  rightAileron = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), darkSkinMat);
  rightAileron.position.set(3.0, 0, 1.6);
  rightWingGroup.add(rightAileron);
  plane.add(rightWingGroup);

  // Left Wing (Mirrored)
  const leftWingGroup = new THREE.Group();
  leftWingGroup.position.set(-0.6, 0.02, 1.2);
  leftWingGroup.scale.x = -1;
  const leftWingMesh = new THREE.Mesh(wingGeometry, skinMat);
  leftWingMesh.castShadow = true;
  leftWingGroup.add(leftWingMesh);

  // Left Aileron (Rotates on roll)
  leftAileron = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), darkSkinMat);
  leftAileron.position.set(3.0, 0, 1.6);
  leftWingGroup.add(leftAileron);
  plane.add(leftWingGroup);

  // Wingtip Missile / Avionics Rails
  [-1, 1].forEach(side => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), darkSkinMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(side * 5.4, 0.02, 0.6);
    plane.add(rail);
  });

  // 6. Canards (Foreplanes near cockpit)
  canards = new THREE.Group();
  [-1, 1].forEach(side => {
    const canard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.7), darkSkinMat);
    canard.position.set(side * 1.1, 0.1, -3.2);
    canards.add(canard);
  });
  plane.add(canards);

  // 7. Horizontal Stabilizers / Elevators (Rear)
  const elevGeo = new THREE.BoxGeometry(1.6, 0.08, 0.9);
  leftElevator = new THREE.Mesh(elevGeo, skinMat);
  leftElevator.position.set(-1.6, 0.05, 3.4);
  plane.add(leftElevator);

  rightElevator = new THREE.Mesh(elevGeo, skinMat);
  rightElevator.position.set(1.6, 0.05, 3.4);
  plane.add(rightElevator);

  // 8. Twin Canted Vertical Stabilizers (Tilted Fins) with Rudders
  const finGeo = new THREE.BoxGeometry(0.08, 1.6, 1.4);
  
  const leftFinGroup = new THREE.Group();
  leftFinGroup.position.set(-1.0, 0.7, 2.8);
  leftFinGroup.rotation.z = -0.25; // Canted outward
  const leftFin = new THREE.Mesh(finGeo, skinMat);
  leftFinGroup.add(leftFin);
  leftRudder = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.2, 0.35), darkSkinMat);
  leftRudder.position.set(0, 0, 0.7);
  leftFinGroup.add(leftRudder);
  plane.add(leftFinGroup);

  const rightFinGroup = new THREE.Group();
  rightFinGroup.position.set(1.0, 0.7, 2.8);
  rightFinGroup.rotation.z = 0.25; // Canted outward
  const rightFin = new THREE.Mesh(finGeo, skinMat);
  rightFinGroup.add(rightFin);
  rightRudder = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.2, 0.35), darkSkinMat);
  rightRudder.position.set(0, 0, 0.7);
  rightFinGroup.add(rightRudder);
  plane.add(rightFinGroup);

  // 9. Twin Jet Engines & Dynamic Afterburners
  [-1, 1].forEach((side, i) => {
    // Engine Nacelle
    const engineNacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 4.0, 16), skinMat);
    engineNacelle.rotation.x = Math.PI / 2;
    engineNacelle.position.set(side * 0.75, 0.0, 1.8);
    engineNacelle.castShadow = true;
    plane.add(engineNacelle);

    // Nozzle Petals
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.6, 16), nozzleMat);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(side * 0.75, 0.0, 3.9);
    plane.add(nozzle);

    // Inner Glowing Core
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12),
      new THREE.MeshBasicMaterial({ color: 0xff6600 })
    );
    core.rotation.x = Math.PI / 2;
    core.position.set(side * 0.75, 0.0, 3.8);
    plane.add(core);
  });

  // Dynamic Exhaust Flame Cones
  jetThrusterMat = new THREE.MeshBasicMaterial({
    color: 0x44aaff,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending
  });

  const flameGeo = new THREE.ConeGeometry(0.38, 2.6, 16);
  flameGeo.rotateX(-Math.PI / 2);
  flameGeo.translate(0, 0, 1.3);

  jetFlameMesh1 = new THREE.Mesh(flameGeo, jetThrusterMat);
  jetFlameMesh1.position.set(-0.75, 0.0, 4.1);
  plane.add(jetFlameMesh1);

  jetFlameMesh2 = new THREE.Mesh(flameGeo, jetThrusterMat);
  jetFlameMesh2.position.set(0.75, 0.0, 4.1);
  plane.add(jetFlameMesh2);

  // 10. Retractable Landing Gear (Tricycle gear)
  // Nose Gear
  noseGear = new THREE.Group();
  noseGear.position.set(0, -0.3, -3.2);
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), darkSkinMat);
  noseStrut.position.y = -0.5;
  noseGear.add(noseStrut);
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12), darkSkinMat);
  noseWheel.rotation.z = Math.PI / 2;
  noseWheel.position.y = -1.0;
  noseGear.add(noseWheel);
  plane.add(noseGear);

  // Main Gear (Left & Right)
  leftGear = buildMainGearGroup(-1.3);
  plane.add(leftGear);
  rightGear = buildMainGearGroup(1.3);
  plane.add(rightGear);

  // 11. Aircraft Navigation & Strobe Lights
  navLightR = new THREE.PointLight(0xff0022, 1.5, 30);
  navLightR.position.set(-5.5, 0.02, 0.6);
  plane.add(navLightR);

  navLightG = new THREE.PointLight(0x00ff66, 1.5, 30);
  navLightG.position.set(5.5, 0.02, 0.6);
  plane.add(navLightG);

  strobeLight = new THREE.PointLight(0xffffff, 0, 60);
  strobeLight.position.set(0, 1.6, 3.4);
  plane.add(strobeLight);

  // Forward Taxi / Landing Spotlight
  taxiLight = new THREE.SpotLight(0xffeedd, 3.5, 180, Math.PI / 7, 0.4);
  taxiLight.position.set(0, -0.3, -3.5);
  taxiLight.target.position.set(0, -2, -30);
  plane.add(taxiLight);
  plane.add(taxiLight.target);

  scene.add(plane);
}

function buildMainGearGroup(xPos) {
  const group = new THREE.Group();
  group.position.set(xPos, -0.2, 1.2);
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  strut.position.y = -0.5;
  group.add(strut);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));
  wheel.rotation.z = Math.PI / 2;
  wheel.position.y = -1.0;
  group.add(wheel);
  return group;
}

// Visual animations for control surfaces, gear, afterburner, and lights
let strobeTimer = 0;
function updatePlaneVisuals(throttle, speed) {
  if (!plane) return;

  // 1. Control surface deflections based on active inputs
  const pInput = Input.pitch;
  const rInput = Input.roll;
  const yInput = Input.yaw;

  if (leftAileron && rightAileron) {
    leftAileron.rotation.x = -rInput * 0.4;
    rightAileron.rotation.x = rInput * 0.4;
  }
  if (leftElevator && rightElevator) {
    leftElevator.rotation.x = -pInput * 0.45;
    rightElevator.rotation.x = -pInput * 0.45;
  }
  if (canards) {
    canards.rotation.x = pInput * 0.35;
  }
  if (leftRudder && rightRudder) {
    leftRudder.rotation.y = yInput * 0.4;
    rightRudder.rotation.y = yInput * 0.4;
  }

  // 2. Retractable landing gear
  // Retract gear if airborne and altitude > 10 units; deploy when approaching ground or grounded
  const heightAgl = Physics.altitude - ((typeof terrainHeight === 'function') ? terrainHeight(Physics.position.x, Physics.position.z) + 2 : 2);
  const targetGearRetract = (!Physics.grounded && heightAgl > 12) ? 1.0 : 0.0;
  
  if (noseGear && leftGear && rightGear) {
    const currentRot = noseGear.rotation.x;
    const destRot = targetGearRetract * (Math.PI / 2);
    const newRot = currentRot + (destRot - currentRot) * 0.1;
    noseGear.rotation.x = newRot;
    leftGear.rotation.z = targetGearRetract * (-Math.PI / 2.2);
    rightGear.rotation.z = targetGearRetract * (Math.PI / 2.2);
  }

  // 3. Dynamic Afterburner Flames & Shock Diamonds
  if (jetThrusterMat && jetFlameMesh1 && jetFlameMesh2) {
    if (throttle > 0.08) {
      jetThrusterMat.opacity = Math.min(1.0, (throttle - 0.08) * 1.25);
      
      // Scale length with throttle and add subtle high-speed flame flicker
      const flicker = 0.95 + Math.random() * 0.12;
      const lengthScale = (1.0 + throttle * 2.8) * flicker;
      const widthScale = (0.8 + throttle * 0.6) * flicker;
      
      jetFlameMesh1.scale.set(widthScale, widthScale, lengthScale);
      jetFlameMesh2.scale.set(widthScale, widthScale, lengthScale);

      // Color shifts: Blue-orange idle -> Intense Cyan/Violet afterburner
      if (throttle > 0.8) {
        jetThrusterMat.color.setHex(Math.random() > 0.5 ? 0x00e1ff : 0x7755ff);
      } else {
        jetThrusterMat.color.setHex(0x3399ff);
      }
    } else {
      jetThrusterMat.opacity = 0;
    }
  }

  // 4. Strobe Navigation Lights
  strobeTimer += 0.04;
  if (strobeLight) {
    const flash = Math.sin(strobeTimer * 6.0) > 0.94 ? 4.0 : 0.0;
    strobeLight.intensity = flash;
  }

  // Taxi light: brighter at night
  if (taxiLight) {
    const isNight = skyMesh ? skyMesh.material.uniforms.nightPhase.value > 0.2 : false;
    taxiLight.intensity = (Physics.grounded || heightAgl < 25) ? (isNight ? 5.0 : 1.5) : (isNight ? 2.5 : 0.5);
  }
}

// ============================================================
// HIGH-TECH AERODROME / LANDING PLATFORM
// ============================================================
function buildAirfield(x, z, yElevation, stationName, stationId) {
  const station = {
    id: stationId,
    name: stationName,
    x: x,
    y: yElevation,
    z: z,
    width: 140,
    length: 460
  };
  globalStations.push(station);

  const baseGroup = new THREE.Group();
  baseGroup.position.set(x, 0, z);

  // Materials
  const tarmacMat = new THREE.MeshStandardMaterial({ color: 0x181d24, roughness: 0.85, metalness: 0.3 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x2b333e, roughness: 0.7, metalness: 0.4 });
  const markingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
  const yellowMarkMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });
  const greenLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });
  const redLightMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
  const whiteLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });

  // 1. Massive Elevated Runway Platform Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(140, 6, 460), tarmacMat);
  deck.position.set(0, yElevation - 3, 0);
  deck.receiveShadow = true;
  deck.castShadow = true;
  baseGroup.add(deck);

  // Concrete perimeter bevel
  const perimeter = new THREE.Mesh(new THREE.BoxGeometry(146, 7, 466), concreteMat);
  perimeter.position.set(0, yElevation - 3.8, 0);
  perimeter.receiveShadow = true;
  baseGroup.add(perimeter);

  // Heavy Support Pillars extending into terrain
  const pillarGeo = new THREE.CylinderGeometry(5.5, 5.5, 350, 16);
  const pillarY = yElevation - 3 - 175;
  [[-55, -190], [55, -190], [-55, 0], [55, 0], [-55, 190], [55, 190]].forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeo, concreteMat);
    pillar.position.set(pos[0], pillarY, pos[1]);
    pillar.castShadow = true;
    baseGroup.add(pillar);
  });

  // 2. Runway Markings
  // Centerline Dashed Stripes
  for (let lz = -180; lz <= 180; lz += 28) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 14), markingMat);
    stripe.position.set(0, yElevation + 0.1, lz);
    baseGroup.add(stripe);
  }

  // Threshold Piano Keys (Zebra stripes at both ends)
  [-195, 195].forEach(endZ => {
    for (let lx = -40; lx <= 40; lx += 10) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 20), markingMat);
      bar.position.set(lx, yElevation + 0.1, endZ);
      baseGroup.add(bar);
    }
  });

  // Touchdown Zone Double Markers
  [-140, -90, 90, 140].forEach(tdz => {
    const leftTDZ = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 3.5), markingMat);
    leftTDZ.position.set(-20, yElevation + 0.1, tdz);
    baseGroup.add(leftTDZ);
    const rightTDZ = new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 3.5), markingMat);
    rightTDZ.position.set(20, yElevation + 0.1, tdz);
    baseGroup.add(rightTDZ);
  });

  // Side Runway White Edge Boundary Lines
  [-52, 52].forEach(sideX => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 440), markingMat);
    line.position.set(sideX, yElevation + 0.1, 0);
    baseGroup.add(line);
  });

  // 3. Illuminated Runway Lighting System
  // Runway Edge Lights
  for (let lz = -210; lz <= 210; lz += 25) {
    [-54, 54].forEach(sideX => {
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.4), whiteLightMat);
      fixture.position.set(sideX, yElevation + 0.4, lz);
      baseGroup.add(fixture);
    });
  }

  // Green Threshold End Lights & Red Overrun Lights
  for (let lx = -50; lx <= 50; lx += 8) {
    const greenLite = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), greenLightMat);
    greenLite.position.set(lx, yElevation + 0.4, 215);
    baseGroup.add(greenLite);

    const redLite = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.5), redLightMat);
    redLite.position.set(lx, yElevation + 0.4, -215);
    baseGroup.add(redLite);
  }

  // 4. Approach Light System (ALS) with Animated Sequenced Flashing Strobes ("The Rabbit")
  const approachGroup = new THREE.Group();
  for (let i = 1; i <= 8; i++) {
    const distZ = 215 + i * 40;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(24, 1.0, 1.0), amberLightMat);
    bar.position.set(0, yElevation, distZ);
    approachGroup.add(bar);

    const rabbitStrobe = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    rabbitStrobe.position.set(0, yElevation + 1.5, distZ);
    rabbitStrobe.userData = { flashIndex: i };
    approachGroup.add(rabbitStrobe);
    animatedApproachLights.push(rabbitStrobe);
  }
  baseGroup.add(approachGroup);

  // 5. PAPI Glide Slope Lights (4-unit box next to touchdown zone)
  for (let p = 0; p < 4; p++) {
    const papiBox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 1.8), whiteLightMat);
    papiBox.position.set(-62 - p * 3, yElevation + 1.0, 100);
    papiBox.userData = { isPapi: true, index: p };
    baseGroup.add(papiBox);
  }

  // 6. Air Traffic Control Tower & Rotating Surveillance Radar
  const towerGroup = new THREE.Group();
  towerGroup.position.set(78, yElevation, -60);

  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 48, 16), concreteMat);
  towerBase.position.y = 24;
  towerGroup.add(towerBase);

  // Glass Observation Cab
  const cab = new THREE.Mesh(
    new THREE.CylinderGeometry(14, 11, 10, 16),
    new THREE.MeshStandardMaterial({ color: 0x051d2f, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.85 })
  );
  cab.position.y = 52;
  towerGroup.add(cab);

  // Tower Roof
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(15, 14, 3, 16), concreteMat);
  roof.position.y = 58;
  towerGroup.add(roof);

  // Red Aviation Hazard Beacon
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), redLightMat);
  beacon.position.y = 61;
  towerGroup.add(beacon);

  // Spinning Radar Dish
  const radarGroup = new THREE.Group();
  radarGroup.position.y = 63;
  const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4, 8), concreteMat);
  radarGroup.add(radarMast);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.4, 16, 1, false, 0, Math.PI), yellowMarkMat);
  dish.rotation.x = Math.PI / 2;
  dish.position.set(0, 3, 0);
  radarGroup.add(dish);
  towerGroup.add(radarGroup);
  rotatingRadars.push(radarGroup);

  baseGroup.add(towerGroup);

  // 7. Aircraft Hangars
  [-110, 110].forEach(hz => {
    const hangar = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 50, 16, 1, false, 0, Math.PI),
      concreteMat
    );
    hangar.rotation.z = Math.PI / 2;
    hangar.rotation.y = Math.PI / 2;
    hangar.position.set(85, yElevation + 10, hz);
    hangar.castShadow = true;
    baseGroup.add(hangar);
  });

  // 8. Helipad Deck
  const helipad = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 1, 32), concreteMat);
  helipad.position.set(-82, yElevation - 0.5, -40);
  baseGroup.add(helipad);
  const heliRing = new THREE.Mesh(new THREE.RingGeometry(16, 18, 32), yellowMarkMat);
  heliRing.rotation.x = -Math.PI / 2;
  heliRing.position.set(-82, yElevation + 0.1, -40);
  baseGroup.add(heliRing);

  // 'H' marking
  const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 16), markingMat);
  hBar1.position.set(-87, yElevation + 0.15, -40);
  baseGroup.add(hBar1);
  const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 16), markingMat);
  hBar2.position.set(-77, yElevation + 0.15, -40);
  baseGroup.add(hBar2);
  const hBar3 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 2), markingMat);
  hBar3.position.set(-82, yElevation + 0.15, -40);
  baseGroup.add(hBar3);

  scene.add(baseGroup);
}

// ============================================================
// RING CHALLENGE COURSE SYSTEM
// ============================================================
function buildRingChallengeCourse() {
  // Clear any existing rings
  challengeRings.forEach(r => scene.remove(r.group));
  challengeRings = [];
  activeRingIndex = 0;

  // Flight path waypoints starting right off Base Alpha runway heading North towards Destination Base
  const ringWaypoints = [
    { x: 0,     y: 90,   z: -350,   radius: 28, label: "CLIMBOUT" },
    { x: -180,  y: 160,  z: -850,   radius: 28, label: "VALLEY ENTRY" },
    { x: -380,  y: 240,  z: -1450,  radius: 28, label: "MOUNTAIN PASS" },
    { x: -220,  y: 310,  z: -2100,  radius: 30, label: "CANYON BANK" },
    { x: 120,   y: 360,  z: -2750,  radius: 30, label: "HIGH APEX" },
    { x: 340,   y: 290,  z: -3400,  radius: 28, label: "DESCENT TURN" },
    { x: 160,   y: 220,  z: -3950,  radius: 26, label: "BASE LEG" },
    { x: 0,     y: 175,  z: -4350,  radius: 24, label: "ILS INTERCEPT" },
    { x: 0,     y: 145,  z: -4580,  radius: 22, label: "SHORT FINAL" },
    { x: 0,     y: 128,  z: -4750,  radius: 20, label: "RUNWAY THRESHOLD" }
  ];

  totalRingsCount = ringWaypoints.length;

  ringWaypoints.forEach((wp, idx) => {
    const ringGroup = new THREE.Group();
    ringGroup.position.set(wp.x, wp.y, wp.z);

    // Orient ring along course vector towards next point
    const nextWP = ringWaypoints[idx + 1] || { x: wp.x, y: wp.y, z: wp.z - 400 };
    const dir = new THREE.Vector3(nextWP.x - wp.x, nextWP.y - wp.y, nextWP.z - wp.z).normalize();
    ringGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);

    // Outer Neon Ring Torus
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x00d8ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8
    });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(wp.radius, 1.2, 16, 32), torusMat);
    ringGroup.add(torus);

    // Inner Glowing Energy Ribbon
    const innerRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x7ffff0,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    const innerRibbon = new THREE.Mesh(new THREE.RingGeometry(wp.radius - 1.2, wp.radius, 32), innerRibbonMat);
    ringGroup.add(innerRibbon);

    // Tactical Rotating Brackets / Chevrons
    const bracketGroup = new THREE.Group();
    for (let b = 0; b < 4; b++) {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(4.0, 1.2, 1.4),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      const angle = (b * Math.PI) / 2;
      bracket.position.set(Math.cos(angle) * (wp.radius + 1.2), Math.sin(angle) * (wp.radius + 1.2), 0);
      bracketGroup.add(bracket);
    }
    ringGroup.add(bracketGroup);

    // Vertical Sky Pillar Beam (Makes active rings visible from miles away!)
    const beamGeo = new THREE.CylinderGeometry(1.8, 1.8, 3000, 16);
    beamGeo.translate(0, 1500, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: idx === 0 ? 0.35 : 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 0, 0);
    ringGroup.add(beam);

    scene.add(ringGroup);

    challengeRings.push({
      index: idx,
      group: ringGroup,
      torus: torus,
      torusMat: torusMat,
      innerRibbonMat: innerRibbonMat,
      beamMat: beamMat,
      bracketGroup: bracketGroup,
      pos: wp,
      radius: wp.radius,
      label: wp.label,
      cleared: false
    });
  });

  updateRingVisualStyles();
}

function updateRingVisualStyles() {
  challengeRings.forEach((r, idx) => {
    if (r.cleared) {
      // Completed rings glow golden green
      r.torusMat.color.setHex(0x00ff88);
      r.torusMat.emissive.setHex(0x00aa44);
      r.innerRibbonMat.color.setHex(0x88ffaa);
      r.innerRibbonMat.opacity = 0.3;
      r.beamMat.opacity = 0.02;
    } else if (idx === activeRingIndex) {
      // Active target ring glows bright amber/cyan with high pulse
      r.torusMat.color.setHex(0xffaa00);
      r.torusMat.emissive.setHex(0xff7700);
      r.torusMat.emissiveIntensity = 1.4;
      r.innerRibbonMat.color.setHex(0xffdd44);
      r.innerRibbonMat.opacity = 0.85;
      r.beamMat.color.setHex(0xffbb00);
      r.beamMat.opacity = 0.45;
    } else {
      // Distant upcoming rings stay soft cyan
      r.torusMat.color.setHex(0x0088cc);
      r.torusMat.emissive.setHex(0x004488);
      r.torusMat.emissiveIntensity = 0.5;
      r.innerRibbonMat.color.setHex(0x00c8ff);
      r.innerRibbonMat.opacity = 0.35;
      r.beamMat.color.setHex(0x00c8ff);
      r.beamMat.opacity = 0.06;
    }
  });
}

// Check if aircraft passes through current active ring
function checkRingPass(planePos) {
  if (activeRingIndex >= challengeRings.length) return null;

  const ring = challengeRings[activeRingIndex];
  const dx = planePos.x - ring.pos.x;
  const dy = planePos.y - ring.pos.y;
  const dz = planePos.z - ring.pos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Check if inside ring aperture cylinder
  if (dist < ring.radius * 1.35) {
    ring.cleared = true;
    activeRingIndex++;
    updateRingVisualStyles();
    
    // Trigger visual celebration flash on ring
    ring.group.scale.set(1.4, 1.4, 1.4);
    setTimeout(() => {
      ring.group.scale.set(1.0, 1.0, 1.0);
    }, 250);

    return {
      ringIndex: ring.index,
      clearedCount: activeRingIndex,
      totalCount: challengeRings.length,
      label: ring.label,
      isFinal: activeRingIndex >= challengeRings.length
    };
  }
  return null;
}

// ============================================================
// TERRAIN & PROCEDURAL GENERATION
// ============================================================
function terrainHeight(x, z) {
  const h1 = Math.sin(x * 0.003) * Math.cos(z * 0.003) * 75;
  const h2 = Math.sin(x * 0.014) * Math.cos(z * 0.01) * 20;
  const h3 = Math.sin(x * 0.035) * Math.cos(z * 0.028) * 6;
  return h1 + h2 + h3 - 35;
}

let treeGeo, treeMat;
function initTerrain() {
  treeGeo = new THREE.ConeGeometry(10, 32, 5);
  treeGeo.translate(0, 16, 0);
  treeMat = new THREE.MeshStandardMaterial({ color: 0x193816, roughness: 0.9, flatShading: true });

  for (let cx = -RENDER_DIST; cx <= RENDER_DIST; cx++) {
    for (let cz = -RENDER_DIST; cz <= RENDER_DIST; cz++) terrainChunks.push(makeTerrainChunk(cx, cz));
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

  const mat = new THREE.MeshStandardMaterial({ color: 0x24391e, roughness: 0.95, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);
  mesh.receiveShadow = true;
  mesh.userData.cx = cx; mesh.userData.cz = cz;
  scene.add(mesh);

  if (typeof treeGeo !== 'undefined') {
    const treeCount = 75;
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

      // Only place trees above water and not directly on runways
      if (ty > -25 && !(Math.abs(wX) < 120 && Math.abs(wZ) < 300) && !(Math.abs(wX) < 120 && Math.abs(wZ + 4800) < 300)) {
        dummy.position.set(wX, ty, wZ);
        dummy.scale.setScalar(0.4 + Math.random() * 1.1);
        dummy.rotation.y = Math.random() * Math.PI;
        dummy.updateMatrix();
        trees.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        trees.setMatrixAt(i, dummy.matrix);
      }
    }
    scene.add(trees);
    mesh.userData.trees = trees;
  }

  return mesh;
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
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.82,
    roughness: 1.0,
    flatShading: true
  });

  for (let i = 0; i < 80; i++) {
    const group = new THREE.Group();
    const puffs = 5 + Math.floor(Math.random() * 5);
    for (let p = 0; p < puffs; p++) {
      const r = 35 + Math.random() * 45;
      const geo = new THREE.IcosahedronGeometry(r, 1);
      const puff = new THREE.Mesh(geo, cloudMat);
      puff.position.set((Math.random() - 0.5) * 140, (Math.random() - 0.5) * 35, (Math.random() - 0.5) * 140);
      puff.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(puff);
    }
    group.position.set((Math.random() - 0.5) * 5000, 800 + Math.random() * 1200, (Math.random() - 0.5) * 6000);
    scene.add(group);
    clouds.push(group);
  }
}

function recycleClouds(px, py, pz) {
  clouds.forEach(c => {
    const dx = c.position.x - px, dy = c.position.y - py, dz = c.position.z - pz;
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 3000) {
      c.position.x = px + (Math.random() - 0.5) * 5000;
      c.position.y = Math.max(780, py + (Math.random() - 0.5) * 1600);
      c.position.z = pz + (Math.random() - 0.5) * 5000;
    }
  });
}

// ============================================================
// TIME OF DAY & ENVIRONMENT (DAY / SUNSET / NIGHT CONTROL)
// ============================================================
function setTimeOfDay(val) {
  timeOfDay = ((val % 1.0) + 1.0) % 1.0;
  updateEnvironmentVisuals();
}

function setDayNightPreset(preset) {
  switch (preset) {
    case 'day':    setTimeOfDay(0.50); break; // 12:00 PM Crisp Day
    case 'sunset': setTimeOfDay(0.78); break; // 06:45 PM Dramatic Sunset
    case 'night':  setTimeOfDay(0.00); break; // 00:00 AM Midnight Aurora
    case 'dawn':   setTimeOfDay(0.25); break; // 06:00 AM Sunrise
  }
}

let rabbitStep = 0;
let radarRot = 0;

function updateEnvironment(px, py, pz, dt) {
  if (isAutoTimeCycle && dt) {
    timeOfDay = (timeOfDay + dt / 300.0) % 1.0; // 5 minute full cycle
  }
  updateEnvironmentVisuals(px, py, pz, dt);

  // Rotate ATC surveillance radars
  radarRot += dt * 2.5;
  rotatingRadars.forEach(r => { r.rotation.y = radarRot; });

  // Rotate ring bracket chevrons
  challengeRings.forEach(r => {
    if (r.bracketGroup) r.bracketGroup.rotation.z += dt * 0.8;
  });

  // Animated Approach Strobe Lights ("The Rabbit" traveling towards runway)
  rabbitStep = (rabbitStep + dt * 10) % 8;
  const currentFlash = Math.floor(rabbitStep) + 1;
  animatedApproachLights.forEach(light => {
    light.visible = (light.userData.flashIndex === currentFlash);
  });
}

function updateEnvironmentVisuals(px = 0, py = 0, pz = 0, dt = 0.016) {
  const angle = timeOfDay * Math.PI * 2;
  const sunY = Math.sin(angle) * 2200;
  const sunZ = Math.cos(angle) * 2200;
  const sunX = 1100;

  if (sunLight) {
    sunLight.position.set(px + sunX, py + sunY, pz + sunZ);
    sunLight.target.position.set(px, py, pz);
    sunLight.target.updateMatrixWorld();
    if (sunMesh) sunMesh.position.copy(sunLight.position);
    if (glowMesh) glowMesh.position.copy(sunLight.position);
    sunLight.intensity = Math.max(0, Math.sin(angle)) * 3.2;
    sunMesh.visible = sunY > -100;
    glowMesh.visible = sunY > -100;
  }

  if (moonLight) {
    moonLight.position.set(px - sunX, py - sunY, pz - sunZ);
    moonLight.target.position.set(px, py, pz);
    moonLight.target.updateMatrixWorld();
    if (moonMesh) moonMesh.position.copy(moonLight.position);
    moonLight.intensity = Math.max(0, -Math.sin(angle)) * 0.9;
    moonMesh.visible = sunY < 100;
  }

  if (skyMesh) {
    skyMesh.position.set(px, py, pz);

    let topCol, botCol, fogCol;
    if (sunY > 600) {
      // Full Day
      topCol = new THREE.Color(0x134e8d);
      botCol = new THREE.Color(0x9bd0f5);
      fogCol = botCol;
    } else if (sunY > 0) {
      // Golden Sunset / Sunrise
      const t = sunY / 600;
      topCol = new THREE.Color(0x1a0b2e).lerp(new THREE.Color(0x134e8d), t);
      botCol = new THREE.Color(0xff6b4a).lerp(new THREE.Color(0x9bd0f5), t);
      fogCol = botCol;
    } else if (sunY > -600) {
      // Dusk into Deep Night
      const t = (sunY + 600) / 600;
      topCol = new THREE.Color(0x020111).lerp(new THREE.Color(0x1a0b2e), t);
      botCol = new THREE.Color(0x0a0c20).lerp(new THREE.Color(0xff6b4a), t);
      fogCol = botCol;
    } else {
      // Deep Night
      topCol = new THREE.Color(0x020111);
      botCol = new THREE.Color(0x050716);
      fogCol = botCol;
    }

    skyMesh.material.uniforms.topColor.value.copy(topCol);
    skyMesh.material.uniforms.bottomColor.value.copy(botCol);
    scene.fog.color.copy(fogCol);

    const nightFraction = Math.max(0, -Math.sin(angle));
    skyMesh.material.uniforms.nightPhase.value = nightFraction;
    skyMesh.material.uniforms.time.value += dt;

    if (ambientLight) {
      ambientLight.intensity = sunY > 0 ? 0.3 + (sunY / 2200) * 0.35 : 0.08;
    }
  }

  if (starMesh) {
    starMesh.position.set(px, py, pz);
    starMesh.material.opacity = Math.max(0, -Math.sin(angle));
  }
}