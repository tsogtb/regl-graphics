import vert from "./shaders/basic.vert.js"
import frag from "./shaders/basic.frag.js"

export function createRenderer(regl, starData) {

	const drawStars = regl({
			vert: `
			precision mediump float;
			attribute vec3 position, color;
			uniform mat4 projection, view;
			uniform float uTime; 
			varying vec3 vColor;
			varying float vSizeFactor; // Pass this to fade the star
		
			void main() {
				float offset = position.x + position.y + position.z;
				float twinkle = 0.9 + 0.1 * sin(uTime * 1.5 + offset * 10.0);
				vColor = color * twinkle;
		
				vec4 mvPosition = view * vec4(position, 1.0);
				gl_Position = projection * mvPosition;
		
				float baseSize = 100.0 + 90.0 * sin(offset + 123.45);
				float perspectiveSize = baseSize / -mvPosition.z;
		
				// 1. Cap the size so it's at least 1.5 pixels (better for sampling)
				gl_PointSize = max(perspectiveSize, 1.5);
		
				// 2. Calculate how much smaller than 'ideal' the star is.
				// If perspectiveSize is 0.1, vSizeFactor becomes roughly 0.1.
				vSizeFactor = clamp(perspectiveSize / 1.5, 0.0, 1.0);
			}
		`,
		frag: `
			precision mediump float;
			varying vec3 vColor;
			varying float vSizeFactor;
			void main() {
				float dist = length(gl_PointCoord.xy - 0.5);
				if (dist > 0.5) discard;

				// Soft Gaussian-like glow
				float glow = pow(1.0 - dist * 2.0, 4.0);
				// Harder center core
				float core = pow(1.0 - dist * 2.0, 10.0) * 2.0;
				
				gl_FragColor = vec4(vColor, (glow + core)*vSizeFactor);
			}
		`,
    attributes: {
      position: starData.buffer,     
      color: starData.colorBuffer
    },
    uniforms: {
      projection: regl.prop('projection'),
      view: regl.prop('view'),
			uTime: regl.prop('uTime'),
    },
    count: starData.count,            
    primitive: 'points',
		blend: {
			enable: true,
			func: {
				srcRGB: 'src alpha',
				srcAlpha: 1,
				dstRGB: 'one', 
				dstAlpha: 1
			},
			equation: {
				rgb: 'add',
				alpha: 'add'
			}
		},
		depth: {
			enable: true, 
			mask: false 
		}
  });
	
  const drawSky = regl({
    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.999, 1.0);
      }
    `,
    frag: `
      precision mediump float;
      varying vec2 vUv;
      uniform vec3 colorTop, colorBottom;
      void main() {
        gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
      }
    `,
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
  })

  const drawMesh = regl({
    vert,
    frag,
    attributes: {
      position: regl.prop("positions"),
    },
    elements: regl.prop("elements"),
    uniforms: {
      projection: regl.prop("projection"),
      view: regl.prop("view"),
      model: regl.prop("model"), 
      uColor: regl.prop("color"),
    },
    cull: { 
			enable: true,
			face: "back", 
		},
    depth: { 
			enable: true,
			mask: true,
			func: "less",	 
		},
  })

  return function render(scene, camera, time) {

    drawSky({
      colorTop: [0.0, 0.0, 0.0],
      colorBottom: [0.0, 0.0, 0.0],
    })

		drawStars({
			projection: camera.projection,
			view: camera.view,
			uTime: time,
		})
    
    const batchProps = scene.meshes.map(mesh => ({
      positions: mesh.positions,
      elements: mesh.elements,
      color: mesh.color,
      model: mesh.modelMatrix,
      projection: camera.projection,
      view: camera.view
    }))

    // if (batchProps.length > 0) {
    //   drawMesh(batchProps)
    // }
  }
}