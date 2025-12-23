export default `
precision mediump float;
varying vec2 vUv;
uniform vec3 colorTop;
uniform vec3 colorBottom;
void main() {
  gl_FragColor = vec4(mix(colorBottom, colorTop, vUv.y), 1.0);
}
`