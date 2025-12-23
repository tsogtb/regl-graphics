/**
 * shapes2d.js
 * * Uniform sampling of 2D geometric shapes (filled areas) and sectors.
 * All classes provide:
 * - .sample(): returns a single point { x, y, z } sampled uniformly
 * - .contains(point): returns true if the point is inside the shape
 * - .area: numeric area, used for area-weighted sampling in composite shapes
 * - .bbox: bounding box for fast collision pre-filtering
 */

/**
 * EllipseSector2D
 * * Represents a sector (pie slice) of an ellipse.
 * Provides uniform sampling and point containment methods.
 * * @example
 * const sector = new EllipseSector2D({ x: 0, y: 0 }, 3, 2, 0, Math.PI / 2);
 * const p = sector.sample();
 */
export class EllipseSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates
   * @param {number} [rx=1] - Horizontal radius
   * @param {number} [ry=1] - Vertical radius
   * @param {number} [startAngle=0] - Start angle in radians
   * @param {number} [endAngle=Math.PI*2] - End angle in radians
   */
  constructor(center, rx = 1, ry = 1, startAngle = 0, endAngle = 2 * Math.PI) {
    this.center = center;
    this.rx = rx;
    this.ry = ry;
    this.start = startAngle;
    this.end = endAngle;

    let deltaTheta = endAngle - startAngle;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    
    /** Area of the ellipse sector */
    this.area = 0.5 * rx * ry * deltaTheta;

    this.bbox = {
      minX: center.x - rx, maxX: center.x + rx,
      minY: center.y - ry, maxY: center.y + ry
    };
  }

  /**
   * Check if a point is inside the ellipse sector.
   * @param {{x: number, y: number}} p - Point to test
   * @param {number} [epsilon=1e-9] - Precision tolerance
   * @returns {boolean}
   */
  contains(p, epsilon = 1e-9) {
    const dx = (p.x - this.center.x) / this.rx;
    const dy = (p.y - this.center.y) / this.ry;
    if (dx * dx + dy * dy > 1 + epsilon) return false;

    let theta = Math.atan2(dy * this.rx, dx * this.ry); 
    if (theta < 0) theta += 2 * Math.PI;

    if (this.start <= this.end) {
      return theta >= (this.start - epsilon) && theta <= (this.end + epsilon);
    } else {
      return theta >= (this.start - epsilon) || theta <= (this.end + epsilon);
    }
  }

  /**
   * Sample a point uniformly inside the ellipse sector.
   * @returns {{x: number, y: number, z: number}}
   */
  sample() {
    let deltaTheta = this.end - this.start;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
  
    const t = (this.start + Math.random() * deltaTheta) % (2 * Math.PI);
    const u = Math.sqrt(Math.random());
    return {
      x: this.center.x + u * this.rx * Math.cos(t),
      y: this.center.y + u * this.ry * Math.sin(t),
      z: this.center.z ?? 0
    };
  }
}



/**
 * Ellipse2D
 * Represents a filled 2D ellipse.
 */
export class Ellipse2D extends EllipseSector2D {
  /**
   * @param {{x: number, y: number, z?: number}} center
   * @param {number} [rx=1]
   * @param {number} [ry=1]
   */
  constructor(center, rx = 1, ry = 1) {
    super(center, rx, ry, 0, 2 * Math.PI);
  }
}

/**
 * CircleSector2D
 * Represents a pie slice of a circle.
 */
export class CircleSector2D extends EllipseSector2D {
  constructor(center, radius = 1, startAngle = 0, endAngle = 2 * Math.PI) {
    super(center, radius, radius, startAngle, endAngle);
    this.radius = radius;
  }
}

/**
 * Circle2D
 * Represents a filled 2D circle.
 */
export class Circle2D extends CircleSector2D {
  constructor(center, radius = 1) {
    super(center, radius, 0, 2 * Math.PI);
  }
}



/**
 * Triangle2D
 * Represents a filled 2D triangle.
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
    
    const l1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / detT;
    const l2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / detT;
    const l3 = 1 - l1 - l2;
    return l1 >= -epsilon && l2 >= -epsilon && l3 >= -epsilon;
  }

  sample() {
    let u = Math.random();
    let v = Math.random();
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
 * Represents a filled 2D rectangle.
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
    const dx = Math.abs(p.x - this.center.x);
    const dy = Math.abs(p.y - this.center.y);
    return dx <= (this.width / 2) + epsilon && dy <= (this.height / 2) + epsilon;
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
 * Represents a filled convex 2D polygon.
 */
export class Polygon2D {
  /**
   * @param {Array<{x: number, y: number, z?: number}>} vertices - Ordered vertices
   */
  constructor(vertices) {
    if (!vertices || vertices.length < 3) throw new Error("Polygon needs >= 3 vertices");
    this.vertices = vertices;
    this.triangles = [];
    this.area = 0;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Fan triangulation (assumes convexity)
    for (let i = 1; i < vertices.length - 1; i++) {
      const t = new Triangle2D(vertices[0], vertices[i], vertices[i + 1]);
      this.triangles.push(t);
      this.area += t.area;
    }

    for (const v of vertices) {
      if (v.x < minX) minX = v.x; if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y; if (v.y > maxY) maxY = v.y;
    }
    this.bbox = { minX, maxX, minY, maxY };
  }

  contains(p, epsilon = 1e-9) {
    if (p.x < this.bbox.minX - epsilon || p.x > this.bbox.maxX + epsilon || 
        p.y < this.bbox.minY - epsilon || p.y > this.bbox.maxY + epsilon) {
      return false;
    }
    return this.triangles.some(t => t.contains(p, epsilon));
  }

  sample() {
    let r = Math.random() * this.area;
    for (const t of this.triangles) {
      if (r <= t.area) return t.sample();
      r -= t.area;
    }
    return this.triangles[this.triangles.length - 1].sample();
  }
}