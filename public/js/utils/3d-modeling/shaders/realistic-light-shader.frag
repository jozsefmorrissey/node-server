uniform vec3 uLightPosition[16];
uniform vec3 uLightColor[16];
uniform vec3 uLightDirection[16];
uniform bool uLightIsDirectional[16];

uniform vec3 uAmbientColor;

varying vec4 vPosition;
varying vec3 vTransformedNormal;
varying vec3 vColor;

void main(void) {
 vec3 reflectedLightColor;

 for(int i = 0; i < 16; i++) {
   vec3 lightDirection = normalize(uLightPosition[i], vPosition.xyz);
   if (uLightIsDirectional[i]) {
     reflectedLightColor += max(dot(vTransformedNormal, uLightDirection[i]), 0.0) * uLightColor[i];
   }
   else  {
     reflectedLightColor += max(dot(normalize(vTransformedNormal, lightDirection), 0.0) * uLightColor[i];
   }
 }

 glFragColor = vec4(uAmbientColor + reflectedLightColor * vColor, uAlpha);
}
