import point_vert from "./shaders/point.vert.js"
import point_frag from "./shaders/point.frag.js"

export function createPointRenderer(regl, pointData) {

	const drawPoints = regl({
		point_vert,
		point_frag,
    attributes: {
      position: pointData.buffer,     
      color: pointData.colorBuffer
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
				dstAlpha: 1,
			},
			equation: {
				rgb: 'add',
				alpha: 'add',
			}
		},
		depth: {
			enable: true, 
			mask: false ,
		},
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

  return function render(camera, time) {

    drawSky({
      colorTop: [0.0, 0.0, 0.0],
      colorBottom: [0.0, 0.0, 0.0],
    })

		drawPoints({
			projection: camera.projection,
			view: camera.view,
			uTime: time,
		})
  }
}