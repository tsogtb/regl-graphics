import createREGL from "https://esm.sh/regl"
import { Camera } from "./camera.js"
import { createRenderer } from "./renderer.js"
import { createScene, createStarData } from "./scene.js"

const canvas = document.getElementById("c")

const regl = createREGL({ 
    canvas,
    attributes: {
        antialias: true,
        alpha: false, 
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
    }
})

function resize() {
    const dpr = window.devicePixelRatio || 1
    
    const width = window.innerWidth
    const height = window.innerHeight
    
    canvas.width = width * dpr
    canvas.height = height * dpr
  
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
}

window.addEventListener("resize", resize)
resize()

const camera = new Camera(canvas)
const starData = createStarData(regl)
const scene = createScene()
const render = createRenderer(regl, starData)

let prevTime = 0

regl.frame(({ time }) => {

  const dt = Math.min(time - prevTime, 0.05)
  prevTime = time
  const safeTime = time % (Math.PI * 100)

  camera.update(dt)

  regl.clear({ 
    color: [0.02, 0.02, 0.02, 1], 
    depth: 1 
  })

  render(scene, camera, safeTime)
})