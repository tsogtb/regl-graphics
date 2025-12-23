import { describe, it, expect } from 'vitest';
import { Path1D, bezierQuadratic, lineSegment } from '../../src/curves1d.js';

describe('Curves 1D - Path Logic', () => {
  
  it('should correctly calculate the total length of a multi-segment path', () => {
    const segments = [
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 } }, // Length 10
      { start: { x: 10, y: 0 }, end: { x: 10, y: 10 } } // Length 10
    ];
    const path = new Path1D(segments);
    expect(path.totalLength).toBe(20);
  });

  it('should handle parametric functions (Bezier) by pre-baking LUTs', () => {
    // A simple quadratic bezier
    const curve = bezierQuadratic({
      p0: { x: 0, y: 0 },
      p1: { x: 5, y: 10 },
      p2: { x: 10, y: 0 }
    });
    
    const path = new Path1D([curve]);
    
    // The length should be greater than the straight line distance (10)
    expect(path.totalLength).toBeGreaterThan(10);
    expect(path.segments[0].type).toBe('baked_parametric');
  });

  it('should sample a point within the bounding box of the segments', () => {
    const path = new Path1D([
      { start: { x: 0, y: 0 }, end: { x: 100, y: 100 } }
    ]);
    const p = path.sample();
    
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.x).toBeLessThanOrEqual(100);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeLessThanOrEqual(100);
  });

  it('should maintain uniform distribution via binary search on the LUT', () => {
    // Using a function that is very non-linear
    // If arc-length parameterization fails, points would clump at t=0
    const extremelyNonLinear = (t) => ({ x: t * t * t * 100, y: 0 }); 
    const path = new Path1D([extremelyNonLinear], 1000);
    
    // If we sample many points, the average X should be near 50 (middle)
    // even though t^3 spends most of its time near 0.
    let sumX = 0;
    const iterations = 1000;
    for(let i = 0; i < iterations; i++) {
        sumX += path.sample().x;
    }
    const avgX = sumX / iterations;
    
    // Expect average to be roughly middle (allowing for some random variance)
    expect(avgX).toBeGreaterThan(40);
    expect(avgX).toBeLessThan(60);
  });
});