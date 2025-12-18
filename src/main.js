import createREGL from "https://esm.sh/regl"

// --------------------------------------------------
// Canvas + regl setup
// --------------------------------------------------

const canvas = document.getElementById('c')

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1
  canvas.width  = Math.floor(window.innerWidth  * dpr)
  canvas.height = Math.floor(window.innerHeight * dpr)
  canvas.style.width  = window.innerWidth  + 'px'
  canvas.style.height = window.innerHeight + 'px'
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const regl = createREGL({ canvas })


// --------------------------------------------------
// Draw command: ONE TRIANGLE
// --------------------------------------------------

const drawTriangle = regl({
    vert: `
        precision mediump float;

        attribute vec2 position;

        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `,

    frag: `
        precision mediump float;

        void main() {
            gl_FragColor = vec4(1.0, 0.6, 0.2, 1.0);
        }
    `,
    attributes: {
        position: [
            [-0.1, -0.1],
            [0.1, -0.1],
            [0.0, 0.2],
        ]
    },

    count: 3
})

regl.frame(() => {
  regl.clear({
    color: [0.05, 0.05, 0.05, 1],
    depth: 1
  })

  drawTriangle()

})