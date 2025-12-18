import { mat4 } from "https://esm.sh/gl-matrix"

export class Camera {
  constructor(canvas) {
    this.canvas = canvas

    this.projection = mat4.create()
    this.view = mat4.create()

    this.position = [0, 1.5, 3]
    this.target = [0, 1.5, 0]
    this.up = [0, 1, 0]

    this.update()
    window.addEventListener("resize", () => this.update())
  }

  update() {
    const aspect = this.canvas.width / this.canvas.height

    mat4.perspective(
      this.projection,
      Math.PI / 4,
      aspect,
      0.01,
      100.0
    )

    mat4.lookAt(
      this.view,
      this.position,
      this.target,
      this.up
    )
  }
}
