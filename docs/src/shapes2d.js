/**
 * EllipseSector2D
 * The base class for all elliptical and circular shapes.
 */
export class EllipseSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates.
   * @param {number} [outerRx=1] - Outer horizontal radius.
   * @param {number} [outerRy=1] - Outer vertical radius.
   * @param {number} [startAngle=0] - Start angle in radians.
   * @param {number} [endAngle=Math.PI*2] - End angle in radians.
   * @param {number} [innerRx=0] - Inner horizontal radius for hollow shapes.
   * @param {number} [innerRy=0] - Inner vertical radius for hollow shapes.
   */
  constructor(center, outerRx = 1, outerRy = 1, startAngle = 0, endAngle = 2 * Math.PI, innerRx = 0, innerRy = 0) {
    this.center = center;
    this.outerRx = outerRx;
    this.outerRy = outerRy;
    this.innerRx = innerRx;
    this.innerRy = innerRy;
    this.start = startAngle;
    this.end = endAngle;

    let deltaTheta = endAngle - startAngle;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    this.deltaTheta = deltaTheta;

    const outerArea = 0.5 * outerRx * outerRy * deltaTheta;
    const innerArea = 0.5 * innerRx * innerRy * deltaTheta;
    this.area = outerArea - innerArea;

    this.bbox = {
      minX: center.x - outerRx, maxX: center.x + outerRx,
      minY: center.y - outerRy, maxY: center.y + outerRy
    };
  }

  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    
    // Standard elliptical distance check
    const distSq = (dx * dx) / (this.outerRx * this.outerRx) + (dy * dy) / (this.outerRy * this.outerRy);
    const innerDistSq = (this.innerRx <= 0 || this.innerRy <= 0) 
      ? 0 
      : (dx * dx) / (this.innerRx * this.innerRx) + (dy * dy) / (this.innerRy * this.innerRy);

    if (distSq > 1 + epsilon || (this.innerRx > 0 && innerDistSq < 1 - epsilon)) return false;

    let theta = Math.atan2(dy / this.outerRy, dx / this.outerRx); 
    if (theta < 0) theta += 2 * Math.PI;

    if (this.start <= this.end) {
      return theta >= (this.start - epsilon) && theta <= (this.end + epsilon);
    } else {
      return theta >= (this.start - epsilon) || theta <= (this.end + epsilon);
    }
  }

  sample() {
    const t = (this.start + Math.random() * this.deltaTheta) % (2 * Math.PI);
    const rScaling = Math.sqrt(Math.random() * (1 - Math.pow(this.innerRx/this.outerRx, 2)) + Math.pow(this.innerRx/this.outerRx, 2));

    return {
      x: this.center.x + rScaling * this.outerRx * Math.cos(t),
      y: this.center.y + rScaling * this.outerRy * Math.sin(t),
      z: this.center.z ?? 0
    };
  }
}

/**
 * CircleSector2D
 * Optimized: Uses circular radius math instead of elliptical division.
 */
export class CircleSector2D extends EllipseSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center
   * @param {number} [radius=1]
   * @param {number} [startAngle=0]
   * @param {number} [endAngle=Math.PI*2]
   * @param {number} [innerRadius=0]
   */
  constructor(center, radius = 1, startAngle = 0, endAngle = 2 * Math.PI, innerRadius = 0) {
    super(center, radius, radius, startAngle, endAngle, innerRadius, innerRadius);
    this.radius = radius;
    this.innerRadius = innerRadius;
    this.rOuterSq = radius * radius;
    this.rInnerSq = innerRadius * innerRadius;
  }

  // OVERRIDE: Faster circular distance check (x² + y² < r²)
  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const d2 = dx * dx + dy * dy;

    if (d2 > this.rOuterSq + epsilon || d2 < this.rInnerSq - epsilon) return false;

    let theta = Math.atan2(dy, dx); 
    if (theta < 0) theta += 2 * Math.PI;

    if (this.start <= this.end) {
      return theta >= (this.start - epsilon) && theta <= (this.end + epsilon);
    } else {
      return theta >= (this.start - epsilon) || theta <= (this.end + epsilon);
    }
  }
}

/**
 * Circle2D
 * Optimized: Skips all angular and trigonometric logic.
 */
export class Circle2D extends CircleSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center
   * @param {number} [radius=1]
   * @param {number} [innerRadius=0]
   */
  constructor(center, radius = 1, innerRadius = 0) {
    super(center, radius, 0, 2 * Math.PI, innerRadius);
  }

  // OVERRIDE: Pure radial check; ignores theta entirely
  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const d2 = dx * dx + dy * dy;
    return d2 <= this.rOuterSq + epsilon && d2 >= this.rInnerSq - epsilon;
  }

  // OVERRIDE: Simplest uniform circle sampling
  sample() {
    const t = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random() * (this.rOuterSq - this.rInnerSq) + this.rInnerSq);
    return {
      x: this.center.x + r * Math.cos(t),
      y: this.center.y + r * Math.sin(t),
      z: this.center.z ?? 0
    };
  }
}

/**
 * Ellipse2D
 * Optimized: Removes angular sector checks.
 */
export class Ellipse2D extends EllipseSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center
   * @param {number} [rx=1]
   * @param {number} [ry=1]
   * @param {number} [innerRx=0]
   * @param {number} [innerRy=0]
   */
  constructor(center, rx = 1, ry = 1, innerRx = 0, innerRy = 0) {
    super(center, rx, ry, 0, 2 * Math.PI, innerRx, innerRy);
  }

  // OVERRIDE: Elliptical check without sector logic
  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const distSq = (dx * dx) / (this.outerRx * this.outerRx) + (dy * dy) / (this.outerRy * this.outerRy);
    
    if (this.innerRx > 0) {
      const innerDistSq = (dx * dx) / (this.innerRx * this.innerRx) + (dy * dy) / (this.innerRy * this.innerRy);
      return distSq <= 1 + epsilon && innerDistSq >= 1 - epsilon;
    }
    return distSq <= 1 + epsilon;
  }
}

/**
 * Triangle2D
 * Represents a filled triangle.
 */
export class Triangle2D {
  /**
   * @param {{x: number, y: number, z?: number}} a - Vertex A
   * @param {{x: number, y: number, z?: number}} b - Vertex B
   * @param {{x: number, y: number, z?: number}} c - Vertex C
   */
  constructor(a, b, c) {
    this.a = a; this.b = b; this.c = c;
    this.area = Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) * 0.5;
    this.bbox = {
      minX: Math.min(a.x, b.x, c.x), maxX: Math.max(a.x, b.x, c.x),
      minY: Math.min(a.y, b.y, c.y), maxY: Math.max(a.y, b.y, c.y)
    };
  }

  contains(p, epsilon = 1e-9) {
    const { a, b, c } = this;
    const detT = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(detT) < 1e-15) return false;
    // Barycentric coordinates
    const l1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / detT;
    const l2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / detT;
    const l3 = 1 - l1 - l2;
    return l1 >= -epsilon && l2 >= -epsilon && l3 >= -epsilon;
  }

  sample() {
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    return {
      x: this.a.x + u * (this.b.x - this.a.x) + v * (this.c.x - this.a.x),
      y: this.a.y + u * (this.b.y - this.a.y) + v * (this.c.y - this.a.y),
      z: this.a.z ?? 0
    };
  }
}

/**
 * Rectangle2D
 * Represents a filled rectangle.
 */
export class Rectangle2D {
  /**
   * @param {{x: number, y: number, z?: number}} center
   * @param {number} [width=1]
   * @param {number} [height=1]
   */
  constructor(center, width = 1, height = 1) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.area = width * height;
    this.bbox = {
      minX: center.x - width / 2, maxX: center.x + width / 2,
      minY: center.y - height / 2, maxY: center.y + height / 2
    };
  }

  contains(p, epsilon = 1e-9) {
    return Math.abs(p.x - this.center.x) <= (this.width / 2) + epsilon && 
           Math.abs(p.y - this.center.y) <= (this.height / 2) + epsilon;
  }

  sample() {
    return {
      x: this.center.x + (Math.random() - 0.5) * this.width,
      y: this.center.y + (Math.random() - 0.5) * this.height,
      z: this.center.z ?? 0
    };
  }
}

/**
 * Polygon2D
 * Handles convex and concave polygons via Ear Clipping.
 * Optimized O(log N) sampling via Prefix Sums + Binary Search.
 */
export class Polygon2D {
  /**
   * @param {Array<{x: number, y: number, z?: number}>} vertices - Ordered points.
   */
  constructor(vertices) {
    if (!vertices || vertices.length < 3) throw new Error("Polygon needs >= 3 vertices");
    this.vertices = vertices;
    this.triangles = [];
    this.area = 0;
    
    // 1. Generate internal mesh
    this.triangulate(vertices);
    
    // 2. Setup area-weighted distribution
    let currentTotalArea = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of this.triangles) {
      currentTotalArea += t.area;
      t.cumulativeArea = currentTotalArea;
    }
    this.area = currentTotalArea;

    // 3. Setup spatial bounds
    for (const v of vertices) {
      minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
    }
    this.bbox = { minX, maxX, minY, maxY };
  }

  /**
   * Samples a point from the polygon by picking a triangle (Binary Search)
   * and then picking a point within that triangle.
   */
  sample() {
    const r = Math.random() * this.area;
    let low = 0, high = this.triangles.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.triangles[mid].cumulativeArea < r) low = mid + 1;
      else high = mid;
    }
    return this.triangles[low].sample();
  }

  /**
   * Implementation of the Ear Clipping algorithm for triangulation.
   * @private
   */
  triangulate(vertices) {
    const pts = [...vertices];
    if (this.getSignedArea(pts) < 0) pts.reverse(); // Ensure CCW
    while (pts.length > 3) {
      let earFound = false;
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[(i + pts.length - 1) % pts.length];
        const curr = pts[i];
        const next = pts[(i + 1) % pts.length];
        if (this.isEar(prev, curr, next, pts)) {
          this.triangles.push(new Triangle2D(prev, curr, next));
          pts.splice(i, 1);
          earFound = true;
          break;
        }
      }
      if (!earFound) break; 
    }
    if (pts.length === 3) this.triangles.push(new Triangle2D(pts[0], pts[1], pts[2]));
  }

  /** @private */
  isEar(p1, p2, p3, allPoints) {
    const area = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    if (area <= 0) return false;
    const tempTri = new Triangle2D(p1, p2, p3);
    for (const p of allPoints) {
      if (p === p1 || p === p2 || p === p3) continue;
      if (tempTri.contains(p)) return false;
    }
    return true;
  }

  /** @private */
  getSignedArea(pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
    }
    return area / 2;
  }

  contains(p, epsilon = 1e-9) {
    if (p.x < this.bbox.minX - epsilon || p.x > this.bbox.maxX + epsilon || 
        p.y < this.bbox.minY - epsilon || p.y > this.bbox.maxY + epsilon) return false;
    return this.triangles.some(t => t.contains(p, epsilon));
  }
}