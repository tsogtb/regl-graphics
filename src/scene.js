import { mat4 } from "https://esm.sh/gl-matrix"


export function createStarData(regl) {
  const NUM_STARS = 100000;
  const positions = new Float32Array(NUM_STARS * 3);
  const colors = new Float32Array(NUM_STARS * 3);


  const palette = [
    [1.0, 0.85, 0.7],  // Warm White
    [1.0, 0.4, 0.2],   // Deep Orange
    [0.5, 0.7, 1.0],   // Soft Blue
    [1.0, 1.0, 1.0],   // Pure White
    [1.0, 0.95, 0.4]   // Yellowish
  ];

  for (let i = 0; i < NUM_STARS; i++) {
		const theta = Math.random() * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * Math.random() - 1.0);
    
    const t = Math.random();
    
    let r;
    if (t > 0.2) {
        r = 50.0 + Math.random() * 100.0;
    } else {
        r = 3.0 + Math.random() * 50.0;
    }

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const baseColor = palette[Math.floor(Math.random() * palette.length)];
    const brightness = 0.4 + Math.random() * 0.6;
    
    colors[i * 3 + 0] = baseColor[0] * brightness;
    colors[i * 3 + 1] = baseColor[1] * brightness;
    colors[i * 3 + 2] = baseColor[2] * brightness;
  }

  return {
    buffer: regl.buffer(positions),
    colorBuffer: regl.buffer(colors),
    count: NUM_STARS
  };
}

function createCubeGeometry() {
  return {
    positions: [
      [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], 
      [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1], 
    ],
    elements: [
      [0, 1, 2], [0, 2, 3], 
      [4, 6, 5], [4, 7, 6], 
      [0, 3, 7], [0, 7, 4], 
      [1, 5, 6], [1, 6, 2], 
      [1, 0, 4], [1, 4, 5], 
      [3, 2, 6], [3, 6, 7], 
    ]
  }
}

export function createScene() {
  const cube = createCubeGeometry()
  const scene = {
    meshes: []
  }

  const addBox = (name, pos, size, color) => {
    const modelMatrix = mat4.create()
    mat4.translate(modelMatrix, modelMatrix, pos)
    mat4.scale(modelMatrix, modelMatrix, size)

    scene.meshes.push({
      name,
      positions: cube.positions,
      elements: cube.elements,
      color,
      modelMatrix
    })
  }

  addBox("floor", [0.0, 0.0, 0.0], [5, 5, 5], [0.2, 0.2, 0.2])
  
  //addBox("ceiling", [-10, 4, -10], [20, 0.1, 20], [0.15, 0.15, 0.2])

  //addBox("wall-back", [-10, 0, -10], [20, 4, 0.5], [0.6, 0.6, 0.6])
  
  //addBox("wall-left", [-10, 0, -10], [0.5, 4, 20], [0.5, 0.5, 0.5])

  //addBox("wall-right", [9.5, 0, -10], [0.5, 4, 20], [0.5, 0.5, 0.5])

  //addBox("pedestal", [-1, 0, -2], [2, 1, 2], [0.8, 0.1, 0.1])

  return scene
}