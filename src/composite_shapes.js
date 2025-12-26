/**
 * composite_shapes.js
 * Boolean operations for 2D and 3D geometric sampling.
 */

export class CompositeShape {
  constructor(type, shapes, options = {}) {
    this.type = type;
    this.shapes = shapes;
    this.maxAttempts = options.maxAttempts ?? 1000;

    // Standard properties
    this.bbox = this._calculateBBox();

    this.center = {
      x: (this.bbox.minX + this.bbox.maxX) / 2,
      y: (this.bbox.minY + this.bbox.maxY) / 2,
      z: (this.bbox.minZ + this.bbox.maxZ) / 2
    };

    this.volume = this._calculateVolume();
    this.area = this.volume; 
  }

  contains(p, epsilon = 1e-9) {
    switch (this.type) {
      case 'union':
      case 'faulty_union':
        return this.shapes.some(s => s.contains(p, epsilon));
      case 'intersection':
        return this.shapes.every(s => s.contains(p, epsilon));
      case 'difference':
        return this.shapes[0].contains(p, epsilon) && !this.shapes[1].contains(p, epsilon);
      default:
        return false;
    }
  }

  sample() {
    switch (this.type) {
      case 'union':        return sampleUnion(this.shapes, this.maxAttempts);
      case 'faulty_union': return sampleFaultyUnion(this.shapes);
      case 'intersection': return sampleIntersection(this.shapes, this.maxAttempts);
      case 'difference':   return sampleDifference(this.shapes[0], this.shapes[1], this.maxAttempts);
    }
  }

  /** @private */
  _calculateBBox() {
    const shapes = this.shapes;
    if (!shapes.length) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };

    if (this.type === 'difference') return shapes[0].bbox;

    return shapes.reduce((acc, s, idx) => {
      const b = s.bbox;
      const bzMin = b.minZ ?? 0;
      const bzMax = b.maxZ ?? 0;

      if (idx === 0) return { ...b, minZ: bzMin, maxZ: bzMax };

      if (this.type === 'intersection') {
        return {
          minX: Math.max(acc.minX, b.minX), maxX: Math.min(acc.maxX, b.maxX),
          minY: Math.max(acc.minY, b.minY), maxY: Math.min(acc.maxY, b.maxY),
          minZ: Math.max(acc.minZ, bzMin),  maxZ: Math.min(acc.maxZ, bzMax)
        };
      } else {
        return {
          minX: Math.min(acc.minX, b.minX), maxX: Math.max(acc.maxX, b.maxX),
          minY: Math.min(acc.minY, b.minY), maxY: Math.max(acc.maxY, b.maxY),
          minZ: Math.min(acc.minZ, bzMin),  maxZ: Math.max(acc.maxZ, bzMax)
        };
      }
    }, {});
  }

  /** @private Estimation for weight-based sampling */
  _calculateVolume() {
    if (this.type === 'difference') {
      return Math.max(0.001, (this.shapes[0].volume || 1) * 0.7); // Heuristic
    }
    if (this.type === 'intersection') {
      const b = this.bbox;
      return (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ || 1) * 0.5; // Heuristic
    }
    return this.shapes.reduce((sum, s) => sum + (s.volume ?? s.area ?? 0), 0);
  }
}


export function sampleUnion(shapes, maxAttempts = 100) {
  const weights = shapes.map(s => s.area ?? s.volume ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let i = 0; i < shapes.length; i++) {
      if ((r -= weights[i]) <= 0) { idx = i; break; }
    }
    const point = shapes[idx].sample();
    let coveredByPrior = false;
    for (let j = 0; j < idx; j++) {
      if (shapes[j].contains(point)) { coveredByPrior = true; break; }
    }
    if (!coveredByPrior) return point;
  }
  return shapes[0].sample(); 
}

export function sampleIntersection(shapes, maxAttempts = 1000) {
  const bbox = shapes.reduce((acc, s, i) => {
    if (i === 0) return s.bbox;
    return {
      minX: Math.max(acc.minX, s.bbox.minX), maxX: Math.min(acc.maxX, s.bbox.maxX),
      minY: Math.max(acc.minY, s.bbox.minY), maxY: Math.min(acc.maxY, s.bbox.maxY),
      minZ: Math.max(acc.minZ ?? 0, s.bbox.minZ ?? 0), maxZ: Math.min(acc.maxZ ?? 0, s.bbox.maxZ ?? 0)
    };
  }, {});

  if (bbox.minX > bbox.maxX || bbox.minY > bbox.maxY || (bbox.minZ > bbox.maxZ)) {
    throw new Error("Invalid Intersection: Shapes are spatially disjoint (Bounding boxes do not overlap).");
  }

  for (let i = 0; i < maxAttempts; i++) {
    const p = {
      x: bbox.minX + Math.random() * (bbox.maxX - bbox.minX),
      y: bbox.minY + Math.random() * (bbox.maxY - bbox.minY),
      z: bbox.minZ + Math.random() * (bbox.maxZ - bbox.minZ)
    };
    if (shapes.every(s => s.contains(p))) return p;
  }
  
  throw new Error(`Intersection sampling failed: Possible zero-volume intersection or maxAttempts (${maxAttempts}) reached.`);
}

export function sampleDifference(shapeA, shapeB, maxAttempts = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    const p = shapeA.sample();
    if (!shapeB.contains(p)) return p;
  }
  return shapeA.sample(); 
}

export function sampleFaultyUnion(shapes) {
  const weights = shapes.map(s => s.area ?? s.volume ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let s of shapes) {
    if ((r -= (s.area ?? s.volume ?? 1)) <= 0) return s.sample();
  }
  return shapes[0].sample();
}