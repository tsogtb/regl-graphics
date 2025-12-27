import background_vert from "./shaders/background.vert.js";
import background_frag from "./shaders/background.frag.js";
import { BASIC, CIRCLE, SQUARE, STAR, GIZMO } from "./brushes.js";
import { GIZMO_DATA } from "./meshes/gizmo.js";

function createGizmoGroup(regl) {
  const backing = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      uniform float uViewportHeight;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
        
        gl_PointSize = uViewportHeight * 0.18; 
      }
    `,
    frag: `
      precision mediump float;
      void main() {
        float dist = length(gl_PointCoord - 0.5);
        // Soft radial falloff
        float alpha = smoothstep(0.5, 0.3, dist) * 0.8; 
        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
      }
    `,
    blend: {
      enable: true,
      func: { srcRGB: 'src alpha', dstRGB: 'one minus src alpha', srcAlpha: 1, dstAlpha: 1 }
    },
    depth: { enable: false },
    attributes: {
      position: regl.buffer([[0.9, 0.8]])
    },
    count: 1,
    primitive: 'points'
  });
  const drawAxes = regl({
    vert: GIZMO.vert,
    frag: GIZMO.frag,
    attributes: {
      position: GIZMO_DATA.geometry.positions,
      color: GIZMO_DATA.geometry.colors,
    },
    uniforms: { view: regl.prop("view") },
    blend: GIZMO.blend,
    depth: { enable: false , mask: false},
    count: GIZMO_DATA.geometry.count,
    primitive: "points",
  });

  const drawLabels = regl({
    vert: `
      precision mediump float;
      attribute vec3 anchor;
      attribute vec2 offset;
      attribute vec3 color;
      varying vec3 vColor;

      uniform mat4 view;
      uniform float uAspect, uViewportHeight;
      
      void main() {
        vColor = color;
        vec3 rotatedAnchor = mat3(view) * anchor;
        vec2 hudBase = rotatedAnchor.xy * 0.1; 
        vec2 screenPos = hudBase + (offset * 0.025); 
        screenPos.y *= uAspect;
        gl_Position = vec4(screenPos + vec2(0.9, 0.8), 0.0, 1.0);
        gl_PointSize = uViewportHeight * 0.003;
      }`,
    frag: GIZMO.frag,
    attributes: {
      anchor: GIZMO_DATA.labels.anchors,
      offset: GIZMO_DATA.labels.offsets,
      color: GIZMO_DATA.labels.colors
    },
    uniforms: { view: regl.prop("view") },
    blend: GIZMO.blend,
    depth: { enable: false },
    count: GIZMO_DATA.labels.count,
    primitive: "points"
  });
  return (props) => {
    backing();
    drawAxes(props);
    drawLabels(props);
  };
}

export function createPointRenderer(regl, pointData, passivePointData) {

  let currentBass = 0;
  
  const globalScope = regl({
    uniforms: {
      uTime: regl.prop("uTime"),
      uBass: () => currentBass,
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
    },
    count: regl.prop("count"),
    primitive: "points",
  });

  const drawPassiveStars = createPointCommand(CIRCLE);

  const brushes = {
    basic:  createPointCommand(BASIC),
    circle: createPointCommand(CIRCLE),
    square: createPointCommand(SQUARE),
    star:   createPointCommand(STAR),
  };

  const drawGizmoGroup = createGizmoGroup(regl);

  return function render(camera, time, brushType = 'basic', audioValue = 0) {
    currentBass = audioValue;
    globalScope({ uTime: time }, () => {
      
      drawBackground({ colorTop: [0, 0, 0], colorBottom: [0, 0, 0] });

      drawPassiveStars({
        projection: camera.projection,
        view: camera.view,
        position: passivePointData.buffer,
        color: passivePointData.colorBuffer,
        count: passivePointData.count
      });

      const draw = brushes[brushType] || brushes.basic;
      draw({
        projection: camera.projection,
        view: camera.view,
        position: pointData.buffer,     
        color: pointData.colorBuffer,   
        count: pointData.count         
      });

      regl.clear({ depth: 1 });
      drawGizmoGroup({ view: camera.view });
    });
  };
}