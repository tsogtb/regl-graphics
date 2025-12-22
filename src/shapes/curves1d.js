/**
 * curves1d.js
 * 
 * Uniform sampling of 1D curves and parametric lines in 2D/3D space.
 * - lineSegment: sample along a straight line
 * - arc: sample along a circular arc
 * - circlePerimeter: sample along a full circle circumference
 *
 * All functions return { x, y, z }.
 */


/**
 * Sample a point on a 1D line segment [x0 → x1] in 2D/3D space
 * @param {{start: {x, y, z}, end: {x, y, z}}} param0
 * @returns {{x, y, z}}
 */
export function lineSegment({ start, end }) {
  const t = Math.random(); 
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
    z: start.z ?? 0
  };
}

/**
 * Sample a point along an arc of a circle (partial or full)
 * @param {{center: {x, y, z}, radius: number, start: number, end: number}} param0
 * @returns {{x, y, z}}
 */
export function arc({ center, radius = 1, start = 0, end = 2 * Math.PI }) {
  const theta = start + Math.random() * (end - start);
  return {
    x: center.x + radius * Math.cos(theta),
    y: center.y + radius * Math.sin(theta),
    z: center.z ?? 0
  };
}

/**
 * Sample a point along the full perimeter of a circle
 * @param {{center: {x, y, z}, radius: number}} param0
 * @returns {{x, y, z}}
 */
export function circlePerimeter({ center, radius = 1 }) {
  return arc({ center, radius, start: 0, end: 2 * Math.PI });
}
