/**
 * shapes3d.js
 * 
 * Uniform sampling of 3D geometric volumes and sectors.
 * All classes provide:
 * - .sample(): returns a single point { x, y, z } sampled uniformly
 * - .contains(point): returns true if the point is inside the volume
 * - .volume (where applicable): numeric volume, useful for volume-weighted sampling
 * 
 * Basic Volumes:
 * - Ellipsoid3D: general ellipsoid
 * - Sphere: special case of ellipsoid
 * - Box: rectangular prism
 * - Cube: special case of box
 * - Cylinder: vertical cylinder
 * - Cone: vertical cone
 * 
 * Sector Volumes:
 * - EllipsoidSector3D: wedge of an ellipsoid
 * - SphereSector3D: wedge of a sphere (extends EllipsoidSector3D)
 * 
 * All volumes and sectors are compatible with union/intersection samplers
 * provided in a separate module compositeVolumes.js
 */


/**
 * EllipsoidSector3D
 * 
 * Represents a sector (partial wedge) of a 3D ellipsoid.
 * Provides uniform sampling and point containment methods.
 * 
 * @example
 * // Create an ellipsoidal sector centered at (0,0,0) with radii 3,2,1
 * // azimuth from 0 to PI/2, polar from 0 to PI/3
 * const sector = new EllipsoidSector3D(
 *   { x: 0, y: 0, z: 0 },
 *   3, 2, 1,
 *   0, Math.PI/2,   // azimuth θ
 *   0, Math.PI/3    // polar φ
 * );
 * 
 * const p = sector.sample(); // { x: ..., y: ..., z: ... }
 * const inside = sector.contains({ x: 1, y: 1, z: 0.5 }); // true or false
 */
export class EllipsoidSector3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [rx=1] - Radius along X
   * @param {number} [ry=1] - Radius along Y
   * @param {number} [rz=1] - Radius along Z
   * @param {number} [startTheta=0] - Azimuth start angle (around Z axis)
   * @param {number} [endTheta=2*Math.PI] - Azimuth end angle
   * @param {number} [startPhi=0] - Polar start angle (from Z axis)
   * @param {number} [endPhi=Math.PI] - Polar end angle
   */
  constructor(center, rx = 1, ry = 1, rz = 1, startTheta = 0, endTheta = 2*Math.PI, startPhi = 0, endPhi = Math.PI) {
    this.center = center;
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.startPhi = startPhi;
    this.endPhi = endPhi;

    // Fraction of total solid angle for volume weighting
    this.solidAngleFraction = (endTheta - startTheta) * (Math.cos(startPhi) - Math.cos(endPhi)) / (4 * Math.PI);
    this.volume = this.solidAngleFraction * (4/3) * Math.PI * rx * ry * rz;
  }

  /**
   * Check if a point is inside the ellipsoidal sector
   * @param {{x: number, y: number, z: number}} p 
   * @returns {boolean}
   */
  contains(p) {
    const dx = (p.x - this.center.x) / this.rx;
    const dy = (p.y - this.center.y) / this.ry;
    const dz = (p.z - this.center.z) / this.rz;

    if (dx*dx + dy*dy + dz*dz > 1) return false;

    const theta = Math.atan2(dy, dx) < 0 ? Math.atan2(dy, dx) + 2*Math.PI : Math.atan2(dy, dx);
    const phi = Math.acos(dz / Math.sqrt(dx*dx + dy*dy + dz*dz));

    return theta >= this.startTheta && theta <= this.endTheta &&
           phi >= this.startPhi && phi <= this.endPhi;
  }

  /**
   * Sample a point uniformly inside the ellipsoidal sector
   * @returns {{x: number, y: number, z: number}}
   */
  sample() {
    let u, v, w;
    // Sample in unit sphere using rejection method
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      w = Math.random() * 2 - 1;
    } while (u*u + v*v + w*w > 1);

    // Convert to spherical coordinates
    let r = Math.cbrt(u*u + v*v + w*w); // cube root for uniform volume
    let theta = Math.random() * (this.endTheta - this.startTheta) + this.startTheta;
    let phi = Math.acos(Math.random() * (Math.cos(this.startPhi) - Math.cos(this.endPhi)) + Math.cos(this.endPhi));

    // Convert spherical to cartesian on ellipsoid
    const sinPhi = Math.sin(phi);
    return {
      x: this.center.x + this.rx * r * sinPhi * Math.cos(theta),
      y: this.center.y + this.ry * r * sinPhi * Math.sin(theta),
      z: this.center.z + this.rz * r * Math.cos(phi)
    };
  }
}


/**
 * Ellipsoid3D
 * 
 * Represents a filled 3D ellipsoid and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create an ellipsoid centered at (0,0,0) with radii 3, 2, 1
 * const e = new Ellipsoid3D({ x: 0, y: 0, z: 0 }, 3, 2, 1);
 * 
 * // Sample a random point inside the ellipsoid
 * const p = e.sample(); // { x: ..., y: ..., z: ... }
 * 
 * // Check if a point is inside the ellipsoid
 * const isInside = e.contains({ x: 1, y: 1, z: 0.5 }); // true or false
 */
export class Ellipsoid3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [rx=1] - Radius along X
   * @param {number} [ry=1] - Radius along Y
   * @param {number} [rz=1] - Radius along Z
   */
  constructor(center, rx = 1, ry = 1, rz = 1) {
    this.center = center;
    this.rx = rx;
    this.ry = ry;
    this.rz = rz;
    /** Volume of the ellipsoid (used for weighted sampling in unions) */
    this.volume = (4 / 3) * Math.PI * rx * ry * rz;
  }

  /**
   * Determine whether a point is inside the ellipsoid
   * @param {{x: number, y: number, z: number}} p - Point to test
   * @returns {boolean} True if point is inside
   */
  contains(p) {
    const dx = (p.x - this.center.x) / this.rx;
    const dy = (p.y - this.center.y) / this.ry;
    const dz = (p.z - this.center.z) / this.rz;
    return dx*dx + dy*dy + dz*dz <= 1;
  }

  /**
   * Sample a point uniformly inside the ellipsoid
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    let x, y, z;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x*x + y*y + z*z > 1);

    return {
      x: this.center.x + x * this.rx,
      y: this.center.y + y * this.ry,
      z: this.center.z + z * this.rz
    };
  }
}


/**
 * SphereSector3D
 * 
 * Represents a sector (wedge) of a sphere.
 * Provides uniform sampling and point containment methods.
 * Extends EllipsoidSector3D for code reuse.
 * 
 * @example
 * // Create a spherical sector centered at (0,0,0) with radius 2
 * // azimuth 0 to PI/2, polar 0 to PI/3
 * const sector = new SphereSector3D(
 *   { x: 0, y: 0, z: 0 },
 *   2,
 *   0, Math.PI/2,    // azimuth θ
 *   0, Math.PI/3     // polar φ
 * );
 * 
 * const p = sector.sample(); // { x: ..., y: ..., z: ... }
 * const inside = sector.contains({ x: 1, y: 1, z: 0.5 }); // true or false
 */
export class SphereSector3D extends EllipsoidSector3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [radius=1] - Sphere radius
   * @param {number} [startTheta=0] - Azimuth start angle (around Z axis)
   * @param {number} [endTheta=2*Math.PI] - Azimuth end angle
   * @param {number} [startPhi=0] - Polar start angle (from Z axis)
   * @param {number} [endPhi=Math.PI] - Polar end angle
   */
  constructor(center, radius = 1, startTheta = 0, endTheta = 2*Math.PI, startPhi = 0, endPhi = Math.PI) {
    super(center, radius, radius, radius, startTheta, endTheta, startPhi, endPhi);
    this.radius = radius;
  }
}


/**
 * SphereSector3D
 * 
 * Represents a sector (wedge) of a sphere.
 * Provides uniform sampling and point containment methods.
 * Extends EllipsoidSector3D for code reuse.
 * 
 * @example
 * // Create a spherical sector centered at (0,0,0) with radius 2
 * // azimuth 0 to PI/2, polar 0 to PI/3
 * const sector = new SphereSector3D(
 *   { x: 0, y: 0, z: 0 },
 *   2,
 *   0, Math.PI/2,    // azimuth θ
 *   0, Math.PI/3     // polar φ
 * );
 * 
 * const p = sector.sample(); // { x: ..., y: ..., z: ... }
 * const inside = sector.contains({ x: 1, y: 1, z: 0.5 }); // true or false
 */
export class SphereSector3D extends EllipsoidSector3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [radius=1] - Sphere radius
   * @param {number} [startTheta=0] - Azimuth start angle (around Z axis)
   * @param {number} [endTheta=2*Math.PI] - Azimuth end angle
   * @param {number} [startPhi=0] - Polar start angle (from Z axis)
   * @param {number} [endPhi=Math.PI] - Polar end angle
   */
  constructor(center, radius = 1, startTheta = 0, endTheta = 2*Math.PI, startPhi = 0, endPhi = Math.PI) {
    super(center, radius, radius, radius, startTheta, endTheta, startPhi, endPhi);
    this.radius = radius;
  }
}


/**
 * Sphere3D
 * 
 * Represents a filled 3D sphere (special case of ellipsoid) and provides
 * uniform sampling and point containment methods.
 * 
 * @example
 * // Create a sphere centered at (0,0,0) with radius 2
 * const s = new Sphere3D({ x: 0, y: 0, z: 0 }, 2);
 * 
 * // Sample a random point inside the sphere
 * const p = s.sample(); // { x: ..., y: ..., z: ... }
 * 
 * // Check if a point is inside the sphere
 * const isInside = s.contains({ x: 1, y: 1, z: 0.5 }); // true or false
 */
export class Sphere3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [radius=1] - Sphere radius
   */
  constructor(center, radius = 1) {
    this.center = center;
    this.radius = radius;
    /** Volume of the sphere (used for weighted sampling in unions) */
    this.volume = (4 / 3) * Math.PI * radius ** 3;
  }

  /**
   * Determine whether a point is inside the sphere
   * @param {{x: number, y: number, z: number}} p - Point to test
   * @returns {boolean} True if point is inside
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const dz = p.z - this.center.z;
    return dx*dx + dy*dy + dz*dz <= this.radius*this.radius;
  }

  /**
   * Sample a point uniformly inside the sphere
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    let x, y, z;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x*x + y*y + z*z > 1);

    return {
      x: this.center.x + x * this.radius,
      y: this.center.y + y * this.radius,
      z: this.center.z + z * this.radius
    };
  }
}


/**
 * Box3D
 * 
 * Represents a filled 3D box (rectangular prism) and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create a box centered at (0,0,0) with width 2, height 3, depth 4
 * const b = new Box3D({ x: 0, y: 0, z: 0 }, 2, 3, 4);
 * 
 * // Sample a random point inside the box
 * const p = b.sample(); // { x: ..., y: ..., z: ... }
 * 
 * // Check if a point is inside the box
 * const isInside = b.contains({ x: 0.5, y: 1, z: -1 }); // true or false
 */
export class Box3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [width=1] - Size along X
   * @param {number} [height=1] - Size along Y
   * @param {number} [depth=1] - Size along Z
   */
  constructor(center, width = 1, height = 1, depth = 1) {
    this.center = center;
    this.width = width;
    this.height = height;
    this.depth = depth;
    /** Volume of the box (used for weighted sampling in unions) */
    this.volume = width * height * depth;
  }

  /**
   * Determine whether a point is inside the box
   * @param {{x: number, y: number, z: number}} p - Point to test
   * @returns {boolean} True if point is inside
   */
  contains(p) {
    const dx = Math.abs(p.x - this.center.x);
    const dy = Math.abs(p.y - this.center.y);
    const dz = Math.abs(p.z - this.center.z);
    return dx <= this.width / 2 && dy <= this.height / 2 && dz <= this.depth / 2;
  }

  /**
   * Sample a point uniformly inside the box
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    return {
      x: this.center.x + (Math.random() - 0.5) * this.width,
      y: this.center.y + (Math.random() - 0.5) * this.height,
      z: this.center.z + (Math.random() - 0.5) * this.depth
    };
  }
}


/**
 * Cube3D
 * 
 * Represents a filled 3D cube and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create a cube centered at (0,0,0) with edge length 2
 * const c = new Cube3D({ x: 0, y: 0, z: 0 }, 2);
 * 
 * // Sample a random point inside the cube
 * const p = c.sample(); // { x: ..., y: ..., z: ... }
 * 
 * // Check if a point is inside the cube
 * const isInside = c.contains({ x: 0.5, y: -0.5, z: 1 }); // true or false
 */
export class Cube3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [edge=1] - Length of cube edge
   */
  constructor(center, edge = 1) {
    this.center = center;
    this.edge = edge;
    /** Volume of the cube */
    this.volume = edge ** 3;
  }

  /**
   * Determine whether a point is inside the cube
   * @param {{x: number, y: number, z: number}} p - Point to test
   * @returns {boolean} True if point is inside
   */
  contains(p) {
    const half = this.edge / 2;
    return (
      Math.abs(p.x - this.center.x) <= half &&
      Math.abs(p.y - this.center.y) <= half &&
      Math.abs(p.z - this.center.z) <= half
    );
  }

  /**
   * Sample a point uniformly inside the cube
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    const half = this.edge / 2;
    return {
      x: this.center.x + (Math.random() - 0.5) * this.edge,
      y: this.center.y + (Math.random() - 0.5) * this.edge,
      z: this.center.z + (Math.random() - 0.5) * this.edge
    };
  }
}

  
/**
 * Cylinder3D
 * 
 * Represents a vertical 3D cylinder and provides methods for uniform sampling
 * and point containment tests.
 * 
 * @example
 * // Create a cylinder centered at (0,0,0) with radius 1 and height 2
 * const cyl = new Cylinder3D({ x: 0, y: 0, z: 0 }, 1, 2);
 * 
 * // Sample a random point inside the cylinder
 * const p = cyl.sample(); // { x: ..., y: ..., z: ... }
 * 
 * // Check if a point is inside the cylinder
 * const isInside = cyl.contains({ x: 0.5, y: 0.5, z: 0.5 }); // true or false
 */
export class Cylinder3D {
  /**
   * @param {{x: number, y: number, z: number}} center - Center coordinates
   * @param {number} [radius=1] - Cylinder base radius
   * @param {number} [height=1] - Cylinder height
   */
  constructor(center, radius = 1, height = 1) {
    this.center = center;
    this.radius = radius;
    this.height = height;
    /** Volume of the cylinder */
    this.volume = Math.PI * radius ** 2 * height;
  }

  /**
   * Determine whether a point is inside the cylinder
   * @param {{x: number, y: number, z: number}} p - Point to test
   * @returns {boolean} True if point is inside
   */
  contains(p) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const dz = p.z - this.center.z;
    const inBase = dx*dx + dy*dy <= this.radius*this.radius;
    const inHeight = Math.abs(dz) <= this.height / 2;
    return inBase && inHeight;
  }

  /**
   * Sample a point uniformly inside the cylinder
   * @returns {{x: number, y: number, z: number}} Random point
   */
  sample() {
    const theta = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * this.radius; // sqrt ensures uniform area
    const z = this.center.z + (Math.random() - 0.5) * this.height;

    return {
      x: this.center.x + r * Math.cos(theta),
      y: this.center.y + r * Math.sin(theta),
      z: z
    };
  }
}
