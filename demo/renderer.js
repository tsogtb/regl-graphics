/**
 * renderer.js
 * 
 * Renderer for point clouds and background gradient.
 */

import point_vert from "./shaders/point.vert.js";
import point_frag from "./shaders/point.frag.js";
import background_vert from "./shaders/background.vert.js"
import background_frag from "./shaders/background.frag.js"

/**
 * Create a point cloud renderer with a background.
 * @param {REGL} regl - Initialized REGL instance
 * @param {{buffer: REGL.Buffer, colorBuffer: REGL.Buffer, count: number}} pointData
 * @returns {Function} render(camera, time)
 */
export function createPointRenderer(regl, pointData) {

  // ------------------------------
  // Draw Points
  // ------------------------------
  const drawPoints = regl({
    vert: point_vert,
    frag: point_frag,
    attributes: {
      position: pointData.buffer,
      color: pointData.colorBuffer,
    },
    uniforms: {
      projection: regl.prop("projection"),
      view: regl.prop("view"),
      uTime: regl.prop("uTime"),
    },
    count: pointData.count,
    primitive: "points",
    blend: {
      enable: true,
      func: {
        srcRGB: "src alpha",
        srcAlpha: 1,
        dstRGB: "one",
        dstAlpha: 1,
      },
      equation: {
        rgb: "add",
        alpha: "add",
      },
    },
    depth: {
      enable: true,
      mask: false,
    },
  });

  // ------------------------------
  // Draw Background (full-screen quad gradient)
  // ------------------------------
  const drawBackground = regl({
    vert: background_vert,
    frag: background_frag,
    attributes: {
      position: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
    },
    elements: [[0, 1, 2], [0, 2, 3]],
    uniforms: {
      colorTop: regl.prop("colorTop"),
      colorBottom: regl.prop("colorBottom"),
    },
    depth: { enable: false },
    cull: { enable: false },
  });

  // ------------------------------
  // Render function
  // ------------------------------
  return function render(camera, time) {
    // Background first
    drawBackground({
      colorTop: [0.0, 0.0, 0.0],
      colorBottom: [0.0, 0.0, 0.0],
    });

    // Points on top
    drawPoints({
      projection: camera.projection,
      view: camera.view,
      uTime: time,
    });
  };
}
