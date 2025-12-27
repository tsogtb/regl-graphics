export default `

precision mediump float;
attribute vec3 position, color;
uniform mat4 projection, view;
uniform float uTime, uBass; 
varying vec3 vColor;
varying float vSizeFactor; 
varying float vRotation; 

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  float starId = hash(position);

  float twinkle = 0.6 + 0.4 * sin(uTime * 3.0 + starId * 100.0);
  vColor = color * twinkle;

  vec4 mvPosition = view * vec4(position, 1.0);
  gl_Position = projection * mvPosition;

  float baseSize = 40.0 + 80.0 * starId; 
  float perspectiveSize = baseSize / -mvPosition.z;

  gl_PointSize = max(perspectiveSize, 1.5);
  vSizeFactor = clamp(perspectiveSize / 1.5, 0.0, 1.0);
  vRotation = uTime * (1.0 + starId * 4.0) + (starId * 6.28);
}
`