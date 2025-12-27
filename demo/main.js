/*
(c) 2025 Tsogt
This code is licensed under the MIT License.
Created: 12/20/2025
Last modified: 12/27/2025
 */
import createREGL from "https://esm.sh/regl";
import { mat4 } from "https://esm.sh/gl-matrix";
import { Camera } from "./camera.js";
import { createPointData } from "./point_data.js";
import { createPointRenderer } from "./renderer.js";
import { SCENES, getSceneConfig } from "./scene_manager.js";

// ---------------- Canvas & REGL ----------------
const canvas = document.getElementById("c");
const regl = createREGL({ 
  canvas, 
  attributes: { 
    antialias: true, 
    alpha: false, 
    powerPreference: "high-performance"
  },

  pixelRatio: Math.min(window.devicePixelRatio, 2.0) 
});

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---------------- Camera ----------------
const camera = new Camera(canvas);

// ---------------- Scene & Renderer ----------------
let currentSceneIndex = 0;
let currentBrush = 'star'; 
const render = createPointRenderer(regl); 

let passiveData = createPointData(regl, { passive: true })
let pointData = createPointData(regl, getSceneConfig(currentSceneIndex).config);


function loadScene(index) {
  // 1. Clean up the array of active objects
  if (Array.isArray(pointData)) {
    pointData.forEach(obj => {
      if (obj.buffer) obj.buffer.destroy();
      if (obj.colorBuffer) obj.colorBuffer.destroy();
    });
  }

  const sceneInfo = getSceneConfig(index);
  if (sceneInfo.brush) currentBrush = sceneInfo.brush;

  // 2. Load new array of point objects
  pointData = createPointData(regl, sceneInfo.config);
  console.log(`Loaded Scene ${index}: ${sceneInfo.name || 'New Scene'}`);
}

function goNextScene() {
  currentSceneIndex = (currentSceneIndex + 1) % SCENES.length;
  loadScene(currentSceneIndex);
}

document.addEventListener("keydown", e => { if(e.key.toLowerCase() === "n") goNextScene(); });


window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "b") {
    const brushes = ['basic', 'circle', 'square', 'star'];
    currentBrush = brushes[(brushes.indexOf(currentBrush) + 1) % brushes.length];
    console.log(`✨ Brush swapped to: ${currentBrush}`);
  }
});

// ---------------- Animation Loop ----------------
let prevTime = 0;
regl.frame(({ time }) => {
  if (!pointData || !Array.isArray(pointData)) return;

  const dt = Math.min(time - prevTime, 0.05);
  prevTime = time;

  camera.update(dt);
  regl.clear({ color: [0.02, 0.02, 0.02, 1], depth: 1 });

  passiveData.forEach(obj => {
    mat4.identity(obj.modelMatrix);
    
    if (obj.id === 'snow') {
      const fallSpeed = 1.0;
      const range = 10.0; // The height of your cube (from -5 to 5)
      
      // Calculate a vertical offset that loops from 0 to -10
      const yOffset = -(time * fallSpeed % range);
      mat4.translate(obj.modelMatrix, obj.modelMatrix, [0, yOffset, 0]);
    }
    // Stars and Cube stay at identity (fixed in space)
  });

  // Get the current scene configuration
  const sceneInfo = getSceneConfig(currentSceneIndex);

  // If the scene has an animate function, use it!
  if (sceneInfo.animate) {
    sceneInfo.animate(pointData, time, mat4);
  } else {
  /* Fallback default animation if no specific one is defined
  pointData.forEach(obj => {
    mat4.identity(obj.modelMatrix);
    mat4.rotateY(obj.modelMatrix, obj.modelMatrix, time * 0.5);
  });
  */
  }

  render(camera, time, currentBrush, pointData, passiveData);
});


//----------------- Screenshot ----------------
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'j') {
    const canvas = document.getElementById("c");
    
    // Check if the drawing buffer is preserved
    const attributes = regl._gl.getContextAttributes();
    
    if (!attributes.preserveDrawingBuffer) {
      console.warn(
        "⚠️ Screenshot Failed: 'preserveDrawingBuffer' is currently false.\n" +
        "To take screenshots, set { attributes: { preserveDrawingBuffer: true } } in the regl constructor."
      );
      alert("Screenshot failed. Check the console for instructions!");
      return;
    }

    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `deepfield_${Date.now()}.png`;
      link.href = dataURL;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("🌌 Captured!");
    } catch (err) {
      console.error("Capture failed:", err);
    }
  }
});