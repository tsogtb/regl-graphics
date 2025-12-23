import { Sphere3D, Cylinder3D, Cone3D } from '../src/shapes3d.js';
import { CompositeShape } from '../src/composite_shapes.js';

async function runStressTest() {
  console.log("🌌 Starting deepfield.js Stress Test...");
  console.log("---------------------------------------");

  // 1. Setup a complex CSG Shape
  const base = new Sphere3D({ x: 0, y: 0, z: 5 }, 5);
  const hole = new Cylinder3D({ x: 0, y: 0, z: 0 }, 2, 10);
  const cap = new Cone3D({ x: 0, y: 0, z: 9 }, 3, 4);

  const ornament = new CompositeShape('union', [
    new CompositeShape('difference', [base, hole]),
    cap
  ]);

  const iterations = 1_000_000;
  const startTime = performance.now();

  // 2. The Loop
  const buffer = new Float32Array(iterations * 3);
  for (let i = 0; i < iterations; i++) {
    const p = ornament.sample();
    buffer[i * 3]     = p.x;
    buffer[i * 3 + 1] = p.y;
    buffer[i * 3 + 2] = p.z;
  }

  const endTime = performance.now();
  const totalTimeMs = endTime - startTime;
  const sps = Math.floor((iterations / totalTimeMs) * 1000);

  // 3. Results
  console.log(`✅ Sampled ${iterations.toLocaleString()} points`);
  console.log(`⏱️ Total Time: ${totalTimeMs.toFixed(2)}ms`);
  console.log(`🚀 Performance: ${sps.toLocaleString()} samples/sec`);
  
  if (sps > 1_000_000) {
    console.log("💎 STATUS: ELITE PERFORMANCE");
  } else {
    console.log("🚀 STATUS: SOLID PERFORMANCE");
  }
}

runStressTest();