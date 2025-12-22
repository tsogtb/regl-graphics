/**
 * compositeShapes.js
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
 * Sample a point from the union of multiple shapes.
 * Each shape must have:
 * - sample(): returns a uniformly sampled point
 * - area or volume: numeric measure (for weighting)
 * 
 * @param {Array<{sample: Function, area?: number, volume?: number}>} shapes
 * @returns {{x: number, y: number, z: number}}
 */
export function sampleUnion(shapes) {
  const totalWeight = shapes.reduce((sum, s) => sum + (s.area ?? s.volume ?? 1), 0);
  let r = Math.random() * totalWeight;

  for (const shape of shapes) {
    const weight = shape.area ?? shape.volume ?? 1;
    if ((r -= weight) <= 0) {
      return shape.sample();
    }
  }

  // Fallback for floating-point safety
  return shapes[shapes.length - 1].sample();
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
export function sampleIntersection(shapes, bbox, maxAttempts = 1000) {
  const minZ = bbox.minZ ?? 0;
  const maxZ = bbox.maxZ ?? 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + Math.random() * (bbox.maxY - bbox.minY);
    const z = minZ + Math.random() * (maxZ - minZ);
    const point = { x, y, z };

    if (shapes.every(s => s.contains(point))) {
      return point;
    }
  }

  throw new Error(`Failed to sample a point in the intersection after ${maxAttempts} attempts`);
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
  const bbox = shapeA.bbox; // shapeA must provide its bounding box
  const minZ = bbox.minZ ?? 0;
  const maxZ = bbox.maxZ ?? 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + Math.random() * (bbox.maxY - bbox.minY);
    const z = minZ + Math.random() * (maxZ - minZ);
    const point = { x, y, z };

    if (shapeA.contains(point) && !shapeB.contains(point)) {
      return point;
    }
  }

  throw new Error(`Failed to sample a point in the difference after ${maxAttempts} attempts`);
}


/**
 * Sample a point from the difference of two shapes: A \ B.
 * That is, pick a point inside shapeA that is NOT inside shapeB.
 * Uses rejection sampling within the bounding box of shapeA.
 * 
 * Each shape must provide:
 * - contains(point): returns true/false
 * - bbox: { minX, maxX, minY, maxY, minZ?, maxZ? } for rejection sampling
 * 
 * @param {{contains: Function, bbox: {minX: number, maxX: number, minY: number, maxY: number, minZ?: number, maxZ?: number}}} shapeA - Base shape
 * @param {{contains: Function}} shapeB - Shape to subtract
 * @param {number} [maxAttempts=1000] - Maximum attempts
 * @returns {{x: number, y: number, z: number}}
 * @throws {Error} If no point found after maxAttempts
 */
export function sampleDifference(shapeA, shapeB, maxAttempts = 1000) {
  if (!shapeA.bbox) {
    throw new Error("shapeA must provide a bounding box for rejection sampling");
  }

  const bbox = shapeA.bbox;
  const minZ = bbox.minZ ?? 0;
  const maxZ = bbox.maxZ ?? 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = bbox.minX + Math.random() * (bbox.maxX - bbox.minX);
    const y = bbox.minY + Math.random() * (bbox.maxY - bbox.minY);
    const z = minZ + Math.random() * (maxZ - minZ);
    const point = { x, y, z };

    if (shapeA.contains(point) && !shapeB.contains(point)) {
      return point;
    }
  }

  throw new Error(`Failed to sample a point in the difference after ${maxAttempts} attempts`);
}

