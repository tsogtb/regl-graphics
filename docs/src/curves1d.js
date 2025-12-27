export class Path1D {
  constructor(segments, lutResolution = 200) {
    this.segments = segments.map(seg => {
      if (typeof seg === 'function') return this._prebakeParametric(seg, lutResolution);
      return seg;
    });
    this.cumulativeLengths = [];
    this.totalLength = 0;
    this.bbox = { 
      minX: Infinity, maxX: -Infinity, 
      minY: Infinity, maxY: -Infinity, 
      minZ: Infinity, maxZ: -Infinity 
    };

    for (const seg of this.segments) {
      const len = this._calculateLength(seg);
      this.totalLength += len;
      this.cumulativeLengths.push(this.totalLength);
      this._updateBBox(seg);
    }

    if (this.totalLength === 0) {
      this.bbox = { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    }

    this.center = {
      x: (this.bbox.minX + this.bbox.maxX) / 2,
      y: (this.bbox.minY + this.bbox.maxY) / 2,
      z: (this.bbox.minZ + this.bbox.maxZ) / 2
    };

    this.volume = this.totalLength;
    this.area = this.totalLength;
  }

  sample() {
    if (this.totalLength === 0) return { ...this.center };
    
    const target = Math.random() * this.totalLength;
    
    // Binary Search to find segment: O(log N)
    let low = 0, high = this.cumulativeLengths.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.cumulativeLengths[mid] < target) low = mid + 1;
      else high = mid;
    }

    const seg = this.segments[low];
    const prevLength = low > 0 ? this.cumulativeLengths[low - 1] : 0;
    const localTarget = target - prevLength;

    if (seg.type === 'baked_parametric') return this._sampleBaked(seg, localTarget);
    if (seg.start && seg.end) return this._sampleLine(seg, localTarget);
    if (seg.center && seg.radius) return this._sampleArc(seg, localTarget);

    return { ...this.center };
  }

  /** @private */
  _sampleLine(seg, dist) {
    const len = Math.sqrt(
      (seg.end.x - seg.start.x)**2 + (seg.end.y - seg.start.y)**2 + ((seg.end.z||0) - (seg.start.z||0))**2
    );
    const t = len === 0 ? 0 : dist / len;
    return {
      x: seg.start.x + t * (seg.end.x - seg.start.x),
      y: seg.start.y + t * (seg.end.y - seg.start.y),
      z: (seg.start.z ?? 0) + t * ((seg.end.z ?? 0) - (seg.start.z ?? 0))
    };
  }

  /** @private */
  _sampleArc(seg, dist) {
    const start = seg.start || 0;
    const end = seg.end !== undefined ? seg.end : 2 * Math.PI;
    let delta = end - start;
    if (delta < 0) delta += 2 * Math.PI;
    const t = dist / (seg.radius * delta || 1);
    const theta = start + t * delta;
    return {
      x: seg.center.x + seg.radius * Math.cos(theta),
      y: seg.center.y + seg.radius * Math.sin(theta),
      z: seg.center.z ?? 0
    };
  }

  /** @private */
  _sampleBaked(seg, target) {
    let low = 0, high = seg.samples;
    while (low < high) {
      let mid = (low + high) >>> 1;
      if (seg.lut[mid] < target) low = mid + 1;
      else high = mid;
    }
    const i = Math.max(1, low);
    const d0 = seg.lut[i - 1], d1 = seg.lut[i];
    const alpha = (d1 - d0) <= 0 ? 0 : (target - d0) / (d1 - d0);
    return seg.f(Math.max(0, Math.min(1, ((i - 1) + alpha) / seg.samples)));
  }

  /** @private */
  _updateBBox(seg) {
    let min = {x:0,y:0,z:0}, max = {x:0,y:0,z:0};

    if (seg.start && seg.end) {
      min = { x: Math.min(seg.start.x, seg.end.x), y: Math.min(seg.start.y, seg.end.y), z: Math.min(seg.start.z||0, seg.end.z||0) };
      max = { x: Math.max(seg.start.x, seg.end.x), y: Math.max(seg.start.y, seg.end.y), z: Math.max(seg.start.z||0, seg.end.z||0) };
    } else if (seg.center && seg.radius) {
      min = { x: seg.center.x - seg.radius, y: seg.center.y - seg.radius, z: (seg.center.z||0) };
      max = { x: seg.center.x + seg.radius, y: seg.center.y + seg.radius, z: (seg.center.z||0) };
    } else if (seg.type === 'baked_parametric') {
      // Sample a few points for parametric BBox estimation
      for(let t=0; t<=1; t+=0.1) {
        const p = seg.f(t);
        this.bbox.minX = Math.min(this.bbox.minX, p.x);
        this.bbox.maxX = Math.max(this.bbox.maxX, p.x);
        this.bbox.minY = Math.min(this.bbox.minY, p.y);
        this.bbox.maxY = Math.max(this.bbox.maxY, p.y);
        this.bbox.minZ = Math.min(this.bbox.minZ, p.z||0);
        this.bbox.maxZ = Math.max(this.bbox.maxZ, p.z||0);
      }
      return;
    }

    this.bbox.minX = Math.min(this.bbox.minX, min.x);
    this.bbox.maxX = Math.max(this.bbox.maxX, max.x);
    this.bbox.minY = Math.min(this.bbox.minY, min.y);
    this.bbox.maxY = Math.max(this.bbox.maxY, max.y);
    this.bbox.minZ = Math.min(this.bbox.minZ, min.z);
    this.bbox.maxZ = Math.max(this.bbox.maxZ, max.z);
  }

  /** @private */
  _calculateLength(seg) {
    if (seg.type === 'baked_parametric') return seg.totalLength;
    if (seg.start && seg.end) {
      return Math.sqrt((seg.end.x-seg.start.x)**2 + (seg.end.y-seg.start.y)**2 + ((seg.end.z||0)-(seg.start.z||0))**2);
    }
    if (seg.center && seg.radius) {
      let delta = (seg.end !== undefined ? seg.end : 2 * Math.PI) - (seg.start || 0);
      if (delta < 0) delta += 2 * Math.PI;
      return seg.radius * delta;
    }
    return 0;
  }

  /** @private */
  _prebakeParametric(f, samples) {
    let totalLength = 0;
    const lut = [0];
    let prev = f(0);
    for (let i = 1; i <= samples; i++) {
      const curr = f(i / samples);
      totalLength += Math.sqrt((curr.x-prev.x)**2 + (curr.y-prev.y)**2 + ((curr.z||0)-(prev.z||0))**2);
      lut.push(totalLength);
      prev = curr;
    }
    return { type: 'baked_parametric', f, lut, totalLength, samples };
  }
}

export const bezierQuadratic = ({ p0, p1, p2 }) => (t) => {
  const it = 1 - t, it2 = it * it, t2 = t * t, f1 = 2 * it * t;
  return {
    x: it2 * p0.x + f1 * p1.x + t2 * p2.x,
    y: it2 * p0.y + f1 * p1.y + t2 * p2.y,
    z: it2 * (p0.z || 0) + f1 * (p1.z || 0) + t2 * (p2.z || 0)
  };
};

export const bezierCubic = ({ p0, p1, p2, p3 }) => (t) => {
  const it = 1 - t, it2 = it * it, it3 = it2 * it, t2 = t * t, t3 = t2 * t;
  const f1 = 3 * it2 * t, f2 = 3 * it * t2;
  return {
    x: it3 * p0.x + f1 * p1.x + f2 * p2.x + t3 * p3.x,
    y: it3 * p0.y + f1 * p1.y + f2 * p2.y + t3 * p3.y,
    z: it3 * (p0.z || 0) + f1 * (p1.z || 0) + f2 * (p2.z || 0) + t3 * (p3.z || 0)
  };
};

export const helix = ({ center, radius, height, turns }) => (t) => ({
  x: center.x + radius * Math.cos(t * Math.PI * 2 * turns),
  y: center.y + radius * Math.sin(t * Math.PI * 2 * turns),
  z: center.z + t * height
});

export const conicHelix = ({ center, radiusStart, radiusEnd, height, turns }) => (t) => {
  const currentRadius = radiusStart + (radiusEnd - radiusStart) * t;
  const angle = t * Math.PI * 2 * turns;

  return {
    x: center.x + currentRadius * Math.cos(angle),
    y: center.y + currentRadius * Math.sin(angle),
    z: center.z + t * height
  };
};