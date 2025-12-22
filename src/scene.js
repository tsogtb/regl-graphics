import { Sphere3D } from "./shapes/shapes3d.js";

const myDemoSphere = new Sphere3D({ x: 0, y: 0, z: 0 }, 10)

export const SCENES = [
  { name: "HUDF", config: { passive: true } },
  { name: "3D Sphere", 
    config: {
      samplers: [
        () => myDemoSphere.sample(),
      ],
      counts: [
        1000,
      ],
  }},
];

export function getSceneConfig(index) {
  return SCENES[index % SCENES.length];
}
