/**
 * composite_shapes.js
 * 
 * Utilities for sampling points from composite shapes formed by 
 * unions or intersections of multiple base shapes.
 * 
 * Requirements for base shapes:
 * - .sample(): returns a uniformly sampled point {x, y, z}
 * - .contains(point): returns true if point is inside the shape
 * - .area or .volume (optional): numeric measure, used for weighted union sampling
 * 
 * Functions:
 * - sampleUnion(shapes): pick a point from the union of multiple shapes
 *   using area/volume-weighted random selection
 * - sampleIntersection(shapes, bbox, maxAttempts=1000): pick a point from the
 *   intersection using rejection sampling. bbox defines the search space.
 * 
 * Works for both 2D and 3D shapes as long as they implement the required interface.
 */


/**
 * CompositeShape
 * * Represents a complex volume formed by Boolean operations (CSG) on other shapes.
 * Supports recursive nesting (e.g., a union of intersections).
 * * @example
 * const sphere = new Sphere3D({x:0, y:0, z:0}, 2);
 * const box = new Box3D({x:0, y:0, z:0}, 1, 1, 1);
 * * // Create a "Hollow Sphere"
 * const hollow = new CompositeShape('difference', [sphere, box]);
 * const p = hollow.sample();
 */
export class CompositeShape {
  /**
   * @param {'union'|'intersection'|'difference'|'faulty_union'} type - Operation type
   * @param {Array<Object>} shapes - Array of shape instances
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxAttempts=1000] - Rejection sampling limit
   */
  constructor(type, shapes, options = {}) {
    this.type = type;
    this.shapes = shapes;
    this.maxAttempts = options.maxAttempts ?? 1000;

    // Standard properties for interface compatibility
    this.bbox = this._calculateBBox();
    
    // For weighting in higher-level unions
    this.volume = this._calculateVolume();
    this.area = this.volume; 
  }

  /**
   * Check if a point is inside the composite volume
   * @param {{x: number, y: number, z: number}} p 
   * @param {number} [epsilon=1e-9] 
   * @returns {boolean}
   */
  contains(p, epsilon = 1e-9) {
    switch (this.type) {
      case 'union':
      case 'faulty_union':
        return this.shapes.some(s => s.contains(p, epsilon));
      case 'intersection':
        return this.shapes.every(s => s.contains(p, epsilon));
      case 'difference':
        // Inside A AND NOT inside B
        return this.shapes[0].contains(p, epsilon) && !this.shapes[1].contains(p, epsilon);
      default:
        return false;
    }
  }

  /**
   * Sample a point uniformly inside the composite volume
   * @returns {{x: number, y: number, z: number}}
   */
  sample() {
    switch (this.type) {
      case 'union':
        return sampleUnion(this.shapes, this.maxAttempts);
      case 'faulty_union':
        return sampleFaultyUnion(this.shapes);
      case 'intersection':
        return sampleIntersection(this.shapes, this.maxAttempts);
      case 'difference':
        return sampleDifference(this.shapes[0], this.shapes[1], this.maxAttempts);
    }
  }

  /** @private */
  _calculateBBox() {
    const shapes = this.shapes;
    if (this.type === 'intersection') {
      return shapes.reduce((acc, s) => ({
        minX: Math.max(acc.minX, s.bbox.minX), maxX: Math.min(acc.maxX, s.bbox.maxX),
        minY: Math.max(acc.minY, s.bbox.minY), maxY: Math.min(acc.maxY, s.bbox.maxY),
        minZ: Math.max(acc.minZ ?? 0, s.bbox.minZ ?? 0), maxZ: Math.min(acc.maxZ ?? 0, s.bbox.maxZ ?? 0)
      }), shapes[0].bbox);
    }
    // For Union/Difference, the BBox is the bounding box of the primary/all shapes
    return shapes.reduce((acc, s) => ({
      minX: Math.min(acc.minX, s.bbox.minX), maxX: Math.max(acc.maxX, s.bbox.maxX),
      minY: Math.min(acc.minY, s.bbox.minY), maxY: Math.max(acc.maxY, s.bbox.maxY),
      minZ: Math.min(acc.minZ ?? 0, s.bbox.minZ ?? 0), maxZ: Math.max(acc.maxZ ?? 0, s.bbox.maxZ ?? 0)
    }), shapes[0].bbox);
  }

  /** @private */
  _calculateVolume() {
    // Difference volume is roughly A - B (simplified)
    if (this.type === 'difference') return Math.max(0, (this.shapes[0].volume || 0) - (this.shapes[1].volume || 0));
    // Union/Faulty volume is sum of parts
    return this.shapes.reduce((sum, s) => sum + (s.volume ?? s.area ?? 0), 0);
  }
}


/**
 * Sample a point from the union of multiple shapes.
 * Each shape must have:
 * - sample(): returns a uniformly sampled point
 * - contains(): 
 * - area or volume: numeric measure (for weighting)
 * 
 * @param {Array<{sample: Function, area?: number, volume?: number}>} shapes
 * @returns {{x: number, y: number, z: number}}
 */
export function sampleUnion(shapes, maxAttempts = 100) {
  const weights = shapes.map(s => s.area ?? s.volume ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let r = Math.random() * totalWeight;
    let selectedIdx = 0;
    for (let i = 0; i < shapes.length; i++) {
      if ((r -= weights[i]) <= 0) {
        selectedIdx = i;
        break;
      }
    }

    const point = shapes[selectedIdx].sample();

    let alreadyCovered = false;
    for (let j = 0; j < selectedIdx; j++) {
      if (shapes[j].contains(point)) {
        alreadyCovered = true;
        break;
      }
    }

    if (!alreadyCovered) return point;
  }
  
  // Fallback: If rejection fails too many times, return the last sampled point 
  // (prevents infinite loops in highly overlapping clusters)
  return shapes[0].sample();
}


/**
 * Sample a point from the intersection of multiple shapes using rejection sampling.
 * Each shape must provide:
 * - contains(point): returns true/false
 * 
 * @param {Array<{contains: Function}>} shapes - Shapes to intersect
 * @param {{minX: number, maxX: number, minY: number, maxY: number, minZ?: number, maxZ?: number}} bbox - bounding box of intersection
 * @param {number} [maxAttempts=1000] - Maximum number of sampling attempts
 * @returns {{x: number, y: number, z: number}}
 * @throws {Error} If no point found in maxAttempts
 */
export function sampleIntersection(shapes, maxAttempts = 1000) {
  // Level up: Automatically calculate the intersection of all bounding boxes
  const intersectBBox = shapes.reduce((acc, shape) => {
    const b = shape.bbox;
    return {
      minX: Math.max(acc.minX, b.minX), maxX: Math.min(acc.maxX, b.maxX),
      minY: Math.max(acc.minY, b.minY), maxY: Math.min(acc.maxY, b.maxY),
      minZ: Math.max(acc.minZ ?? 0, b.minZ ?? 0), maxZ: Math.min(acc.maxZ ?? 0, b.maxZ ?? 0)
    };
  }, shapes[0].bbox);

  // If the bounding boxes don't even touch, the intersection is empty
  if (intersectBBox.minX > intersectBBox.maxX || intersectBBox.minY > intersectBBox.maxY) {
    throw new Error("Shapes do not intersect (Bounding boxes are disjoint)");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const p = {
      x: intersectBBox.minX + Math.random() * (intersectBBox.maxX - intersectBBox.minX),
      y: intersectBBox.minY + Math.random() * (intersectBBox.maxY - intersectBBox.minY),
      z: (intersectBBox.maxZ === intersectBBox.minZ) ? 0 : 
          intersectBBox.minZ + Math.random() * (intersectBBox.maxZ - intersectBBox.minZ)
    };

    if (shapes.every(s => s.contains(p))) return p;
  }

  throw new Error(`Intersection sampling failed after ${maxAttempts} attempts`);
}


/**
 * Sample a point from the difference of two shapes: A \ B.
 * That is, pick a point inside shapeA that is NOT inside shapeB.
 * Uses rejection sampling within the bounding box of shapeA.
 * 
 * Each shape must provide:
 * - contains(point): returns true/false
 * 
 * @param {{contains: Function, bbox: {minX: number, maxX: number, minY: number, maxY: number, minZ?: number, maxZ?: number}}} shapeA - The base shape
 * @param {{contains: Function}} shapeB - The shape to subtract
 * @param {number} [maxAttempts=1000] - Maximum number of attempts
 * @returns {{x: number, y: number, z: number}}
 * @throws {Error} If no point found after maxAttempts
 */
export function sampleDifference(shapeA, shapeB, maxAttempts = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const p = shapeA.sample(); // Efficient: only sample from the source shape
    if (!shapeB.contains(p)) return p;
  }
  throw new Error(`Difference sampling failed after ${maxAttempts} attempts`);
}


/**
 * Sample a point from the union without checking for overlaps.
 * Resulting density will be higher in overlapping regions.
 * @param {Array<Object>} shapes 
 */
export function sampleFaultyUnion(shapes) {
  const weights = shapes.map(s => s.area ?? s.volume ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let r = Math.random() * totalWeight;
  for (let i = 0; i < shapes.length; i++) {
    if ((r -= weights[i]) <= 0) {
      return shapes[i].sample();
    }
  }
  return shapes[shapes.length - 1].sample();
}