/**
 * shapes2d.js
 * 
 * Uniform sampling of 2D geometric shapes (filled areas) and sectors.
 * All classes provide:
 * - .sample(): returns a single point { x, y, z } sampled uniformly
 * - .contains(point): returns true if the point is inside the shape
 * - .area (where applicable): numeric area, useful for area-weighted sampling
 * 
 * Basic Shapes:
 * - Ellipse2D: filled ellipse
 * - Circle2D: filled circle (special case of ellipse)
 * - Rectangle2D: filled rectangle
 * - Triangle2D: filled triangle
 * - Polygon2D: filled convex polygon
 * 
 * Sector Shapes:
 * - EllipseSector: pie slice of an ellipse
 * - CircleSector: pie slice of a circle (extends EllipseSector)
 * 
 * All shapes and sectors are compatible with union/intersection samplers
 * provided in a separate module compositeShapes.js
 */


/**
 * EllipseSector
 * 
 * Represents a sector (pie slice) of an ellipse.
 * Provides uniform sampling and point containment methods.
 * 
 * @example
 * // Create an ellipse sector centered at (0,0) with radii 3 and 2, from 0 to PI/2
 * const sector = new EllipseSector({ x: 0, y: 0 }, 3, 2, 0, Math.PI / 2);
 * 
 * // Sample a random point inside the sector
 * const p = sector.sample(); // { x: ..., y: ..., z: 0 }
 * 
 * // Check if a point is inside the sector
 * const isInside = sector.contains({ x: 1, y: 1 }); // true or false
 */
export class EllipseSector {
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
    /** Approximate area for weighting (ellipse sector area formula) */
    this.area = 0.5 * rx * ry * (endAngle - startAngle);
  }

  /**
   * Check if a point is inside the ellipse sector.
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if point is inside the sector
   * @example
   * const sector = new EllipseSector({ x:0, y:0 }, 3, 2, 0, Math.PI/2);
   * sector.contains({ x:1, y:1 }); // true or false
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;

    // First check if inside the ellipse
    if ((dx*dx)/(this.rx*this.rx) + (dy*dy)/(this.ry*this.ry) > 1) return false;

    // Check angle
    let theta = Math.atan2(dy, dx);
    if (theta < 0) theta += 2 * Math.PI;
    return theta >= this.start && theta <= this.end;
  }

  /**
   * Sample a point uniformly inside the ellipse sector.
   * @returns {{x: number, y: number, z: number}} Random point in the sector
   * @example
   * const sector = new EllipseSector({ x:0, y:0 }, 3, 2, 0, Math.PI/2);
   * const point = sector.sample(); // { x: ..., y: ..., z: 0 }
   */
  sample() {
    const t = this.start + Math.random() * (this.end - this.start);
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
 * 
 * Represents a filled 2D ellipse and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create an ellipse centered at (0,0) with radii 3 and 2
 * const e = new Ellipse2D({ x: 0, y: 0 }, 3, 2);
 * 
 * // Sample a random point inside the ellipse
 * const p = e.sample(); // { x: ..., y: ..., z: 0 }
 * 
 * // Check if a point is inside the ellipse
 * const isInside = e.contains({ x: 1, y: 1 });
 */
export class Ellipse2D {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates
   * @param {number} [rx=1] - Horizontal radius
   * @param {number} [ry=1] - Vertical radius
   */
  constructor(center, rx = 1, ry = 1) {
    this.center = center;
    this.rx = rx;
    this.ry = ry;
    /** Area of the ellipse (used for weighted sampling in unions) */
    this.area = Math.PI * rx * ry;
  }

  /**
   * Determine whether a point is inside the ellipse.
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if the point is inside the ellipse
   * @example
   * const e = new Ellipse2D({x:0, y:0}, 2, 1);
   * e.contains({x:1, y:0.5}); // true
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    return (dx*dx)/(this.rx*this.rx) + (dy*dy)/(this.ry*this.ry) <= 1;
  }

  /**
   * Sample a point uniformly inside the ellipse.
   * @returns {{x: number, y: number, z: number}} Random point
   * @example
   * const e = new Ellipse2D({x:0, y:0}, 3, 2);
   * const point = e.sample(); // { x: ..., y: ..., z: 0 }
   */
  sample() {
    const t = Math.random() * 2 * Math.PI;
    const u = Math.sqrt(Math.random());
    return {
      x: this.center.x + u * this.rx * Math.cos(t),
      y: this.center.y + u * this.ry * Math.sin(t),
      z: this.center.z ?? 0
    };
  }
}


/**
 * CircleSector
 * 
 * Represents a sector (pie slice) of a circle.
 * Provides uniform sampling and point containment methods.
 * Extends EllipseSector for code reuse.
 * 
 * @example
 * // Create a circle sector centered at (0,0) with radius 2, from 0 to PI/2
 * const sector = new CircleSector({ x: 0, y: 0 }, 2, 0, Math.PI / 2);
 * 
 * // Sample a random point inside the sector
 * const p = sector.sample(); // { x: ..., y: ..., z: 0 }
 * 
 * // Check if a point is inside the sector
 * const isInside = sector.contains({ x: 1, y: 1 }); // true or false
 */
export class CircleSector extends EllipseSector {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates
   * @param {number} [radius=1] - Circle radius
   * @param {number} [startAngle=0] - Start angle in radians
   * @param {number} [endAngle=Math.PI*2] - End angle in radians
   */
  constructor(center, radius = 1, startAngle = 0, endAngle = 2 * Math.PI) {
    // Call parent with rx = ry = radius
    super(center, radius, radius, startAngle, endAngle);
    this.radius = radius;
  }
}


/**
 * Circle2D
 * 
 * Represents a filled 2D circle (special case of ellipse) and provides
 * uniform sampling and point containment methods.
 * 
 * @example
 * // Create a circle centered at (0,0) with radius 2
 * const c = new Circle2D({ x: 0, y: 0 }, 2);
 * 
 * // Sample a random point inside the circle
 * const p = c.sample(); // { x: ..., y: ..., z: 0 }
 * 
 * // Check if a point is inside the circle
 * const isInside = c.contains({ x: 1, y: 1 }); // true or false
 */
export class Circle2D {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates
   * @param {number} [radius=1] - Circle radius
   */
  constructor(center, radius = 1) {
    this.center = center;
    this.radius = radius;
    /** Area of the circle (used for weighted sampling in unions) */
    this.area = Math.PI * radius * radius;
  }

  /**
   * Determine whether a point is inside the circle.
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if the point is inside the circle
   * @example
   * const c = new Circle2D({x:0, y:0}, 2);
   * c.contains({x:1, y:1}); // true
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    return dx*dx + dy*dy <= this.radius*this.radius;
  }

  /**
   * Sample a point uniformly inside the circle.
   * @returns {{x: number, y: number, z: number}} Random point
   * @example
   * const c = new Circle2D({x:0, y:0}, 2);
   * const point = c.sample(); // { x: ..., y: ..., z: 0 }
   */
  sample() {
    const t = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * this.radius;
    return {
      x: this.center.x + r * Math.cos(t),
      y: this.center.y + r * Math.sin(t),
      z: this.center.z ?? 0
    };
  }
}


/**
 * Triangle2D
 * 
 * Represents a filled 2D triangle and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * const tri = new Triangle2D(
 *   { x: 0, y: 0 },
 *   { x: 1, y: 0 },
 *   { x: 0, y: 1 }
 * );
 * 
 * const p = tri.sample(); // { x: ..., y: ..., z: 0 }
 * const inside = tri.contains({ x: 0.3, y: 0.3 }); // true
 */
export class Triangle2D {
  /**
   * @param {{x: number, y: number, z?: number}} a - Vertex A
   * @param {{x: number, y: number, z?: number}} b - Vertex B
   * @param {{x: number, y: number, z?: number}} c - Vertex C
   */
  constructor(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;

    // Precompute area for union weighting
    this.area = Math.abs(
      (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
    ) * 0.5;
  }

  /**
   * Determine whether a point is inside the triangle using barycentric coordinates
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if point is inside the triangle
   */
  contains(p) {
    const { a, b, c } = this;
    const detT = (b.y - c.y)*(a.x - c.x) + (c.x - b.x)*(a.y - c.y);
    const l1 = ((b.y - c.y)*(p.x - c.x) + (c.x - b.x)*(p.y - c.y)) / detT;
    const l2 = ((c.y - a.y)*(p.x - c.x) + (a.x - c.x)*(p.y - c.y)) / detT;
    const l3 = 1 - l1 - l2;
    return l1 >= 0 && l2 >= 0 && l3 >= 0;
  }

  /**
   * Sample a point uniformly inside the triangle using barycentric coordinates
   * @returns {{x: number, y: number, z: number}} Random point
   * @example
   * const tri = new Triangle2D({x:0,y:0},{x:1,y:0},{x:0,y:1});
   * const p = tri.sample(); // { x: ..., y: ..., z: 0 }
   */
  sample() {
    let u = Math.random();
    let v = Math.random();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    return {
      x: this.a.x + u * (this.b.x - this.a.x) + v * (this.c.x - this.a.x),
      y: this.a.y + u * (this.b.y - this.a.y) + v * (this.c.y - this.a.y),
      z: this.a.z ?? 0
    };
  }
}


/**
 * Rectangle2D
 * 
 * Represents a filled 2D rectangle and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create a rectangle centered at (0,0) with width 4 and height 2
 * const rect = new Rectangle2D({ x: 0, y: 0 }, 4, 2);
 * 
 * // Sample a random point inside the rectangle
 * const p = rect.sample(); // { x: ..., y: ..., z: 0 }
 * 
 * // Check if a point is inside the rectangle
 * const isInside = rect.contains({ x: 1, y: 0.5 }); // true
 */
export class Rectangle2D {
  /**
   * @param {{x: number, y: number, z?: number}} center - Center coordinates
   * @param {number} [width=1] - Rectangle width
   * @param {number} [height=1] - Rectangle height
   */
  constructor(center, width = 1, height = 1) {
    this.center = center;
    this.width = width;
    this.height = height;
    /** Area of the rectangle (used for weighted sampling in unions) */
    this.area = width * height;
  }

  /**
   * Determine whether a point is inside the rectangle.
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if the point is inside the rectangle
   * @example
   * const rect = new Rectangle2D({x:0, y:0}, 4, 2);
   * rect.contains({x:1, y:0.5}); // true
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    return Math.abs(dx) <= this.width / 2 && Math.abs(dy) <= this.height / 2;
  }

  /**
   * Sample a point uniformly inside the rectangle.
   * @returns {{x: number, y: number, z: number}} Random point
   * @example
   * const rect = new Rectangle2D({x:0, y:0}, 4, 2);
   * const point = rect.sample(); // { x: ..., y: ..., z: 0 }
   */
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
 * 
 * Represents a filled convex 2D polygon and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * const poly = new Polygon2D([
 *   { x: 0, y: 0 },
 *   { x: 1, y: 0 },
 *   { x: 0.5, y: 1 }
 * ]);
 * 
 * const p = poly.sample(); // { x: ..., y: ..., z: 0 }
 * const inside = poly.contains({ x: 0.5, y: 0.3 }); // true
 */
export class Polygon2D {
  /**
   * @param {Array<{x: number, y: number, z?: number}>} vertices - Ordered vertices (CCW or CW)
   */
  constructor(vertices) {
    if (!vertices || vertices.length < 3) {
      throw new Error("Polygon needs at least 3 vertices");
    }
    this.vertices = vertices;

    // Fan triangulation
    this.triangles = [];
    this.totalArea = 0;
    const v0 = vertices[0];
    for (let i = 1; i < vertices.length - 1; i++) {
      const a = v0, b = vertices[i], c = vertices[i + 1];
      const area = Polygon2D.triangleArea(a, b, c);
      this.totalArea += area;
      this.triangles.push({ a, b, c, area });
    }
  }

  /**
   * Determine whether a point is inside the polygon (ray-casting method)
   * @param {{x: number, y: number, z?: number}} p - Point to test
   * @returns {boolean} True if point is inside the polygon
   */
  contains(p) {
    let inside = false;
    const n = this.vertices.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.vertices[i].x, yi = this.vertices[i].y;
      const xj = this.vertices[j].x, yj = this.vertices[j].y;
      const intersect = ((yi > p.y) !== (yj > p.y)) &&
                        (p.x < (xj - xi) * (p.y - yi) / (yj - yi + 0.00000001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Sample a point uniformly inside the polygon using area-weighted triangle selection
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    let r = Math.random() * this.totalArea;
    for (const t of this.triangles) {
      if ((r -= t.area) <= 0) {
        // Use barycentric sampling inside selected triangle
        let u = Math.random();
        let v = Math.random();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        return {
          x: t.a.x + u * (t.b.x - t.a.x) + v * (t.c.x - t.a.x),
          y: t.a.y + u * (t.b.y - t.a.y) + v * (t.c.y - t.a.y),
          z: t.a.z ?? 0
        };
      }
    }
    // Fallback
    const t = this.triangles[this.triangles.length - 1];
    return {
      x: t.a.x + Math.random() * (t.b.x - t.a.x) + Math.random() * (t.c.x - t.a.x),
      y: t.a.y + Math.random() * (t.b.y - t.a.y) + Math.random() * (t.c.y - t.a.y),
      z: t.a.z ?? 0
    };
  }

  /**
   * Compute the area of a triangle
   * @private
   */
  static triangleArea(a, b, c) {
    return Math.abs((b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)) * 0.5;
  }
}
