/**
 * curves1d.js
 * * High-performance uniform sampling for 1D paths in 2D/3D space.
 * Standardizes on { configObject } for geometric primitives and 
 * (t) => {point} functions for parametric curves.
 */

/**
 * Path1D
 * Represents a continuous path composed of multiple segments (lines, arcs, curves).
 * Pre-calculates segment lengths and builds Arc-Length Lookup Tables (LUTs) 
 * in the constructor for high-frequency sampling performance.
 * * @example
 * const track = new Path1D([
 * { start: {x:0, y:0}, end: {x:10, y:0} }, // Line
 * { center: {x:10, y:5}, radius: 5, start: -Math.PI/2, end: Math.PI/2 }, // Arc
 * bezierQuadratic({ p0: {x:10, y:10}, p1: {x:5, y:15}, p2: {x:0, y:10} }) // Bezier
 * ]);
 * const p = track.sample();
 */
export class Path1D {
  /**
   * @param {Array<Object|Function>} segments - Array of curve configs or functions.
   * @param {number} [lutResolution=200] - Detail level for parametric curve LUTs.
   */
  constructor(segments, lutResolution = 200) {
    this.segments = segments.map(seg => {
      // Pre-bake parametric functions into optimized LUT objects
      if (typeof seg === 'function') {
        return this._prebakeParametric(seg, lutResolution);
      }
      return seg;
    });

    this.lengths = [];
    this.totalLength = 0;

    for (const seg of this.segments) {
      const len = this._calculateLength(seg);
      this.lengths.push(len);
      this.totalLength += len;
    }
  }

  /** @private */
  _prebakeParametric(f, samples) {
    let totalLength = 0;
    const lut = [0];
    let prev = f(0);

    for (let i = 1; i <= samples; i++) {
      const curr = f(i / samples);
      const d = Math.sqrt(
        (curr.x - prev.x)**2 + 
        (curr.y - prev.y)**2 + 
        ((curr.z || 0) - (prev.z || 0))**2
      );
      totalLength += d;
      lut.push(totalLength);
      prev = curr;
    }

    return { type: 'baked_parametric', f, lut, totalLength, samples };
  }

  /** @private */
  _calculateLength(seg) {
    if (seg.type === 'baked_parametric') return seg.totalLength;
    if (seg.start && seg.end) {
      return Math.sqrt(
        (seg.end.x - seg.start.x)**2 + 
        (seg.end.y - seg.start.y)**2 + 
        ((seg.end.z || 0) - (seg.start.z || 0))**2
      );
    }
    if (seg.center && seg.radius) {
      let delta = (seg.end !== undefined ? seg.end : 2 * Math.PI) - (seg.start || 0);
      if (delta < 0) delta += 2 * Math.PI;
      return seg.radius * delta;
    }
    return 0;
  }

  /**
   * Uniformly samples a point along the entire combined path length.
   * @returns {{x: number, y: number, z: number}}
   */
  sample() {
    if (this.totalLength === 0) return { x: 0, y: 0, z: 0 };
    
    let r = Math.random() * this.totalLength;
    
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (r <= this.lengths[i]) {
        if (seg.type === 'baked_parametric') return this._sampleBaked(seg);
        return sampleCurve(seg);
      }
      r -= this.lengths[i];
    }
    return sampleCurve(this.segments[this.segments.length - 1]);
  }

  /** @private Fast-path for pre-baked LUTs */
  _sampleBaked(seg) {
    const target = Math.random() * seg.totalLength;
    let low = 0, high = seg.samples;
    
    while (low < high) {
      let mid = (low + high) >>> 1;
      if (seg.lut[mid] < target) low = mid + 1;
      else high = mid;
    }

    const i = Math.max(1, low);
    const t0 = (i - 1) / seg.samples;
    const t1 = i / seg.samples;
    const segmentLen = seg.lut[i] - seg.lut[i - 1];
    const t = t0 + (t1 - t0) * (target - seg.lut[i - 1]) / (segmentLen || 1);

    return seg.f(t);
  }
}

/**
 * Universal Curve Sampler
 * Routes to specific samplers based on the input configuration.
 * * @param {Function|Object} config - Config object or (t) => {x,y,z} function.
 * @param {Object} [options]
 * @param {number} [options.samples=200] - LUT resolution for raw functions.
 */
export function sampleCurve(config, options = { samples: 200 }) {
  if (typeof config === 'function') return parametricCurve(config, options.samples);
  if (config.start && config.end) return lineSegment(config);
  if (config.center && config.radius) return arc(config);
  
  throw new Error("Invalid curve configuration.");
}

/**
 * Samples a point on a 1D line segment.
 * @param {{start: {x,y,z}, end: {x,y,z}}} config
 */
export function lineSegment({ start, end }) {
  const t = Math.random(); 
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: (start.z ?? 0) + t * ((end.z ?? 0) - (start.z ?? 0))
  };
}

/**
 * Samples a point along an arc with wraparound support.
 * @param {{center: {x,y,z}, radius: number, start: number, end: number}} config
 */
export function arc({ center, radius = 1, start = 0, end = 2 * Math.PI }) {
  let deltaTheta = end - start;
  if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
  const theta = (start + Math.random() * deltaTheta) % (2 * Math.PI);
  
  return {
    x: center.x + radius * Math.cos(theta),
    y: center.y + radius * Math.sin(theta),
    z: center.z ?? 0
  };
}

/**
 * Parametric engine using Arc-Length parametrization for uniform spacing.
 * @param {Function} f - Mapping function (t) => {x,y,z}.
 * @param {number} [samples=200] - Detail level of length estimation.
 */
export function parametricCurve(f, samples = 200) {
  let totalLength = 0;
  const lut = [0];
  let prev = f(0);

  for (let i = 1; i <= samples; i++) {
    const curr = f(i / samples);
    const d = Math.sqrt((curr.x - prev.x)**2 + (curr.y - prev.y)**2 + ((curr.z||0) - (prev.z||0))**2);
    totalLength += d;
    lut.push(totalLength);
    prev = curr;
  }

  const target = Math.random() * totalLength;
  let low = 0, high = samples;
  while (low < high) {
    let mid = (low + high) >>> 1;
    if (lut[mid] < target) low = mid + 1;
    else high = mid;
  }

  const i = Math.max(1, low);
  const segmentLen = lut[i] - lut[i - 1];
  const t = ((i - 1) + (target - lut[i - 1]) / (segmentLen || 1)) / samples;
  return f(t);
}

// --- Parametric Generators ---

export const bezierQuadratic = ({ p0, p1, p2 }) => (t) => ({
  x: (1-t)**2 * p0.x + 2*(1-t)*t * p1.x + t**2 * p2.x,
  y: (1-t)**2 * p0.y + 2*(1-t)*t * p1.y + t**2 * p2.y,
  z: (1-t)**2 * (p0.z||0) + 2*(1-t)*t * (p1.z||0) + t**2 * (p2.z||0)
});

export const bezierCubic = ({ p0, p1, p2, p3 }) => (t) => ({
  x: (1-t)**3 * p0.x + 3*(1-t)**2*t * p1.x + 3*(1-t)*t**2 * p2.x + t**3 * p3.x,
  y: (1-t)**3 * p0.y + 3*(1-t)**2*t * p1.y + 3*(1-t)*t**2 * p2.y + t**3 * p3.y,
  z: (1-t)**3 * (p0.z||0) + 3*(1-t)**2*t * (p1.z||0) + 3*(1-t)*t**2 * (p2.z||0) + t**3 * (p3.z||0)
});

export const helix = ({ center, radius, height, turns }) => (t) => ({
  x: center.x + radius * Math.cos(t * Math.PI * 2 * turns),
  y: center.y + radius * Math.sin(t * Math.PI * 2 * turns),
  z: center.z + t * height
});