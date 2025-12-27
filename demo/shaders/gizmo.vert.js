export default
`
precision mediump float;
attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;

uniform mat4 view;
uniform float uAspect;
uniform float uViewportHeight;
uniform float uGizmoScale; 
uniform vec2 uAnchor;

void main() {
  vColor = color;

  // 1. Rotate the gizmo based on camera
  vec3 rotatedPos = mat3(view) * position;

  // 2. Normalize to Screen Space
  vec2 hudPos = rotatedPos.xy * uGizmoScale;
  
  // 3. Fix Aspect Ratio (Anti-crush)
  hudPos.x /= uAspect; 

  // 4. THE FIX: Pass the rotated Z value into gl_Position.z
  // We use a small multiplier (0.1) to keep the depth values 
  // inside the standard clip space range (-1 to 1).
  // Push forward-facing axes on top
  float depthBias = rotatedPos.z;

  // Normalize to [-1, 1] safely
  depthBias = clamp(depthBias, -1.0, 1.0);

  // Invert so closer = larger z
  gl_Position = vec4(hudPos + uAnchor, -depthBias * 0.01, 1.0);

  gl_PointSize = uViewportHeight * 0.0025;
}
` 