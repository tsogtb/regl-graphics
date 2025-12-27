import { Cone3D, Cylinder3D, Box3D } from "../../src/shapes3d.js";
import { Path1D, conicHelix } from "../../src/curves1d.js";
import { RotatedShape } from "../../src/rotated_shape.js";
import { Polygon2D, Circle2D, Rectangle2D } from "../../src/shapes2d.js";
import { CompositeShape } from "../../src/composite_shapes.js";
import { TranslatedShape } from "../../src/translated_shape.js";

function createStarVertices(centerX, centerY, outerRadius, innerRadius, points = 5) {
  const vertices = [];
  const step = Math.PI / points;
  
  for (let i = 0; i < 2 * points; i++) {
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const angle = i * step + Math.PI / 2;
    vertices.push({
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      z: 0
    });
  }
  return vertices;
}

function createWireframeFromVertices(vertices) {
  const edges = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length]; // close loop
    edges.push({ start: a, end: b });
  }
  return edges;
}

const starVertices = createStarVertices(0, 5.0, 0.6, 0.25, 5)

const starWireframe = new Path1D(
  createWireframeFromVertices(starVertices)
);

function createBoxWireframe(center, width, height, depth) {
  const x0 = center.x - width / 2, x1 = center.x + width / 2;
  const y0 = center.y - height / 2, y1 = center.y + height / 2;
  const z0 = center.z - depth / 2, z1 = center.z + depth / 2;

  return [
    // Bottom Face
    { start: {x:x0, y:y0, z:z0}, end: {x:x1, y:y0, z:z0} },
    { start: {x:x1, y:y0, z:z0}, end: {x:x1, y:y1, z:z0} },
    { start: {x:x1, y:y1, z:z0}, end: {x:x0, y:y1, z:z0} },
    { start: {x:x0, y:y1, z:z0}, end: {x:x0, y:y0, z:z0} },
    // Top Face
    { start: {x:x0, y:y0, z:z1}, end: {x:x1, y:y0, z:z1} },
    { start: {x:x1, y:y0, z:z1}, end: {x:x1, y:y1, z:z1} },
    { start: {x:x1, y:y1, z:z1}, end: {x:x0, y:y1, z:z1} },
    { start: {x:x0, y:y1, z:z1}, end: {x:x0, y:y0, z:z1} },
    // Vertical Pillars
    { start: {x:x0, y:y0, z:z0}, end: {x:x0, y:y0, z:z1} },
    { start: {x:x1, y:y0, z:z0}, end: {x:x1, y:y0, z:z1} },
    { start: {x:x0, y:y1, z:z0}, end: {x:x0, y:y1, z:z1} },
    { start: {x:x1, y:y1, z:z0}, end: {x:x1, y:y1, z:z1} },
  ];
}


const christmasCone = new Cone3D({x:0, y:-5, z:0}, 2, 10, 1.93, 9.5);
const treeSpiral = new Path1D([
  conicHelix({
    center: { x: 0, y: -5, z: 0 },
    radiusStart: 2.2, radiusEnd: 0.1, height: 9.7, turns: 9          
  })
]);
// Force center
treeSpiral.center = { x: 0, y: -5, z: 0 }; 
const treeVertical = new RotatedShape(christmasCone, -Math.PI / 2, 0, 0);

const spiralVertical = new RotatedShape(treeSpiral, -Math.PI / 2, 0, 0);
const spiralVerticalRotatedRed = new RotatedShape(spiralVertical, 0, Math.PI, 0)
//const spiralVerticalRotatedBlue = new RotatedShape(spiralVertical, 0, 4*Math.PI/3, 0)

const starShape = new Polygon2D(starVertices);


const treeBaseRim = new Circle2D({ x: 0, y: -5, z: 0 }, 5.0, 4.9);

const rimVertical = new RotatedShape(treeBaseRim, -Math.PI / 2, 0, 0);


const treeBaseRim_0 = new Circle2D({ x: 0, y: -5, z: 0 }, 2.2, 2.1);

const rimVertical_0 = new RotatedShape(treeBaseRim_0, -Math.PI / 2, 0, 0);

const treeBaseRim_1 = new Circle2D({ x: 0, y: -5, z: 0 }, 4.9, 2.2);

const rimVertical_1 = new RotatedShape(treeBaseRim_1, -Math.PI / 2, 0, 0);



const treeTrunk = new Cylinder3D({ x: 0, y: -0.5, z: 0 }, 0.1, 9, 0.09);

const trunkVertical = new RotatedShape(treeTrunk, Math.PI / 2, 0, 0);

const giftBoxOuter = new Box3D({ x: -1.5, y: -4.5, z: 3 }, 1.0, 1.0, 1.0);
const giftBoxInner = new Box3D({ x: -1.5, y: -4.5, z: 3 }, 0.9, 0.9, 0.9);

const giftBox = new CompositeShape('difference', [giftBoxOuter, giftBoxInner]);

const giftBoxRotated = new RotatedShape(giftBox, 0, Math.PI / 4, 0)
const giftEdges = new Path1D(createBoxWireframe({ x: -1.5, y: -4.5, z: 3 }, 1.0, 1.0, 1.0));
const giftEdgesRotated = new RotatedShape(giftEdges, 0, Math.PI / 4, 0);

const giftBoxTop = new Rectangle2D({x: -1.5, y: -4.0, z: 3 }, 1, 1);
const giftBoxTopRotated = new RotatedShape(giftBoxTop, Math.PI / 2, 0, Math.PI / 4);

const giftBoxOuter_0 = new Box3D({ x: 1.5, y: -4.5, z: 3 }, 1.0, 1.0, 1.0);
const giftBoxInner_0 = new Box3D({ x: 1.5, y: -4.5, z: 3 }, 0.9, 0.9, 0.9);

const giftBox_0 = new CompositeShape('difference', [giftBoxOuter_0, giftBoxInner_0]);

const giftBoxRotated_0 = new RotatedShape(giftBox_0, 0, Math.PI / 4, 0)
const giftEdges_0 = new Path1D(createBoxWireframe({ x: 1.5, y: -4.5, z: 3 }, 1.0, 1.0, 1.0));
const giftEdgesRotated_0 = new RotatedShape(giftEdges_0, 0, Math.PI / 4, 0);

const giftBoxTop_0 = new Rectangle2D({x: 1.5, y: -4.0, z: 3 }, 1, 1);
const giftBoxTopRotated_0 = new RotatedShape(giftBoxTop_0, Math.PI / 2, 0, Math.PI / 4);

const giftBoxOuter_1 = new Box3D({ x: 0, y: -4.375, z: 3.5 }, 1.25, 1.25, 1.25);
const giftBoxInner_1 = new Box3D({ x: 0, y: -4.375, z: 3.5 }, 1.15, 1.15, 1.15);

const giftBox_1 = new CompositeShape('difference', [giftBoxOuter_1, giftBoxInner_1]);

const giftBoxRotated_1 = new RotatedShape(giftBox_1, 0, 0, 0)
const giftEdges_1 = new Path1D(createBoxWireframe({ x: 0, y: -4.375, z: 3.5 }, 1.25, 1.25, 1.25));
const giftEdgesRotated_1 = new RotatedShape(giftEdges_1, 0, 0, 0);

const giftBoxTop_1 = new Rectangle2D({x: 0, y: -3.725, z: 3.5 }, 1.25, 1.25);
const giftBoxTopRotated_1 = new RotatedShape(giftBoxTop_1, Math.PI / 2, 0, 0);



export const christmasTreeConfig = {
  name: "christmasTree",
  config: {
    samplers: [
      () => treeVertical.sample(),
      () => spiralVertical.sample(),
      () => starShape.sample(),
      () => rimVertical.sample(),
      () => rimVertical_0.sample(),
      () => rimVertical_1.sample(),
      () => trunkVertical.sample(),
      () => giftBoxRotated.sample(),
      () => giftEdgesRotated.sample(),
      () => giftBoxTopRotated.sample(),
      () => giftBoxRotated_0.sample(),
      () => giftEdgesRotated_0.sample(),
      () => giftBoxTopRotated_0.sample(),
      () => giftBoxRotated_1.sample(),
      () => giftEdgesRotated_1.sample(),
      () => giftBoxTopRotated_1.sample(),
      () => starWireframe.sample(),
      () => spiralVerticalRotatedRed.sample(),
      //() => spiralVerticalRotatedBlue.sample()
    ],
    counts: [
      50000,
      7000, 
      300, 
      3000,
      3000,
      2000, 
      5000,
      2000,
      1500,
      1500,
      2000,
      1500,
      1500,
      3500,
      2500,
      2500,
      1500,
      7000,
      
    ],
    sceneColors: [
      [0.1, 0.8, 0.2], // Green
      [1.0, 0.9, 0.3], // Gold
      [1.0, 0.1, 0.1], // Red
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [1.0, 0.1, 0.1], // Red
      [0.4, 0.25, 0.1], // Brown (Trunk)
      [1.0, 0.1, 0.1], // Red
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [1.0, 0.1, 0.1], // Red
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [1.0, 0.9, 0.3], // Gold (Matching Rim)
      [0.15, 0.25, 0.65], 
      [1.0, 0.85, 0.2], 
      [1.0, 0.85, 0.2], 
      [1.0, 0.9, 0.3], // Gold
      [1.0, 0.1, 0.1], // Red
      //[0.15, 0.25, 0.65], 
    ]
  },
  animate: (pointData, time, mat4) => {
    pointData.forEach((obj) => {
      mat4.identity(obj.modelMatrix);

      // 1. All tree parts rotate together
      mat4.rotateY(obj.modelMatrix, obj.modelMatrix, time * 0.2);

      
      //obj.modelMatrix[4] = Math.sin(time) * 0.2;

      // 2. Target specific parts by their index in the 'samplers' array
      // obj.id corresponds to the index in your samplers list.
      
      // Index 2 is starShape, Index 16 is starWireframe
      if (obj.id === 2 || obj.id === 16) {
        mat4.translate(obj.modelMatrix, obj.modelMatrix, [0, Math.sin(time * 2.0) * 0.1, 0]);
        //mat4.rotateY(obj.modelMatrix, obj.modelMatrix, time * 0.4);
      }

      /*
      // Indices 7-15 are the gift boxes
      if (obj.id >= 7 && obj.id <= 15) {
        // Maybe make the gifts pulse slightly?
        const s = 1.0 + Math.sin(time * 3.0) * 0.02;
        mat4.scale(obj.modelMatrix, obj.modelMatrix, [s, s, s]);
      }
      */
    });
  }
};

