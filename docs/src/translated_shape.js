export class TranslatedShape {
  constructor(baseShape, dx = 0, dy = 0, dz = 0) {
    this.base = baseShape;

    this.offset = { x: dx, y: dy, z: dz };

    this.volume = baseShape.volume;
    this.area = baseShape.area;

    this.center = baseShape.center
      ? {
          x: baseShape.center.x + dx,
          y: baseShape.center.y + dy,
          z: (baseShape.center.z ?? 0) + dz
        }
      : { x: dx, y: dy, z: dz };

    if (baseShape.bbox) {
      this.bbox = {
        minX: baseShape.bbox.minX + dx,
        maxX: baseShape.bbox.maxX + dx,
        minY: baseShape.bbox.minY + dy,
        maxY: baseShape.bbox.maxY + dy,
        minZ: (baseShape.bbox.minZ ?? this.center.z) + dz,
        maxZ: (baseShape.bbox.maxZ ?? this.center.z) + dz
      };
    }
  }

  sample() {
    const p = this.base.sample();
    return {
      x: p.x + this.offset.x,
      y: p.y + this.offset.y,
      z: (p.z ?? 0) + this.offset.z
    };
  }

  contains(p, epsilon = 1e-9) {
    if (!this.base.contains) return false;

    const localP = {
      x: p.x - this.offset.x,
      y: p.y - this.offset.y,
      z: (p.z ?? 0) - this.offset.z
    };

    return this.base.contains(localP, epsilon);
  }
}
