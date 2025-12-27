import background_vert from "./shaders/background.vert.js";
import background_frag from "./shaders/background.frag.js";
import { BASIC, CIRCLE, SQUARE, STAR, GIZMO } from "./brushes.js";
import { GIZMO_DATA } from "./meshes/gizmo.js";

function createGizmoGroup(regl) {
  const uAnchor = [0.92, 0.85]; 
  const uGizmoScale = 0.12;

  const drawAxes = regl({
    vert: GIZMO.vert, 
    frag: GIZMO.frag,
    attributes: {
      position: GIZMO_DATA.geometry.positions,
      color: GIZMO_DATA.geometry.colors,
    },
    uniforms: { 
      view: regl.prop("view"),
      uAspect: ({viewportWidth, viewportHeight}) => viewportWidth / viewportHeight,
      uViewportHeight: regl.context('viewportHeight'),
      uGizmoScale: uGizmoScale,
      uAnchor: uAnchor
    },
    count: GIZMO_DATA.geometry.count,
    primitive: "points",

    depth: {
      enable: true,  // Let the axes hide each other correctly
      mask: true,    // Allow writing to the depth buffer for these points
      func: 'less',   // Standard sorting: closer pixels hide further pixels
    },
  });

  const drawLabels = regl({
    vert: `
      precision mediump float;
      attribute vec3 anchor;
      attribute vec2 offset;
      attribute vec3 color;
      varying vec3 vColor;
      uniform mat4 view;
      uniform float uAspect, uGizmoScale;
      uniform vec2 uAnchor;
      
      void main() {
        vColor = color;
        vec3 rotatedAnchor = mat3(view) * anchor;
        
        // Match the axis math exactly
        vec2 hudBase = rotatedAnchor.xy * uGizmoScale; 
        hudBase.x /= uAspect; 
        
        // Scale labels down for "Engineer" look
        vec2 labelOffset = offset * 0.03; 
        labelOffset.x /= uAspect;

        float z = -rotatedAnchor.z * 0.01;

        // Push labels slightly forward so they never fight axes
        z -= 0.001;

        gl_Position = vec4(
          hudBase + labelOffset + uAnchor,
          z,
          1.0
        );
        gl_PointSize = 2.0; 
      }`,
    frag: GIZMO.frag,
    attributes: {
      anchor: GIZMO_DATA.labels.anchors,
      offset: GIZMO_DATA.labels.offsets,
      color: GIZMO_DATA.labels.colors
    },
    uniforms: { 
      view: regl.prop("view"),
      uAspect: ({viewportWidth, viewportHeight}) => viewportWidth / viewportHeight,
      uGizmoScale: uGizmoScale,
      uAnchor: uAnchor
    },
    count: GIZMO_DATA.labels.count,
    primitive: "points",
    depth: {
      enable: true, 
      mask: true,    
    },
  });

  return (props) => {
    drawAxes(props);
    drawLabels(props);
  };
}

export function createPointRenderer(regl) {
  const globalScope = regl({
    uniforms: {
      uTime: regl.prop("uTime"),
      uAspect: (context) => context.viewportWidth / context.viewportHeight,
      uViewportHeight: (context) => context.viewportHeight,
    }
  });

  const drawBackground = regl({
    vert: background_vert,
    frag: background_frag,
    attributes: { position: [[-1, -1], [1, -1], [1, 1], [-1, 1]] },
    elements: [[0, 1, 2], [0, 2, 3]],
    uniforms: {
      colorTop: regl.prop("colorTop"),
      colorBottom: regl.prop("colorBottom"),
    },
    depth: { enable: false },
  });

  const createPointCommand = (config) => regl({
    vert: config.vert,
    frag: config.frag,
    blend: config.blend,
    depth: config.depth,
    attributes: {
      position: regl.prop("position"),
      color: regl.prop("color"),
    },
    uniforms: {
      projection: regl.prop("projection"),
      view: regl.prop("view"),
      model: regl.prop("model"),
      uIsSnow: regl.prop("uIsSnow"),
      // uTime is NOT needed here; it's inherited from globalScope
    },
    count: regl.prop("count"),
    primitive: "points",
  });

  const brushes = {
    basic:  createPointCommand(BASIC),
    circle: createPointCommand(CIRCLE),
    square: createPointCommand(SQUARE),
    star:   createPointCommand(STAR),
  };

  const drawGizmoGroup = createGizmoGroup(regl);

  // The final render function
  return function render(camera, time, brushType = 'circle', activeObjects = [], passiveObjects = []) {
    // 1. Wrap everything in globalScope to provide uTime/uAspect
    globalScope({ uTime: time }, () => {
      
      drawBackground({ colorTop: [0, 0, 0], colorBottom: [0, 0, 0] });

      // 2. Loop through passive stars (background galaxy/cube)
      passiveObjects.forEach(obj => {
        brushes.circle({
          projection: camera.projection,
          view: camera.view,
          model: obj.modelMatrix,
          position: obj.buffer,
          color: obj.colorBuffer,
          count: obj.count,
          uIsSnow: obj.id === 'snow' ? 1.0 : 0.0
        });
      });

      // 3. Loop through active shapes (Tree, Star, Ornaments)
      const draw = brushes[brushType] || brushes.basic;
      activeObjects.forEach(obj => {
        draw({
          projection: camera.projection,
          view: camera.view,
          model: obj.modelMatrix, 
          position: obj.buffer,
          color: obj.colorBuffer,
          count: obj.count,
          uIsSnow: 0.0,
        });
      });

      regl.clear({ depth: 1 });
      drawGizmoGroup({ view: camera.view });
    });
  };
}