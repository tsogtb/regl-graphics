import { mat4 } from "https://esm.sh/gl-matrix";
import { Path1D } from "./src/curves1d.js"; 


function createEnglishGreeting(offset, scale = 0.5) {
  const s = scale;
  const gap = scale * 0.4;
  const lineSpacing = scale * 2.4; 
  const segments = [];

  let cursorX = 0; 
  let cursorY = 0; 

  const line = (z1, y1, z2, y2) => {
    segments.push({
      start: { x: offset.x, y: offset.y + cursorY + y1, z: offset.z - (cursorX + z1) },
      end:   { x: offset.x, y: offset.y + cursorY + y2, z: offset.z - (cursorX + z2) }
    });
  };

  const next = (width) => { cursorX += width + gap; };
  const space = () => { cursorX += s * 1.5; };
  const indent = (numSpaces) => { cursorX += s * 1.2 * numSpaces; };
  const newLine = () => { cursorX = 0; cursorY -= lineSpacing; };

  // --- Uniform Letter Definitions ---
  const drawA = () => { line(0, 0, s * 0.5, s); line(s, 0, s * 0.5, s); line(s * 0.2, s * 0.4, s * 0.8, s * 0.4); next(s); };
  const drawD = () => { line(0, 0, 0, s); line(0, s, s * 0.7, s); line(s * 0.7, s, s, s * 0.5); line(s, s * 0.5, s * 0.7, 0); line(s * 0.7, 0, 0, 0); next(s); };
  const drawE = () => { line(0, 0, 0, s); line(0, s, s, s); line(0, s * 0.5, s * 0.7, s * 0.5); line(0, 0, s, 0); next(s); };
  const drawF = () => { line(0, 0, 0, s); line(0, s, s, s); line(0, s * 0.5, s * 0.7, s * 0.5); next(s); };
  const drawG = () => { line(s, s, 0, s); line(0, s, 0, 0); line(0, 0, s, 0); line(s, 0, s, s * 0.4); line(s, s * 0.4, s * 0.5, s * 0.4); next(s); };
  const drawH = () => { line(0, 0, 0, s); line(s, 0, s, s); line(0, s * 0.5, s, s * 0.5); next(s); };
  const drawI = () => { line(s * 0.4, 0, s * 0.4, s); next(s * 0.8); }; 
  const drawL = () => { line(0.1, s, 0.1, 0); line(0.1, 0, s * 0.8, 0); next(s * 0.9); };
  const drawM = () => { line(0, 0, 0, s); line(0, s, s * 0.5, s * 0.5); line(s * 0.5, s * 0.5, s, s); line(s, s, s, 0); next(s * 1.1); };
  const drawN = () => { line(0, 0, 0, s); line(0, s, s, 0); line(s, 0, s, s); next(s); };
  const drawO = () => { line(0, 0, 0, s); line(s, 0, s, s); line(0, s, s, s); line(0, 0, s, 0); next(s); };
  const drawP = () => { line(0, 0, 0, s); line(0, s, s, s); line(s, s, s, s * 0.5); line(s, s * 0.5, 0, s * 0.5); next(s); };
  const drawR = () => { line(0, 0, 0, s); line(0, s, s, s); line(s, s, s, s * 0.5); line(s, s * 0.5, 0, s * 0.5); line(s * 0.5, s * 0.5, s, 0); next(s); };
  const drawS = () => { line(s, s, 0, s); line(0, s, 0, s * 0.5); line(0, s * 0.5, s, s * 0.5); line(s, s * 0.5, s, 0); line(s, 0, 0, 0); next(s); };
  const drawT = () => { line(s * 0.5, 0, s * 0.5, s); line(0, s, s, s); next(s); };
  const drawU = () => { line(0, s, 0, 0); line(0, 0, s, 0); line(s, 0, s, s); next(s); };
  const drawV = () => { line(0, s, s * 0.5, 0); line(s * 0.5, 0, s, s); next(s); };
  const drawW = () => { line(0, s, s * 0.25, 0); line(s * 0.25, 0, s * 0.5, s * 0.4); line(s * 0.5, s * 0.4, s * 0.75, 0); line(s * 0.75, 0, s, s); next(s * 1.1); };
  const drawY = () => { line(0, s, s * 0.5, s * 0.5); line(s, s, s * 0.5, s * 0.5); line(s * 0.5, s * 0.5, s * 0.5, 0); next(s); };
  
  // FIXED EXCLAMATION: Stem stops at 0.5, Dot is a tiny line at the bottom
  const drawExcl = () => { 
    line(s * 0.3, s, s * 0.3, s * 0.5); // Stem (Top half only)
    line(s * 0.3, 0.1, s * 0.3, 0);    // Dot (At the very bottom)
    next(s * 0.5); 
  };

  // --- 5 Line Uniform Layout ---
  
  // 1. HAPPY NEW YEAR
  space(); drawH(); drawA(); drawP(); drawP(); drawY(); space();
  drawN(); drawE(); drawW(); space();
  drawY(); drawE(); drawA(); drawR();
  newLine();

  // 2. TO (Centered)
  indent(8); drawT(); drawO();
  newLine();

  // 3. DAVAANYAM FAMILY
  drawD(); drawA(); drawV(); drawA(); drawA(); drawN(); drawY(); drawA(); drawM();
  space();
  drawF(); drawA(); drawM(); drawI(); drawL(); drawY();
  newLine();

  // 4. FROM TSOGT (Staggered)
  indent(3); drawF(); drawR(); drawO(); drawM(); space();
  drawT(); drawS(); drawO(); drawG(); drawT(); drawExcl();


  return segments;
}

const textSegments = createEnglishGreeting({ x: -4.9, y: 3.8, z: 4.8 }, 0.42);
const namePath = new Path1D(textSegments);


const PASSIVE_STARS_COUNT = 10000;
const SNOW_COUNT = 2000; // Let's add 2000 flakes
const POINTS_FOR_CUBE = 3000; 
const s = 5; 

const cubeSegments = [
  
  { start: {x:-s, y:-s, z:-s}, end: {x: s, y:-s, z:-s} },
  { start: {x: s, y:-s, z:-s}, end: {x: s, y: s, z:-s} },
  { start: {x: s, y: s, z:-s}, end: {x:-s, y: s, z:-s} },
  { start: {x:-s, y: s, z:-s}, end: {x:-s, y:-s, z:-s} },
  
  { start: {x:-s, y:-s, z: s}, end: {x: s, y:-s, z: s} },
  { start: {x: s, y:-s, z: s}, end: {x: s, y: s, z: s} },
  { start: {x: s, y: s, z: s}, end: {x:-s, y: s, z: s} },
  { start: {x:-s, y: s, z: s}, end: {x:-s, y:-s, z: s} },
  
  { start: {x:-s, y:-s, z:-s}, end: {x:-s, y:-s, z: s} },
  { start: {x: s, y:-s, z:-s}, end: {x: s, y:-s, z: s} },
  { start: {x: s, y: s, z:-s}, end: {x: s, y: s, z: s} },
  { start: {x:-s, y: s, z:-s}, end: {x:-s, y: s, z: s} },
];

const cubePath = new Path1D(cubeSegments);



const STAR_PALETTE = [
  [1.0, 0.85, 0.7],
  [1.0, 0.4, 0.2],
  [0.5, 0.7, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.95, 0.4],
];

const getRandomColor = () => STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)];

const getGalaxyRadius = () => (
  Math.random() > 0.2 
    ? 25 + Math.random() * 5 
    : 30 + Math.random() * 10
);


function fillPassivePoints(positions, colors) {
  // Section 1: Stars (from 0 to PASSIVE_STARS_COUNT)
  for (let i = 0; i < PASSIVE_STARS_COUNT; i++) {
    const idx = i * 3;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = getGalaxyRadius();

    positions[idx]     = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);

    const [rc, gc, bc] = getRandomColor();
    const brightness = 0.4 + Math.random() * 0.6;
    colors[idx] = rc * brightness; 
    colors[idx + 1] = gc * brightness; 
    colors[idx + 2] = bc * brightness;
  }

  // Section 2: Snow (Starts AFTER stars)
  const snowOffset = PASSIVE_STARS_COUNT;
  for (let i = 0; i < SNOW_COUNT; i++) {
    const idx = (snowOffset + i) * 3;
    positions[idx]     = (Math.random() - 0.5) * 10; 
    positions[idx + 1] = (Math.random() - 0.5) * 10; 
    positions[idx + 2] = (Math.random() - 0.5) * 10; 
    
    // Bright white with a hint of blue
    colors[idx] = 0.9; colors[idx+1] = 0.95; colors[idx+2] = 1.0; 
  }

  // Section 3: Cube Edges (Starts AFTER stars AND snow)
  const cubeOffset = PASSIVE_STARS_COUNT + SNOW_COUNT;
  for (let j = 0; j < POINTS_FOR_CUBE; j++) {
    const { x, y, z } = cubePath.sample();
    const idx = (cubeOffset + j) * 3;
    
    positions[idx]     = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
    
    colors[idx]     = 0.5; 
    colors[idx + 1] = 0.6; 
    colors[idx + 2] = 0.7;
  }
}

export function createPointData(regl, {
  passive = false,
  samplers = [],
  counts = [],
  sceneColors = []
} = {}) {

  if (passive) {
    // 1. Prepare Data for Stars
    const starPos = new Float32Array(PASSIVE_STARS_COUNT * 3);
    const starCol = new Float32Array(PASSIVE_STARS_COUNT * 3);
    
    for (let i = 0; i < PASSIVE_STARS_COUNT; i++) {
      const idx = i * 3;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = getGalaxyRadius();
      starPos[idx] = r * Math.sin(phi) * Math.cos(theta);
      starPos[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[idx + 2] = r * Math.cos(phi);
      const [rc, gc, bc] = getRandomColor();
      starCol[idx] = rc; starCol[idx+1] = gc; starCol[idx+2] = bc;
    }

    // 2. Prepare Data for Snow
    const snowPos = new Float32Array(SNOW_COUNT * 3);
    const snowCol = new Float32Array(SNOW_COUNT * 3);
    for (let i = 0; i < SNOW_COUNT; i++) {
      const idx = i * 3;
      snowPos[idx]     = (Math.random() - 0.5) * 10; // X: -5 to 5
      snowPos[idx + 1] = (Math.random() - 0.5) * 10; // Y: -5 to 5
      snowPos[idx + 2] = (Math.random() - 0.5) * 10; // Z: -5 to 5
      snowCol[idx] = 0.9; snowCol[idx+1] = 0.9; snowCol[idx+2] = 1.0;
    }

    // 3. Prepare Data for Cube
    const cubePos = new Float32Array(POINTS_FOR_CUBE * 3);
    const cubeCol = new Float32Array(POINTS_FOR_CUBE * 3);
    for (let i = 0; i < POINTS_FOR_CUBE; i++) {
      const { x, y, z } = cubePath.sample();
      const idx = i * 3;
      cubePos[idx] = x; cubePos[idx+1] = y; cubePos[idx+2] = z;
      cubeCol[idx] = 0.5; cubeCol[idx+1] = 0.6; cubeCol[idx+2] = 0.7;
    }

    const TEXT_COUNT = 15000;
    const textPos = new Float32Array(TEXT_COUNT * 3);
    const textCol = new Float32Array(TEXT_COUNT * 3);

    for (let i = 0; i < TEXT_COUNT; i++) {
      const { x, y, z } = namePath.sample();
      const idx = i * 3;
      textPos[idx] = x; 
      textPos[idx + 1] = y; 
      textPos[idx + 2] = z;
      
      // Pure white so it stands out against the cube
      textCol[idx] = 1.0; textCol[idx + 1] = 0.9; textCol[idx + 2] = 0.3;
    }

    // Return as separate "Actors"
    return [
      { id: 'stars', buffer: regl.buffer(starPos), colorBuffer: regl.buffer(starCol), count: PASSIVE_STARS_COUNT, modelMatrix: mat4.create() },
      { id: 'snow',  buffer: regl.buffer(snowPos), colorBuffer: regl.buffer(snowCol), count: SNOW_COUNT,           modelMatrix: mat4.create() },
      { id: 'cube',  buffer: regl.buffer(cubePos), colorBuffer: regl.buffer(cubeCol), count: POINTS_FOR_CUBE,      modelMatrix: mat4.create() },
      { id: 'text',  buffer: regl.buffer(textPos),  colorBuffer: regl.buffer(textCol),  count: TEXT_COUNT,           modelMatrix: mat4.create() }
    ];
  }

  // Active Scene Logic
  // 1. Calculate how many valid shape groups we actually have
  const activeCount = Math.min(samplers.length, counts.length);

  // 2. Map only the valid active groups into individual renderable objects
  return samplers.slice(0, activeCount).map((sampleFn, i) => {
    const n = counts[i];
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const shapeColor = sceneColors[i] || [1.0, 1.0, 1.0];

    for (let j = 0; j < n; j++) {
      const { x, y, z } = sampleFn();
      const idx = j * 3;
      
      positions[idx]     = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;
      
      colors[idx]     = shapeColor[0];
      colors[idx + 1] = shapeColor[1];
      colors[idx + 2] = shapeColor[2];
    }

    return {
      buffer: regl.buffer(positions),
      colorBuffer: regl.buffer(colors),
      count: n,
      modelMatrix: mat4.create(), // Used by GPU to move/rotate this specific part
      id: i // Used in main.js to identify "trunk" vs "star" vs "leaves"
    };
  });
}