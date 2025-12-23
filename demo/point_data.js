/**
 * point_data.js
 */

const DEFAULT_PASSIVE_COUNT = 2000000;

const STAR_PALETTE = [
  [1.0, 0.85, 0.7],
  [1.0, 0.4, 0.2],
  [0.5, 0.7, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.95, 0.4],
];

const getRandomColor = () => STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)];

const getStarRadius = () => (
  Math.random() > 0.2 
    ? 50 + Math.random() * 100 
    : 3 + Math.random() * 50
);


function fillPassivePoints(positions, colors) {
  const count = positions.length / 3;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = getStarRadius();

    positions[idx]     = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);

    const [rc, gc, bc] = getRandomColor();
    const brightness = 0.4 + Math.random() * 0.6;

    colors[idx]     = rc * brightness;
    colors[idx + 1] = gc * brightness;
    colors[idx + 2] = bc * brightness;
  }
}

export function createPointData(regl, {
  passive = false,
  samplers = [], 
  counts = [],
} = {}) {

  let totalPoints = 0;
  let positions, colors;

  if (passive) {
    totalPoints = DEFAULT_PASSIVE_COUNT;
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
  
      for (let j = 0; j < n; j++) {
        const { x, y, z } = sampleFn();
        const idx = (offset + j) * 3;
        
        positions[idx]     = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;
        
        // Constant white for active shapes
        colors[idx] = colors[idx+1] = colors[idx+2] = 1.0;
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
