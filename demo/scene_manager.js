import { christmasTreeConfig } from "./scenes/christmas_tree.js";

export const SCENES = [
  christmasTreeConfig,
];

export function getSceneConfig(index) {
  return SCENES[index % SCENES.length];
}

export function getSceneByName(name) {
  return SCENES.find(s => s.name === name) || SCENES[0];
}