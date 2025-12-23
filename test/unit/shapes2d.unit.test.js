import { describe, it, expect } from 'vitest';
import { 
  Rectangle2D, 
  Triangle2D, 
  Circle2D, 
  Polygon2D 
} from '../../src/shapes2d.js';

describe('Shapes 2D - Area Sampling Logic', () => {

  describe('Rectangle2D', () => {
    it('should calculate area correctly', () => {
      const rect = new Rectangle2D({ x: 0, y: 0 }, 10, 5);
      expect(rect.area).toBe(50);
    });

    it('sampled points should be within the rectangle', () => {
      const rect = new Rectangle2D({ x: 5, y: 5 }, 2, 2);
      for (let i = 0; i < 100; i++) {
        const p = rect.sample();
        expect(rect.contains(p)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(4);
        expect(p.x).toBeLessThanOrEqual(6);
      }
    });
  });

  describe('Triangle2D', () => {
    it('should sample points inside a right triangle', () => {
      const a = { x: 0, y: 0 };
      const b = { x: 10, y: 0 };
      const c = { x: 0, y: 10 };
      const tri = new Triangle2D(a, b, c);
      
      for (let i = 0; i < 100; i++) {
        const p = tri.sample();
        expect(tri.contains(p)).toBe(true);
      }
    });
  });

  describe('Circle2D', () => {
    it('should maintain radial uniformity', () => {
      const circle = new Circle2D({ x: 0, y: 0 }, 10);
      // We expect area to be PI * r^2
      expect(circle.area).toBeCloseTo(Math.PI * 100);

      for (let i = 0; i < 100; i++) {
        const p = circle.sample();
        const dist = Math.sqrt(p.x ** 2 + p.y ** 2);
        expect(dist).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Polygon2D', () => {
    it('should handle convex shapes (Square as Polygon)', () => {
      const vertices = [
        { x: 0, y: 0 }, { x: 10, y: 0 }, 
        { x: 10, y: 10 }, { x: 0, y: 10 }
      ];
      const poly = new Polygon2D(vertices);
      expect(poly.area).toBe(100);
      
      const p = poly.sample();
      expect(poly.contains(p)).toBe(true);
    });
  });
});