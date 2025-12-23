import { Sphere3D } from "./shapes/shapes3d.js";
import { sampleIntersection, sampleUnion } from "./shapes/composite_shapes.js";

const myDemoSphere1 = new Sphere3D({ x: 2, y: 0, z: 0 }, 4)
const myDemoSphere2 = new Sphere3D({ x: -2, y: 0, z: 0 }, 4)

export const SCENES = [
  { name: "HUDF", config: { passive: true } },
  { name: "3D Sphere", 
    config: {
      samplers: [
        () => myDemoSphere1.sample(),
      ],
      counts: [
        1000,
      ],
  }},
  { name: "Union of 2 Spheres", 
    config: {
      samplers: [
        () => sampleUnion([
          myDemoSphere1,
          myDemoSphere2,
        ])
      ],
      counts: [
        10000,
      ],
  }},
  { name: "Intersection of 2 Spheres", 
    config: {
      samplers: [
        () => sampleIntersection([
          myDemoSphere1,
          myDemoSphere2,
        ])
      ],
      counts: [
        10000,
      ],
  }},
];

export function getSceneConfig(index) {
  return SCENES[index % SCENES.length];
}
