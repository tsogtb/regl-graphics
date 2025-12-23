/**
 * shapes3d.js
 * * Uniform sampling of 3D geometric volumes and sectors.
 * Standardizes on { x, y, z } returns and provides .contains(p, epsilon) logic.
 */


/**
 * EllipsoidSector3D
 * Represents a sector (partial wedge) of a 3D ellipsoid.
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
  constructor(center, rx = 1, ry = 1, rz = 1, startTheta = 0, endTheta = 2 * Math.PI, startPhi = 0, endPhi = Math.PI) {
    this.center = center;
    this.rx = rx; this.ry = ry; this.rz = rz;
    this.startTheta = startTheta; this.endTheta = endTheta;
    this.startPhi = startPhi; this.endPhi = endPhi;

    let deltaTheta = endTheta - startTheta;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;

    // Correct solid angle fraction for volume calculation
    const solidAngle = deltaTheta * (Math.cos(startPhi) - Math.cos(endPhi));
    this.volume = (1 / 3) * rx * ry * rz * solidAngle;

    this.bbox = {
      minX: center.x - rx, maxX: center.x + rx,
      minY: center.y - ry, maxY: center.y + ry,
      minZ: center.z - rz, maxZ: center.z + rz
    };
  }

  /**
   * Check if a point is inside the ellipsoidal sector
   * @param {{x: number, y: number, z: number}} p 
   * @param {number} [epsilon=1e-9]
   */
  contains(p, epsilon = 1e-9) {
    const dx = (p.x - this.center.x) / this.rx;
    const dy = (p.y - this.center.y) / this.ry;
    const dz = (p.z - this.center.z) / this.rz;
  
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq > 1 + epsilon) return false;
  
    // 1. Azimuth check
    let theta = Math.atan2(dy, dx); 
    if (theta < 0) theta += 2 * Math.PI;
  
    let inTheta = (this.startTheta <= this.endTheta) 
      ? (theta >= this.startTheta - epsilon && theta <= this.endTheta + epsilon)
      : (theta >= this.startTheta - epsilon || theta <= this.endTheta + epsilon);
    
    if (!inTheta) return false;
  
    // 2. Polar check
    const phi = Math.acos(Math.max(-1, Math.min(1, dz / (Math.sqrt(distSq) + 1e-15))));
    return phi >= this.startPhi - epsilon && phi <= this.endPhi + epsilon;
  }

  /**
   * Sample a point uniformly inside the sector
   */
  sample() {
    const r = Math.cbrt(Math.random());
    let deltaTheta = this.endTheta - this.startTheta;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    
    const theta = (this.startTheta + Math.random() * deltaTheta) % (2 * Math.PI);
    const cosStart = Math.cos(this.startPhi);
    const cosEnd = Math.cos(this.endPhi);
    const phi = Math.acos(cosStart - Math.random() * (cosStart - cosEnd));
  
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
 * Represents a filled 3D ellipsoid.
 */
export class Ellipsoid3D extends EllipsoidSector3D {
  constructor(center, rx = 1, ry = 1, rz = 1) {
    super(center, rx, ry, rz, 0, 2 * Math.PI, 0, Math.PI);
  }
}

/**
 * Sphere3D
 * Represents a filled 3D sphere.
 */
export class Sphere3D extends Ellipsoid3D {
  constructor(center, radius = 1) {
    super(center, radius, radius, radius);
    this.radius = radius;
  }
}



/**
 * Box3D
 * Represents a filled 3D rectangular prism.
 */
export class Box3D {
  constructor(center, width = 1, height = 1, depth = 1) {
    this.center = center;
    this.width = width; this.height = height; this.depth = depth;
    this.volume = width * height * depth;
    this.bbox = {
      minX: center.x - width / 2, maxX: center.x + width / 2,
      minY: center.y - height / 2, maxY: center.y + height / 2,
      minZ: center.z - depth / 2, maxZ: center.z + depth / 2
    };
  }

  contains(p, epsilon = 1e-9) {
    return Math.abs(p.x - this.center.x) <= (this.width / 2) + epsilon && 
           Math.abs(p.y - this.center.y) <= (this.height / 2) + epsilon && 
           Math.abs(p.z - this.center.z) <= (this.depth / 2) + epsilon;
  }

  sample() {
    return {
      x: this.center.x + (Math.random() - 0.5) * this.width,
      y: this.center.y + (Math.random() - 0.5) * this.height,
      z: this.center.z + (Math.random() - 0.5) * this.depth
    };
  }
}

/**
 * Cone3D
 * Represents a vertical 3D cone pointing along the +Z axis.
 */
export class Cone3D {
  /**
   * @param {{x,y,z}} center - Center of the circular base
   * @param {number} radius - Base radius
   * @param {number} height - Distance from base to tip
   */
  constructor(center, radius = 1, height = 1) {
    this.center = center;
    this.radius = radius; this.height = height;
    this.volume = (1 / 3) * Math.PI * radius * radius * height;
    this.bbox = {
      minX: center.x - radius, maxX: center.x + radius,
      minY: center.y - radius, maxY: center.y + radius,
      minZ: center.z,           maxZ: center.z + height
    };
  }

  contains(p, epsilon = 1e-9) {
    const dz = p.z - this.center.z;
    if (dz < -epsilon || dz > this.height + epsilon) return false;
    const radiusAtHeight = this.radius * (1 - dz / this.height);
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    return dx * dx + dy * dy <= (radiusAtHeight * radiusAtHeight) + epsilon;
  }

  sample() {
    // Volume scales with h^3, so use cube root for uniform vertical distribution
    const t = Math.cbrt(Math.random()); 
    const z = this.center.z + (1 - t) * this.height;
    const r = (this.radius * t) * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    return {
      x: this.center.x + r * Math.cos(theta),
      y: this.center.y + r * Math.sin(theta),
      z: z
    };
  }
}