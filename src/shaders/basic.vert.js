export default `
precision mediump float;

attribute vec3 position;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model; // Added to handle position/scale/rotation

varying vec3 vPosition;

void main() {
  vPosition = position;
  
  // Order matters: Project * View * Model * Position
  gl_Position = projection * view * model * vec4(position, 1.0);
}
`