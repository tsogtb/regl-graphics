/*
Author: Tsogt
Created: 12/20/2025
Last modified: 12/22/2025
 */
import createREGL from "https://esm.sh/regl";
import { Camera } from "./camera.js";
import { createPointData } from "./point_data.js";
import { createPointRenderer } from "./renderer.js";
import { SCENES, getSceneConfig } from "./scene.js";

// ---------------- Canvas & REGL ----------------
const canvas = document.getElementById("c");
const regl = createREGL({ canvas, attributes: { antialias:true, alpha:false, powerPreference:"high-performance" }});

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
let pointData = createPointData(regl, getSceneConfig(currentSceneIndex).config);
let render = createPointRenderer(regl, pointData);

function loadScene(index) {
  if(pointData?.buffer) pointData.buffer.destroy();
  if(pointData?.colorBuffer) pointData.colorBuffer.destroy();

  const config = getSceneConfig(index).config;
  pointData = createPointData(regl, config);
  render = createPointRenderer(regl, pointData);
}

function goNextScene() {
  currentSceneIndex = (currentSceneIndex + 1) % SCENES.length;
  loadScene(currentSceneIndex);
}

document.getElementById("next").addEventListener("click", goNextScene);
document.addEventListener("keydown", e => { if(e.key.toLowerCase() === "n") goNextScene(); });

// ---------------- Animation Loop ----------------
let prevTime = 0;
regl.frame(({ time }) => {
  const dt = Math.min(time - prevTime, 0.05);
  prevTime = time;

  camera.update(dt);
  regl.clear({ color: [0.02,0.02,0.02,1], depth: 1 });

  render(camera, time);
});
