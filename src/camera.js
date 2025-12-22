/**
 * point_data.js
 *
 * Firt-person / free-look camera
 */
import { mat4, vec3 } from "https://esm.sh/gl-matrix"

const keys = new Set()

window.addEventListener("keydown", (e) => keys.add(e.code))
window.addEventListener("keyup", (e) => keys.delete(e.code))

export class Camera {
  constructor(canvas) {
    this.canvas = canvas

    this.projection = mat4.create()
    this.view = mat4.create()

    this.position = vec3.fromValues(0, 0, 0)
    this.up = vec3.fromValues(0, 1, 0)
    this.front = vec3.fromValues(0, 0, -1)
    this.right = vec3.fromValues(1, 0, 0)

    this.yaw = -Math.PI / 2
    this.pitch = 0;

    this.speed = 10.0
    this.mouseSensitivity = 0.002

    this._initialPosition = vec3.clone(this.position)
    this._initialYaw = this.yaw
    this._initialPitch = this.pitch

    this._initMouse()
    this.updateProjection()
    window.addEventListener("resize", () => this.updateProjection())
  }

  reset() {
    vec3.copy(this.position, this._initialPosition)
  
    this.yaw = this._initialYaw
    this.pitch = this._initialPitch
  
    this.updateView()
  }

  _initMouse() {
    this.canvas.addEventListener("click", () => this.canvas.requestPointerLock())
  
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.canvas) return
  
      this.yaw += e.movementX * this.mouseSensitivity
      this.pitch -= e.movementY * this.mouseSensitivity
  
      const limit = Math.PI / 2 - 0.01
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
    })
  }

  updateProjection() {
    const aspect = this.canvas.width / this.canvas.height
    mat4.perspective(this.projection, Math.PI / 4, aspect, 0.01, 1000.0)
  }

  updateView() {
    
    const x = Math.cos(this.pitch) * Math.cos(this.yaw)
    const y = Math.sin(this.pitch)
    const z = Math.cos(this.pitch) * Math.sin(this.yaw)
    
    vec3.set(this.front, x, y, z)
    vec3.normalize(this.front, this.front)

    vec3.cross(this.right, this.front, this.up)
    vec3.normalize(this.right, this.right)

    const target = vec3.create()
    vec3.add(target, this.position, this.front)

    mat4.lookAt(this.view, this.position, target, this.up)
  }

  update(dt) {
    const moveDir = vec3.create()

    if (keys.has("KeyW")) vec3.add(moveDir, moveDir, this.front)
    if (keys.has("KeyS")) vec3.sub(moveDir, moveDir, this.front)
    if (keys.has("KeyD")) vec3.add(moveDir, moveDir, this.right)
    if (keys.has("KeyA")) vec3.sub(moveDir, moveDir, this.right)

    if (vec3.length(moveDir) > 0) {
      vec3.normalize(moveDir, moveDir)
      vec3.scaleAndAdd(this.position, this.position, moveDir, this.speed * dt)
    }

    this.updateView()
  }
}