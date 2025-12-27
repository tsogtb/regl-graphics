export default `
precision mediump float;
varying vec2 vUv;
uniform vec3 colorTop;
uniform vec3 colorBottom;
uniform float uBass;
void main() {
  // Add a faint blue glow that pulses with the bass
    vec3 color = vec3(0.01, 0.01, 0.02); 
    color += vec3(0.0, 0.1, 0.2) * uBass * 1.0; 
    
    gl_FragColor = vec4(color, 1.0);
}
`