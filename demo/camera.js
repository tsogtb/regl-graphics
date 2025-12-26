import { mat4, vec3, quat } from "https://esm.sh/gl-matrix"

const keys = new Set()
window.addEventListener("keydown", (e) => keys.add(e.code))
window.addEventListener("keyup", (e) => keys.delete(e.code))

export class Camera {
  constructor(canvas) {
    this.canvas = canvas

    this.projection = mat4.create()
    this.view = mat4.create()

    this.position = vec3.fromValues(3, 0, 20)

    const lookAtMatrix = mat4.create();
    const origin = vec3.fromValues(0, 0, 0);
    const worldUp = vec3.fromValues(0, 1, 0);

    mat4.lookAt(lookAtMatrix, this.position, origin, worldUp);

    this.orientation = quat.create();
    mat4.getRotation(this.orientation, lookAtMatrix);

    quat.invert(this.orientation, this.orientation);

    this.speed = 30.0
    this.mouseSensitivity = 0.002
    this.rollSpeed = 1.5

    this._initialPosition = vec3.clone(this.position)
    this._initialOrientation = quat.clone(this.orientation)

    this.isReturning = false;
    this.returnSpeed = 5.0;

    this._initMouse()
    this.updateProjection()
    this.updateView()
    window.addEventListener("resize", () => this.updateProjection())

    this.overlay = document.getElementById("camera-overlay")
    this.uiColors = {
      x: "rgb(217, 51, 77)",
      y: "rgb(26, 204, 128)",
      z: "rgb(51, 153, 255)"
    }
  }

  reset() {
    vec3.copy(this.position, this._initialPosition)
    quat.copy(this.orientation, this._initialOrientation)
    this.updateOverlay()
    this.updateView()
  }

  _initMouse() {
    this.canvas.addEventListener("click", () => this.canvas.requestPointerLock())

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.canvas) return

      const right = vec3.fromValues(1, 0, 0)
      const up = vec3.fromValues(0, 1, 0)
      vec3.transformQuat(right, right, this.orientation)
      vec3.transformQuat(up, up, this.orientation)

      const yawQuat = quat.create()
      const pitchQuat = quat.create()

      quat.setAxisAngle(yawQuat, up, -e.movementX * this.mouseSensitivity)
      quat.setAxisAngle(pitchQuat, right, -e.movementY * this.mouseSensitivity)

      quat.multiply(this.orientation, yawQuat, this.orientation)
      quat.multiply(this.orientation, pitchQuat, this.orientation)
      quat.normalize(this.orientation, this.orientation)
    })
  }

  updateProjection() {
    const aspect = this.canvas.width / this.canvas.height
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.01, 1000.0)
  }

  updateView() {
    const forward = vec3.fromValues(0, 0, -1)
    const up = vec3.fromValues(0, 1, 0)
    vec3.transformQuat(forward, forward, this.orientation)
    vec3.transformQuat(up, up, this.orientation)

    const target = vec3.create()
    vec3.add(target, this.position, forward)
    mat4.lookAt(this.view, this.position, target, up)
  }

  update(dt) {

    if (keys.has("KeyO")) {
      this.isReturning = true;
    }
  
    if (this.isReturning) {
      vec3.lerp(this.position, this.position, this._initialPosition, this.returnSpeed * dt);
      quat.slerp(this.orientation, this.orientation, this._initialOrientation, this.returnSpeed * dt);
      const dist = vec3.distance(this.position, this._initialPosition);
      if (dist < 0.01) {
        vec3.copy(this.position, this._initialPosition);
        quat.copy(this.orientation, this._initialOrientation);
        this.isReturning = false;
      }
    }

    if (keys.has("KeyW") || keys.has("KeyS") || keys.has("KeyA") || keys.has("KeyD") || keys.has("Space") || keys.has("ShiftLeft") || keys.has("ShiftRight")) {
      this.isReturning = false;
    }

    const forward = vec3.fromValues(0, 0, -1)
    const right = vec3.fromValues(1, 0, 0)
    const up = vec3.fromValues(0, 1, 0)

    vec3.transformQuat(forward, forward, this.orientation)
    vec3.transformQuat(right, right, this.orientation)
    vec3.transformQuat(up, up, this.orientation)

    const moveDir = vec3.create()
    if (keys.has("KeyW")) vec3.add(moveDir, moveDir, forward)
    if (keys.has("KeyS")) vec3.sub(moveDir, moveDir, forward)
    if (keys.has("KeyD")) vec3.add(moveDir, moveDir, right)
    if (keys.has("KeyA")) vec3.sub(moveDir, moveDir, right)
    if (keys.has("Space")) vec3.add(moveDir, moveDir, up)
    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) vec3.sub(moveDir, moveDir, up)

    if (vec3.length(moveDir) > 0) {
      vec3.normalize(moveDir, moveDir)
      vec3.scaleAndAdd(this.position, this.position, moveDir, this.speed * dt)
    }

    if (keys.has("KeyQ") || keys.has("KeyE")) {
      const rollQuat = quat.create()
      const angle = (keys.has("KeyE") ? this.rollSpeed : -this.rollSpeed) * dt

      quat.setAxisAngle(rollQuat, forward, angle)
      quat.multiply(this.orientation, rollQuat, this.orientation)
      quat.normalize(this.orientation, this.orientation)
    }
    // === Horizon Recovery (R Key) ===
    if (keys.has("KeyR")) {
      const forward = vec3.fromValues(0, 0, -1);
      vec3.transformQuat(forward, forward, this.orientation);

      const levelViewMatrix = mat4.create();
      const worldUp = vec3.fromValues(0, 1, 0);
      const target = vec3.add(vec3.create(), this.position, forward);
      
      mat4.lookAt(levelViewMatrix, this.position, target, worldUp);
      
      const levelQuat = quat.create();
      mat4.getRotation(levelQuat, levelViewMatrix);
      quat.invert(levelQuat, levelQuat); 

      quat.slerp(this.orientation, this.orientation, levelQuat, 5.0 * dt);
      quat.normalize(this.orientation, this.orientation);
    }

    this.updateView()
    this.updateOverlay()
  }

  updateOverlay() {
    if (!this.overlay) return;
  
    const [x, y, z] = Array.from(this.position).map(v => v.toFixed(2));
  
    const forward = vec3.fromValues(0, 0, -1);
    const up = vec3.fromValues(0, 1, 0);
    const right = vec3.fromValues(1, 0, 0);
  
    vec3.transformQuat(forward, forward, this.orientation);
    vec3.transformQuat(up, up, this.orientation);
    vec3.transformQuat(right, right, this.orientation);
  
    const pitchRad = Math.asin(Math.max(-1, Math.min(1, forward[1])));
    
    const yawRad = Math.atan2(forward[0], -forward[2]);
  
    const worldUp = vec3.fromValues(0, 1, 0);
    const projUp = vec3.create();
    const dot = vec3.dot(worldUp, forward);
    vec3.scaleAndAdd(projUp, worldUp, forward, -dot);
    vec3.normalize(projUp, projUp);
  
    let rollRad = Math.acos(Math.max(-1, Math.min(1, vec3.dot(projUp, up))));
    const cross = vec3.create();
    vec3.cross(cross, projUp, up);
    if (vec3.dot(forward, cross) < 0) rollRad = -rollRad;
  
    const yawDeg = (yawRad * 180 / Math.PI).toFixed(0);
    const pitchDeg = (pitchRad * 180 / Math.PI).toFixed(0);
    const rollDeg = (rollRad * 180 / Math.PI).toFixed(0);
  
    const horizonRotate = -rollDeg;
  
    this.overlay.innerHTML = `
      <div style="monospace; background: rgba(15, 15, 20, 0.85); padding: 20px; border-radius: 8px; color: white; width: 220px; border: 1px solid #444; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color:${this.uiColors.x}">X: ${x}</span>
          <span style="color:${this.uiColors.y}">Y: ${y}</span>
          <span style="color:${this.uiColors.z}">Z: ${z}</span>
        </div>
        
        <div style="font-size: 0.8em; margin-bottom: 5px; border-bottom: 1px solid #333; pt: 10px;">
          YAW: ${yawDeg}° | PITCH: ${pitchDeg}° | ROLL: ${horizonRotate}°
        </div>

        <div style="font-size: 0.75em; color: #aaa; line-height: 1.6;">
          <div style="display: grid; grid-template-columns: 1fr 1fr;">
            <span>[W/S] • FWD/BACK</span> <span>[Q/E] • ROLL</span>
            <span>[A/D] • STRAFE</span> <span>[SPC/SHIFT] • UP/DWN</span>
            <span>[R] • RECOVER HZN</span> <span>[MOUSE] • PITCH/YAW</span>
            <span>[O] • RETURN CTR</span>
          </div>
        </div>
      </div>
    `;
  }
  
}
