import { Path1D } from "../src/curves1d.js"; 

const PASSIVE_STARS_COUNT = 10000;
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
    ? 40 + Math.random() * 20 
    : 30 + Math.random() * 10
);


function fillPassivePoints(positions, colors) {
  const totalPoints = positions.length / 3;
  const starCount = Math.max(0, totalPoints - POINTS_FOR_CUBE);

  // 1. Stars (Galaxy)
  for (let i = 0; i < starCount; i++) {
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

  // 2. Cube Edges
  let currentOffset = starCount;
  for (let j = 0; j < POINTS_FOR_CUBE; j++) {
    const { x, y, z } = cubePath.sample();
    const idx = (currentOffset + j) * 3;
    
    positions[idx]     = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
    
    // Soft cyan/white for the boundary
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

  let totalPoints = 0;
  let positions, colors;

  if (passive) {
    totalPoints = PASSIVE_STARS_COUNT + POINTS_FOR_CUBE;
    positions = new Float32Array(totalPoints * 3);
    colors = new Float32Array(totalPoints * 3);
    
    fillPassivePoints(positions, colors);
  } else {
    const activeCount = Math.min(samplers.length, counts.length);
    totalPoints = counts.reduce((sum, n, i) => i < activeCount ? sum + n : sum, 0);
    
    positions = new Float32Array(totalPoints * 3);
    colors = new Float32Array(totalPoints * 3);
  
    let offset = 0;
    for (let i = 0; i < activeCount; i++) {
      const sampleFn = samplers[i];
      const n = counts[i];

      const shapeColor = sceneColors[i] || [1.0, 1.0, 1.0];
  
      for (let j = 0; j < n; j++) {
        const { x, y, z } = sampleFn();
        const idx = (offset + j) * 3;
        
        positions[idx]     = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        
        colors[idx]     = shapeColor[0];
        colors[idx + 1] = shapeColor[1];
        colors[idx + 2] = shapeColor[2];
      }
      offset += n;
    }
  }

  return {
    buffer: regl.buffer(positions),
    colorBuffer: regl.buffer(colors),
    count: totalPoints,
  };
}
