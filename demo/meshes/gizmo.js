import { Path1D } from "../../src/curves1d.js";
import { Cone3D } from "../../src/shapes3d.js"; 
import { CompositeShape } from "../../src/composite_shapes.js";

const LETTER_POINTS = 50; 
const POINTS_PER_CONE = 350; 
const POINTS_PER_AXIS = 75;

const CONE_RADIUS = 0.075;
const CONE_HEIGHT = 0.15;


const STEM_LENGTH = 0.60;

export const GIZMO_DATA = (() => {
  const geoPos = [];
  const geoCol = [];
  const labelAnchors = [];
  const labelOffsets = [];
  const labelCol = [];

  const axes = [
    { name: 'x', dir: [1, 0, 0], color: [0.85, 0.2, 0.3] },
    { name: 'y', dir: [0, 1, 0], color: [0.1, 0.8, 0.5] },
    { name: 'z', dir: [0, 0, 1], color: [0.2, 0.6, 1.0] }
  ];

  axes.forEach(axis => {

    const tipPos = {
      x: axis.dir[0] * (STEM_LENGTH - CONE_HEIGHT),
      y: axis.dir[1] * (STEM_LENGTH - CONE_HEIGHT),
      z: axis.dir[2] * (STEM_LENGTH - CONE_HEIGHT)
    };
    const stemPath = new Path1D([
      { start: {x: 0, y: 0, z: 0}, end: tipPos }
    ]);

    for (let i = 0; i < POINTS_PER_AXIS; i++) {
      const p = stemPath.sample(); 
      geoPos.push([p.x, p.y, p.z]);
      geoCol.push(axis.color);
    }
    
    for (let i = 0; i < POINTS_PER_AXIS; i++) {
      const t = i / (POINTS_PER_AXIS - 1);
      const len = t * (STEM_LENGTH - CONE_HEIGHT); 
      geoPos.push([axis.dir[0] * len, axis.dir[1] * len, axis.dir[2] * len]);
      geoCol.push(axis.color);
    }

    const outerCone = new Cone3D(
      { x: 0, y: 0, z: STEM_LENGTH - 2 * CONE_HEIGHT }, 
      CONE_RADIUS, 
      CONE_HEIGHT
    );

    const thickness = 0.001; 
    const innerCone = new Cone3D(
      { x: 0, y: 0, z: STEM_LENGTH - 2.02 * CONE_HEIGHT }, 
      CONE_RADIUS - thickness, 
      CONE_HEIGHT - thickness
    );

    const hollowCone = new CompositeShape('difference', [outerCone, innerCone]);

    for (let i = 0; i < POINTS_PER_CONE; i++) {
      const p = hollowCone.sample(); 
      
      if (axis.name === 'x') geoPos.push([p.z, p.y, p.x]); 
      else if (axis.name === 'y') geoPos.push([p.x, p.z, p.y]);
      else geoPos.push([p.x, p.y, p.z]);
      
      geoCol.push(axis.color);
    }

    const sizeMultiplier = (axis.name === 'x' || axis.name === 'y') ? 0.15 : 0.3;
    const labelPadding = 0.0; 
    const anchor = [
      axis.dir[0] * (STEM_LENGTH + labelPadding), 
      axis.dir[1] * (STEM_LENGTH + labelPadding), 
      axis.dir[2] * (STEM_LENGTH + labelPadding)
    ];
    for (let i = 0; i < LETTER_POINTS; i++) {
      const t = i / (LETTER_POINTS - 1);
      let lp = { x: 0, y: 0 };
      
      if (axis.name === 'x') {
        lp = t < 0.5 ? {x: t*4.-1., y: t*4.-1.} : {x: (t-0.5)*4.-1., y: 1.-(t-0.5)*4.};
      } else if (axis.name === 'y') {
        if (t < 0.33) lp = {x: t*3.-1., y: 1.-t*3.};
        else if (t < 0.66) lp = {x: 1.-(t-0.33)*3., y: 1.-(t-0.33)*3.};
        else lp = {x: 0., y: -(t-0.66)*3.};
      } else {
        if (t < 0.33) lp = {x: t*3.-0.5, y: 0.5};
        else if (t < 0.66) lp = {x: 0.5-(t-0.33)*3., y: 0.5-(t-0.33)*3.};
        else lp = {x: (t-0.66)*3.-0.5, y: -0.5};
      }

      labelAnchors.push(anchor);
      labelOffsets.push([lp.x * sizeMultiplier, lp.y * sizeMultiplier]);
      labelCol.push(axis.color);
    }
  });

  return {
    geometry: { positions: geoPos, colors: geoCol, count: geoPos.length },
    labels: { anchors: labelAnchors, offsets: labelOffsets, colors: labelCol, count: labelAnchors.length }
  };
})();