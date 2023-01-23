uniform float time;
varying vec2 vUv;
uniform vec3 uMin;
uniform vec3 uMax;
uniform vec2 pixels;
varying float vDebug;
float radius = .5;

float PI = 3.141592653589793238;

float mapRange(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

void main() {
	float rangeX = mapRange(position.x, uMin.x, uMax.x, -PI, PI);
	vec3 dir = vec3(sin(rangeX), cos(rangeX), 0.);
	vec3 pos = radius*dir + vec3(0.,0.,position.z) + dir*position.y;

  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}