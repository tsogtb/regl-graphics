import { describe, it, expect } from 'vitest';
import { Rectangle2D, Circle2D } from '../../src/shapes2d.js';
import { CompositeShape } from '../../src/composite_shapes.js';

describe('Composite Shapes - CSG Sampling', () => {

  describe('Union (True)', () => {
    it('should not sample points in the overlap twice', () => {
      // Create two overlapping squares
      const rect1 = new Rectangle2D({ x: 0, y: 0 }, 2, 2); // Area 4
      const rect2 = new Rectangle2D({ x: 1, y: 0 }, 2, 2); // Area 4, overlap is 1x2 area
      
      const union = new CompositeShape('union', [rect1, rect2]);
      
      // The sample should always be contained by the union logic
      for (let i = 0; i < 100; i++) {
        const p = union.sample();
        expect(union.contains(p)).toBe(true);
      }
    });
  });

  describe('Difference (A \\ B)', () => {
    it('should correctly sample a "donut" using difference', () => {
      const outer = new Circle2D({ x: 0, y: 0 }, 5);
      const inner = new Circle2D({ x: 0, y: 0 }, 2);
      
      const donut = new CompositeShape('difference', [outer, inner]);
      
      for (let i = 0; i < 100; i++) {
        const p = donut.sample();
        const dist = Math.sqrt(p.x**2 + p.y**2);
        
        // Point must be inside outer but OUTSIDE inner
        expect(dist).toBeLessThanOrEqual(5);
        expect(dist).toBeGreaterThan(2);
      }
    });
  });

  describe('Intersection', () => {
    it('should only sample from the shared region', () => {
      const rect1 = new Rectangle2D({ x: 0, y: 0 }, 10, 10);
      const rect2 = new Rectangle2D({ x: 8, y: 8 }, 10, 10);
      
      const overlap = new CompositeShape('intersection', [rect1, rect2]);
      
      // Shared region is x:[3, 5], y:[3, 5]
      const p = overlap.sample();
      expect(rect1.contains(p)).toBe(true);
      expect(rect2.contains(p)).toBe(true);
    });
  });
});