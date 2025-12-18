import vert from "./shaders/basic.vert.js"
import frag from "./shaders/basic.frag.js"

export function createRenderer(regl) {

  // Create draw command
  const drawScene = regl({
    vert,
    frag,

    attributes: {
      position: regl.prop("positions")
    },

    uniforms: {
      projection: (_, props) => props.camera.projection,
      view: (_, props) => props.camera.view,
    },

    elements: regl.prop("elements")
  })

  // Return a function that calls the draw command
  return function render(scene, camera) {
    drawScene({
      positions: scene.positions,
      elements: scene.elements,
      camera: camera
    })
  }
}
