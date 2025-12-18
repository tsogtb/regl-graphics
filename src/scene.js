export function createScene() {
    return {
      positions: [
        [-1, 0, 0],
        [ 1, 0, 0],
        [ 0, 2, 0],
      ],

      elements: [
        [0, 1, 2] //counter-clockwise = front face
      ]
    }
  }
  