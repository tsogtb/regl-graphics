export default `

precision mediump float;
varying vec3 vColor;
varying float vSizeFactor;

void main() {
    float dist = length(gl_PointCoord.xy - 0.5);
    if (dist > 0.5) discard;

    float glow = pow(1.0 - dist * 2.0, 4.0);

    float core = pow(1.0 - dist * 2.0, 10.0) * 2.0;
    
    gl_FragColor = vec4(vColor, (glow + core)*vSizeFactor);
}
`