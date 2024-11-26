varying vec3 color;
varying vec3 normal;
varying vec3 light;
void main() {
  color = gl_Color.rgb;
  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}

,

varying vec3 color;
varying vec3 normal;
varying vec3 light;
void main() {
  gl_FragColor = vec4(color, 1.0);
}
