/**
 * EllipsoidSector3D
 * The master class for all ellipsoidal/spherical shapes and shells.
 */
export class EllipsoidSector3D {
  constructor(center, rx=1, ry=1, rz=1, startTheta=0, endTheta=2*Math.PI, startPhi=0, endPhi=Math.PI, innerRx=0, innerRy=0, innerRz=0) {
    this.center = center;
    this.rx = rx; this.ry = ry; this.rz = rz;
    this.innerRx = innerRx; this.innerRy = innerRy; this.innerRz = innerRz;
    this.startTheta = startTheta; this.endTheta = endTheta;
    this.startPhi = startPhi; this.endPhi = endPhi;

    let deltaTheta = endTheta - startTheta;
    if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    this.deltaTheta = deltaTheta;

    // Solid angle fraction
    this.cosStartPhi = Math.cos(startPhi);
    this.cosEndPhi = Math.cos(endPhi);
    const solidAngle = deltaTheta * (this.cosStartPhi - this.cosEndPhi);
    
    const volOuter = (1/3) * rx * ry * rz * solidAngle;
    const volInner = (1/3) * innerRx * innerRy * innerRz * solidAngle;
    this.volume = volOuter - volInner;

    this.bbox = {
      minX: center.x - rx, maxX: center.x + rx,
      minY: center.y - ry, maxY: center.y + ry,
      minZ: center.z - rz, maxZ: center.z + rz
    };
  }

  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x, dy = p.y - this.center.y, dz = p.z - this.center.z;
    
    const dnx = dx / this.rx, dny = dy / this.ry, dnz = dz / this.rz;
    const distSq = dnx * dnx + dny * dny + dnz * dnz;
    if (distSq > 1 + epsilon) return false;

    if (this.innerRx > 0) {
      const idnx = dx / this.innerRx, idny = dy / this.innerRy, idnz = dz / this.innerRz;
      if (idnx * idnx + idny * idny + idnz * idnz < 1 - epsilon) return false;
    }

    // Azimuth check (Theta)
    let theta = Math.atan2(dy, dx); 
    if (theta < 0) theta += 2 * Math.PI;
    const inTheta = (this.startTheta <= this.endTheta) 
      ? (theta >= this.startTheta - epsilon && theta <= this.endTheta + epsilon)
      : (theta >= this.startTheta - epsilon || theta <= this.endTheta + epsilon);
    if (!inTheta) return false;

    // Polar check (Phi) - Optimized: uses Cosine comparison to avoid acos()
    const cosP = dz / (Math.sqrt(dx*dx + dy*dy + dz*dz) + 1e-15);
    return cosP <= this.cosStartPhi + epsilon && cosP >= this.cosEndPhi - epsilon;
  }

  sample() {
    // Uniform volume scaling for 3D (Cube Root)
    const ratio = (this.innerRx / this.rx); // assume uniform scaling
    const r = Math.cbrt(Math.random() * (1 - ratio**3) + ratio**3);
    
    const theta = (this.startTheta + Math.random() * this.deltaTheta) % (2 * Math.PI);
    const cosP = this.cosStartPhi - Math.random() * (this.cosStartPhi - this.cosEndPhi);
    const sinP = Math.sqrt(Math.max(0, 1 - cosP * cosP));

    return {
      x: this.center.x + this.rx * r * sinP * Math.cos(theta),
      y: this.center.y + this.ry * r * sinP * Math.sin(theta),
      z: this.center.z + this.rz * r * cosP
    };
  }
}

/**
 * Ellipsoid3D
 * Overrides to skip angular logic.
 */
export class Ellipsoid3D extends EllipsoidSector3D {
  constructor(center, rx=1, ry=1, rz=1, innerRx=0, innerRy=0, innerRz=0) {
    super(center, rx, ry, rz, 0, 2*Math.PI, 0, Math.PI, innerRx, innerRy, innerRz);
  }

  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x, dy = p.y - this.center.y, dz = p.z - this.center.z;
    const distSq = (dx*dx)/(this.rx*this.rx) + (dy*dy)/(this.ry*this.ry) + (dz*dz)/(this.rz*this.rz);
    if (distSq > 1 + epsilon) return false;
    if (this.innerRx > 0) {
      const iDistSq = (dx*dx)/(this.innerRx*this.innerRx) + (dy*dy)/(this.innerRy*this.innerRy) + (dz*dz)/(this.innerRz*this.innerRz);
      if (iDistSq < 1 - epsilon) return false;
    }
    return true;
  }

  sample() {
    const ratio = (this.innerRx / this.rx);
    const r = Math.cbrt(Math.random() * (1 - ratio**3) + ratio**3);
    const theta = Math.random() * 2 * Math.PI;
    const cosP = 2 * Math.random() - 1;
    const sinP = Math.sqrt(1 - cosP * cosP);
    return {
      x: this.center.x + this.rx * r * sinP * Math.cos(theta),
      y: this.center.y + this.ry * r * sinP * Math.sin(theta),
      z: this.center.z + this.rz * r * cosP
    };
  }
}

/**
 * Sphere3D
 * The most optimized 3D volume sampler.
 */
export class Sphere3D extends Ellipsoid3D {
  constructor(center, radius=1, innerRadius=0) {
    super(center, radius, radius, radius, innerRadius, innerRadius, innerRadius);
    this.rSq = radius * radius;
    this.irSq = innerRadius * innerRadius;
    this.radius = radius;
    this.innerRadius = innerRadius;
  }

  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x, dy = p.y - this.center.y, dz = p.z - this.center.z;
    const d2 = dx*dx + dy*dy + dz*dz;
    return d2 <= this.rSq + epsilon && d2 >= this.irSq - epsilon;
  }

  sample() {
    const r = Math.cbrt(Math.random() * (this.radius**3 - this.innerRadius**3) + this.innerRadius**3);
    const theta = Math.random() * 2 * Math.PI;
    const cosP = 2 * Math.random() - 1;
    const sinP = Math.sqrt(1 - cosP * cosP);
    return {
      x: this.center.x + r * sinP * Math.cos(theta),
      y: this.center.y + r * sinP * Math.sin(theta),
      z: this.center.z + r * cosP
    };
  }
}

/**
 * Box3D
 */
export class Box3D {
  constructor(center, width=1, height=1, depth=1) {
    this.center = center; this.width = width; this.height = height; this.depth = depth;
    this.volume = width * height * depth;
    this.bbox = { minX: center.x-width/2, maxX: center.x+width/2, minY: center.y-height/2, maxY: center.y+height/2, minZ: center.z-depth/2, maxZ: center.z+depth/2 };
  }
  contains(p, epsilon=1e-9) {
    return Math.abs(p.x-this.center.x) <= this.width/2 + epsilon && Math.abs(p.y-this.center.y) <= this.height/2 + epsilon && Math.abs(p.z-this.center.z) <= this.depth/2 + epsilon;
  }
  sample() {
    return { x: this.center.x + (Math.random()-0.5)*this.width, y: this.center.y + (Math.random()-0.5)*this.height, z: this.center.z + (Math.random()-0.5)*this.depth };
  }
}

/**
 * Cylinder3D (Tube/Pipe Support)
 */
export class Cylinder3D {
  constructor(center, radius=1, height=1, innerRadius=0) {
    this.center = center; 
    this.radius = radius; 
    this.height = height; 
    this.innerRadius = innerRadius;
    this.volume = Math.PI * (radius*radius - innerRadius*innerRadius) * height;
    this.rSq = radius * radius;
    this.irSq = innerRadius * innerRadius;

    const halfH = height / 2;
    this.bbox = {
      minX: center.x - radius, maxX: center.x + radius,
      minY: center.y - radius, maxY: center.y + radius,
      minZ: center.z - halfH,  maxZ: center.z + halfH
    };
  }

  contains(p, epsilon=1e-9) {
    
    const dz = p.z - this.center.z;
    const halfH = this.height / 2;
    if (Math.abs(dz) > halfH + epsilon) return false;

    const d2 = (p.x - this.center.x)**2 + (p.y - this.center.y)**2;
    return d2 <= this.rSq + epsilon && d2 >= this.irSq - epsilon;
  }

  sample() {
    const r = Math.sqrt(Math.random() * (this.rSq - this.irSq) + this.irSq);
    const t = Math.random() * 2 * Math.PI;
    
    const z = this.center.z + (Math.random() - 0.5) * this.height;
    
    return { 
      x: this.center.x + r * Math.cos(t), 
      y: this.center.y + r * Math.sin(t), 
      z: z 
    };
  }
}
/**
 * Cone3D
 */
export class Cone3D {
  /**
   * @param {{x,y,z}} center - Center of the circular base
   * @param {number} radius - Base outer radius
   * @param {number} height - Distance from base to tip along +Z
   * @param {number} innerRadius - Base inner radius
   * @param {number} [innerHeight] - Height of the internal void. Defaults to outer height.
   */
  constructor(center, radius = 1, height = 1, innerRadius = 0, innerHeight = null) {
    this.center = center;
    this.radius = radius; 
    this.height = height;
    this.innerRadius = innerRadius;
    // If not provided, "shared tip" cone
    this.innerHeight = innerHeight !== null ? innerHeight : (innerRadius > 0 ? height : 0);

    const outerVol = (1 / 3) * Math.PI * (radius ** 2) * height;
    const innerVol = (1 / 3) * Math.PI * (innerRadius ** 2) * this.innerHeight;
    this.volume = outerVol - innerVol;

    this.bbox = {
      minX: center.x - radius, maxX: center.x + radius,
      minY: center.y - radius, maxY: center.y + radius,
      minZ: center.z,           maxZ: center.z + height
    };
  }

  contains(p, epsilon = 1e-9) {
    const dz = p.z - this.center.z;
    if (dz < -epsilon || dz > this.height + epsilon) return false;

    const outerRAtZ = (this.radius / this.height) * (this.height - dz);
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const d2 = dx * dx + dy * dy;

    if (d2 > (outerRAtZ + epsilon) ** 2) return false;

    if (this.innerRadius > 0 && dz <= this.innerHeight + epsilon) {
      const innerRAtZ = (this.innerRadius / this.innerHeight) * (this.innerHeight - dz);
      if (d2 < (innerRAtZ - epsilon) ** 2) return false;
    }

    return true;
  }

  sample() {
    if (this.innerRadius <= 0) {
      return this._sampleOuter();
    }

    let attempts = 0;
    while (attempts < 2000) {
      const p = this._sampleOuter();
      const dz = p.z - this.center.z;

      if (dz > this.innerHeight) return p;

      const innerRAtZ = (this.innerRadius / this.innerHeight) * (this.innerHeight - dz);
      const d2 = (p.x - this.center.x)**2 + (p.y - this.center.y)**2;
      
      if (d2 >= innerRAtZ * innerRAtZ) return p;
      attempts++;
    }
    return this._sampleOuter(); 
  }

  /** @private */
  _sampleOuter() {
    const u = Math.random();
    const t = Math.cbrt(u);
    const z = this.center.z + (1 - t) * this.height;
    const r = t * this.radius * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
      x: this.center.x + r * Math.cos(theta),
      y: this.center.y + r * Math.sin(theta),
      z: z
    };
  }
}