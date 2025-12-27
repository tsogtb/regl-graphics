export class RotatedShape {
  constructor(baseShape, pitch = 0, yaw = 0, roll = 0) {
    this.base = baseShape;
    this.center = baseShape.center;
    this.volume = baseShape.volume;

    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cy = Math.cos(yaw),   sy = Math.sin(yaw);
    const cr = Math.cos(roll),  sr = Math.sin(roll);

    this.m00 = cy * cr;
    this.m01 = -cy * sr;
    this.m02 = sy;
    this.m10 = sp * sy * cr + cp * sr;
    this.m11 = -sp * sy * sr + cp * cr;
    this.m12 = -sp * cy;
    this.m20 = -cp * sy * cr + sp * sr;
    this.m21 = cp * sy * sr + sp * cr;
    this.m22 = cp * cy;

    this.bbox = this._calculateRotatedBBox();
  }

  sample() {
    const p = this.base.sample();
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const dz = p.z - this.center.z;

    return {
      x: dx * this.m00 + dy * this.m01 + dz * this.m02 + this.center.x,
      y: dx * this.m10 + dy * this.m11 + dz * this.m12 + this.center.y,
      z: dx * this.m20 + dy * this.m21 + dz * this.m22 + this.center.z
    };
  }

  contains(p, epsilon = 1e-9) {
    const dx = p.x - this.center.x;
    const dy = p.y - this.center.y;
    const dz = p.z - this.center.z;

    const localP = {
      x: dx * this.m00 + dy * this.m10 + dz * this.m20 + this.center.x,
      y: dx * this.m01 + dy * this.m11 + dz * this.m21 + this.center.y,
      z: dx * this.m02 + dy * this.m12 + dz * this.m22 + this.center.z
    };

    return this.base.contains(localP, epsilon);
  }

  _calculateRotatedBBox() {
    const b = this.base.bbox;
    const zMin = b.minZ ?? this.center.z;
    const zMax = b.maxZ ?? this.center.z;
  
    const corners = [
      {x: b.minX, y: b.minY, z: zMin},
      {x: b.maxX, y: b.minY, z: zMin},
      {x: b.minX, y: b.maxY, z: zMin},
      {x: b.maxX, y: b.maxY, z: zMin},
      {x: b.minX, y: b.minY, z: zMax},
      {x: b.maxX, y: b.minY, z: zMax},
      {x: b.minX, y: b.maxY, z: zMax},
      {x: b.maxX, y: b.maxY, z: zMax}
    ];
  
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
  
    for (const p of corners) {
      const dx = p.x - this.center.x;
      const dy = p.y - this.center.y;
      const dz = p.z - this.center.z;
  
      const rx = dx * this.m00 + dy * this.m01 + dz * this.m02 + this.center.x;
      const ry = dx * this.m10 + dy * this.m11 + dz * this.m12 + this.center.y;
      const rz = dx * this.m20 + dy * this.m21 + dz * this.m22 + this.center.z;
  
      if (rx < minX) minX = rx; if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry; if (ry > maxY) maxY = ry;
      if (rz < minZ) minZ = rz; if (rz > maxZ) maxZ = rz;
    }
  
    return { minX, maxX, minY, maxY, minZ, maxZ };
  }
}