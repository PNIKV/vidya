// ============================================================
// VECTOR-1 FLIGHT SIM — Physics Model
// ============================================================

const Physics = {
  position: { x: 0, y: 52, z: 80 }, // Start at the back of the runway
  velocity: { x: 0, y: 0, z: 0 },       
  rotation: { pitch: 0, yaw: 0, roll: 0 }, 

  speed: 0,            
  throttle: 0,        
  altitude: 52,
  vsi: 0,                
  gForce: 1.0,

  crashed: false,
  grounded: true,
  currentStation: null,

  // Aerodynamics Constants
  MAX_THRUST: 0.18,
  DRAG_COEF: 0.85,
  LIFT_COEF: 0.019,
  STALL_SPEED: 35,
  GRAVITY: 0.018,
  PITCH_RATE: 1.6,   
  ROLL_RATE: 3.0,
  YAW_RATE: 0.9,
  MAX_SPEED: 450,

  reset(){
    const startY = (typeof globalStations !== 'undefined' && globalStations.length > 0) ? (globalStations[0].y + 2) : 52;
    const startZ = (typeof globalStations !== 'undefined' && globalStations.length > 0) ? (globalStations[0].z + 100) : 80;
    const startX = (typeof globalStations !== 'undefined' && globalStations.length > 0) ? globalStations[0].x : 0;
    
    this.position = { x: startX, y: startY, z: startZ };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { pitch: 0, yaw: 0, roll: 0 };
    this.speed = 0;
    this.throttle = 0;
    this.crashed = false;
    this.grounded = true;
    this.currentStation = (typeof globalStations !== 'undefined' && globalStations.length > 0) ? globalStations[0] : null;
  },

  update(dt, inputs){
    if(this.crashed) return;
    dt = Math.min(dt, 0.05); 

    this.throttle = clamp(inputs.throttle, 0, 1);
    const stallFactor = this.speed < this.STALL_SPEED ? 0.3 : 1.0; 

    // Aircraft attitude control
    const targetPitch = inputs.pitch * 1.3; 
    const pitchEaseRate = 2.4 * stallFactor;
    this.rotation.pitch += (targetPitch - this.rotation.pitch) * Math.min(1, pitchEaseRate * dt);
    this.rotation.roll  += inputs.roll  * this.ROLL_RATE  * stallFactor * dt;
    this.rotation.yaw   += inputs.yaw   * this.YAW_RATE * dt;

    this.rotation.roll = wrapAngle(this.rotation.roll);
    if(Math.abs(inputs.roll) < 0.04 && Math.abs(this.rotation.roll) > 0.001){
      this.rotation.roll *= Math.max(0, 1 - 2.2*dt);
      if(Math.abs(this.rotation.roll) < 0.01) this.rotation.roll = 0;
    }
    this.rotation.pitch = wrapAngle(this.rotation.pitch);

    // Forward direction 
    const cp = Math.cos(this.rotation.pitch), sp = Math.sin(this.rotation.pitch);
    const cy = Math.cos(this.rotation.yaw),   sy = Math.sin(this.rotation.yaw);
    const forward = { x: -sy * cp, y: sp, z: -cy * cp };

    // Throttle & Aerodynamic Forces
    const activeThrottle = this.throttle < 0.03 ? 0 : this.throttle;
    const thrust = activeThrottle * this.MAX_THRUST;
    const drag = this.DRAG_COEF * this.speed;
    const climbPenalty = forward.y * this.speed * 0.95;
    this.speed += (thrust * 2400 - drag - climbPenalty) * dt;
    this.speed = clamp(this.speed, 0, this.MAX_SPEED);

    // Wheel Brakes: Smoothly stop if throttle is zero and wheels on deck
    if (this.grounded && activeThrottle === 0) {
       this.speed *= (1 - 3.5 * dt);
       if (this.speed < 0.5) this.speed = 0;
       
       this.velocity.x *= (1 - 5.0 * dt);
       this.velocity.z *= (1 - 5.0 * dt);
       if (Math.abs(this.velocity.x) < 0.02) this.velocity.x = 0;
       if (Math.abs(this.velocity.z) < 0.02) this.velocity.z = 0;
    }

    // Ground Effect & Runway / Platform Collision
    let groundY = (typeof terrainHeight === 'function') ? terrainHeight(this.position.x, this.position.z) + 2 : 2;
    
    let onPad = false;
    let detectedStation = null;
    if (typeof globalStations !== 'undefined') {
       for(const st of globalStations) {
          const halfW = (st.width || 120) * 0.55;
          const halfL = (st.length || 380) * 0.55;
          const dx = Math.abs(this.position.x - st.x);
          const dz = Math.abs(this.position.z - st.z);
          if(dx <= halfW && dz <= halfL){
             groundY = Math.max(groundY, st.y + 2); // Pad height is st.y, +2 for landing gear
             onPad = true;
             detectedStation = st;
             break;
          }
       }
    }
    this.currentStation = detectedStation;

    const heightAgl = Math.max(0, this.position.y - groundY);
    const groundEffect = heightAgl < 12 ? (12 - heightAgl) * 0.006 : 0;

    let lift = (this.LIFT_COEF * this.speed * this.speed / 100) + groundEffect;
    
    // Cap lift to prevent floating into deep space
    const maxLift = this.GRAVITY * 100 * 1.5; 
    lift = clamp(lift, 0, maxLift);

    const stalling = this.speed < this.STALL_SPEED;
    const effectiveLift = stalling ? lift * (this.speed / this.STALL_SPEED) * 0.4 : lift;

    // Banking splits lift into Vertical and Horizontal components
    const liftUp = effectiveLift * Math.cos(this.rotation.roll);
    const liftSide = effectiveLift * Math.sin(this.rotation.roll);

    // Coordinated turning yaw
    if (!this.grounded && !stalling) {
       this.rotation.yaw += liftSide * 0.005 * dt; 
    }

    const targetVel = {
      x: forward.x * this.speed,
      y: forward.y * this.speed + (liftUp - this.GRAVITY*100) * 1.0,
      z: forward.z * this.speed
    };

    const smoothing = stalling ? 1.5 : 3.5;
    this.velocity.x += (targetVel.x*0.013 - this.velocity.x) * smoothing * dt;
    this.velocity.y += (targetVel.y*0.013 - this.velocity.y) * smoothing * dt;
    this.velocity.z += (targetVel.z*0.013 - this.velocity.z) * smoothing * dt;

    if(stalling) this.velocity.y -= this.GRAVITY * (1 - this.speed/this.STALL_SPEED) * 3.0 * dt * 60;

    this.position.x += this.velocity.x * dt * 60;
    this.position.y += this.velocity.y * dt * 60;
    this.position.z += this.velocity.z * dt * 60;

    this.altitude = this.position.y;
    this.vsi = this.velocity.y * 60 * 10; 

    // G-Force (Inertia + Banking load)
    const targetG = 1.0 + Math.abs(inputs.pitch) * 2.0 + Math.abs(this.rotation.roll) * 0.5;
    this.gForce += (targetG - this.gForce) * 5 * dt;

    const wasGrounded = this.grounded;

    if(this.position.y <= groundY){
      const impactSpeed = Math.abs(this.velocity.y) * 60;
      this.position.y = groundY;

      // Safe landing criteria on pad vs rough terrain
      const maxSafeImpact = onPad ? 18 : 12;
      const maxSafeRoll = onPad ? 1.1 : 0.8;
      const minSafeSpeed = this.STALL_SPEED * 0.5;

      if(!this.grounded && (impactSpeed > maxSafeImpact || Math.abs(this.rotation.roll) > maxSafeRoll || (this.speed < minSafeSpeed && !onPad))){
        this.crashed = true;
      } else {
        this.velocity.y = 0;
        this.grounded = true;
        // Auto-level roll and pitch when grounded
        this.rotation.roll *= 0.85;
        this.rotation.pitch *= 0.85;

        // Trigger touchdown event
        if (!wasGrounded && typeof onTouchdownEvent === 'function') {
          onTouchdownEvent({
            impactSpeed: impactSpeed,
            onPad: onPad,
            station: detectedStation,
            speed: this.speed,
            vsi: this.vsi
          });
        }
      }
    } else {
      this.grounded = false;
    }
  }
};

function wrapAngle(a){
  a = a % (Math.PI*2);
  if(a > Math.PI) a -= Math.PI*2;
  if(a < -Math.PI) a += Math.PI*2;
  return a;
}

function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }