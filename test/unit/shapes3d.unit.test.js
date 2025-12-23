import { describe, it, expect } from 'vitest';
import { 
  Sphere3D, 
  Box3D, 
  Cone3D, 
  Ellipsoid3D,
  Cylinder3D, 
} from '../../src/shapes3d.js';

describe('Shapes 3D - Volume Sampling Logic', () => {

  describe('Sphere3D', () => {
    it('should calculate volume correctly', () => {
      const radius = 2;
      const sphere = new Sphere3D({ x: 0, y: 0, z: 0 }, radius);
      // Volume = (4/3) * PI * r^3
      const expected = (4/3) * Math.PI * Math.pow(radius, 3);
      expect(sphere.volume).toBeCloseTo(expected);
    });

    it('sampled points should be within the sphere', () => {
      const sphere = new Sphere3D({ x: 10, y: 10, z: 10 }, 5);
      for (let i = 0; i < 100; i++) {
        const p = sphere.sample();
        expect(sphere.contains(p)).toBe(true);
      }
    });
  });

  describe('Box3D', () => {
    it('should calculate volume and bounds correctly', () => {
      const box = new Box3D({ x: 0, y: 0, z: 0 }, 2, 4, 6);
      expect(box.volume).toBe(48);
      expect(box.bbox.minZ).toBe(-3);
      expect(box.bbox.maxZ).toBe(3);
    });

    it('sampled points should be within the box', () => {
      const box = new Box3D({ x: 0, y: 0, z: 0 }, 1, 1, 1);
      for (let i = 0; i < 100; i++) {
        const p = box.sample();
        expect(box.contains(p)).toBe(true);
      }
    });
  });

  describe('Cone3D', () => {
    it('should calculate volume correctly', () => {
      const cone = new Cone3D({ x: 0, y: 0, z: 0 }, 3, 10);
      // Volume = (1/3) * PI * r^2 * h
      const expected = (1/3) * Math.PI * 9 * 10;
      expect(cone.volume).toBeCloseTo(expected);
    });

    it('sampled points should be within the cone boundary', () => {
      const cone = new Cone3D({ x: 0, y: 0, z: 0 }, 5, 10);
      for (let i = 0; i < 100; i++) {
        const p = cone.sample();
        expect(cone.contains(p)).toBe(true);
      }
    });
  });

  describe('Cylinder3D', () => {
    it('should calculate volume and containment correctly', () => {
      const cyl = new Cylinder3D({ x: 0, y: 0, z: 0 }, 2, 10);
      expect(cyl.volume).toBeCloseTo(Math.PI * 4 * 10);
      
      // Test center point
      expect(cyl.contains({ x: 0, y: 0, z: 5 })).toBe(true);
      // Test point outside height
      expect(cyl.contains({ x: 0, y: 0, z: 11 })).toBe(false);
      // Test point outside radius
      expect(cyl.contains({ x: 3, y: 0, z: 5 })).toBe(false);
    });

    it('should sample points uniformly within boundaries', () => {
      const cyl = new Cylinder3D({ x: 0, y: 0, z: 0 }, 1, 1);
      for (let i = 0; i < 100; i++) {
        expect(cyl.contains(cyl.sample())).toBe(true);
      }
    });
  });
});

