/*
(c) 2025 Tsogt
This code is licensed under the MIT License.
Created: 12/20/2025
Last modified: 12/26/2025
 */
import createREGL from "https://esm.sh/regl";
import { Camera } from "./camera.js";
import { createPointData } from "./point_data.js";
import { createPointRenderer } from "./renderer.js";
import { SCENES, getSceneConfig } from "./scene_manager.js";
import { AudioProcessor } from "./audio_processor.js";

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
let passiveData = createPointData(regl, { passive: true })
let pointData = createPointData(regl, getSceneConfig(currentSceneIndex).config);
let render = createPointRenderer(regl, pointData, passiveData);


function loadScene(index) {
  const oldData = pointData;
  pointData = null;

  if(oldData?.buffer) oldData.buffer.destroy();
  if(oldData?.colorBuffer) oldData.colorBuffer.destroy();

  const sceneInfo = getSceneConfig(index);
  const config = sceneInfo.config;

  if (sceneInfo.brush) currentBrush = sceneInfo.brush;

  pointData = createPointData(regl, config);
  render = createPointRenderer(regl, pointData, passiveData);
}

function goNextScene() {
  currentSceneIndex = (currentSceneIndex + 1) % SCENES.length;
  loadScene(currentSceneIndex);
}

document.addEventListener("keydown", e => { if(e.key.toLowerCase() === "n") goNextScene(); });

let currentBrush = 'circle'; 

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "b") { // 'B' for Brush
    if (currentBrush === 'basic') {
        currentBrush = 'circle';
    } else if (currentBrush === 'circle') {
        currentBrush = 'square';
    } else if (currentBrush === 'square') {
        currentBrush = 'star';
    } else {
        currentBrush = 'basic';
    }
    
    console.log(`✨ Brush swapped to: ${currentBrush}`);
  }
});

const audio = document.getElementById('myAudio');
const playBtn = document.getElementById('btn-play');

const audioProcessor = new AudioProcessor();

playBtn.addEventListener('click', async () => {
  console.log("Button clicked!");

  try {
    // Initialize context if needed
    if (!audioProcessor.context) {
      console.log("Initializing context...");
      audioProcessor.init();
    }

    // Resume suspended context
    if (audioProcessor.context.state === 'suspended') {
      console.log("Resuming suspended context...");
      await audioProcessor.context.resume();
    }

    // Connect audio element
    console.log("Connecting audio element...");
    audioProcessor.connectAudioElement(audio);

    // Play / pause logic
    if (audio.paused) {
      console.log("Attempting to play...");
      await audio.play(); // await to catch autoplay errors
      playBtn.innerText = "PAUSE";
      console.log("Playing successfully!");
    } else {
      audio.pause();
      playBtn.innerText = "PLAY";
      console.log("Paused.");
    }

  } catch (err) {
    console.error("CRITICAL ERROR:", err.message);
    playBtn.innerText = "ERROR";
  }
});


// ---------------- Animation Loop ----------------
let smoothBass = 0;
let prevTime = 0;
regl.frame(({ time }) => {

  if (!pointData || !pointData.buffer || !pointData.colorBuffer) return; // Don't render if data is missing
  const dt = Math.min(time - prevTime, 0.05);
  prevTime = time;
  
  const freqData = audioProcessor.getFrequencyData();
  
  let targetBass = 0;
  if (freqData) {
    targetBass = freqData[0] / 255.0;
  }
  
  smoothBass += (targetBass - smoothBass) * 0.1;
  
  camera.update(dt);
  regl.clear({ color: [0.02, 0.02, 0.02, 1], depth: 1 });

  render(camera, time, currentBrush, smoothBass);
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

