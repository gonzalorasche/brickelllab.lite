const i={speed:.9,scale:1.5,brightness:1,color1:"#f7f7f7",color2:"#e100ff",noiseFrequency:2.5,noiseAmplitude:1,bandHeight:.45,bandSpread:1.8,octaveDecay:.07,layerOffset:.1,colorSpeed:.8,mouseInfluence:.2},k=640,P={bandHeight:.81,brightness:.9},K=33,J=.033,Q=1.5,O=.05,Z=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`,$=`
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}`;function _(n){const c=parseInt(n.replace("#",""),16);return[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255]}function G(n,c,r){const e=n.createShader(c);return e?(n.shaderSource(e,r),n.compileShader(e),n.getShaderParameter(e,n.COMPILE_STATUS)?e:(n.deleteShader(e),null)):null}function ee(n,c){var H;const r=document.createElement("canvas");r.style.width="100%",r.style.height="100%",r.style.display="block";const e=r.getContext("webgl",{alpha:!0,antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1});if(!e)return null;const v=G(e,e.VERTEX_SHADER,Z),p=G(e,e.FRAGMENT_SHADER,$),l=v&&p?e.createProgram():null;if(!v||!p||!l||(e.attachShader(l,v),e.attachShader(l,p),e.linkProgram(l),!e.getProgramParameter(l,e.LINK_STATUS)))return null;e.useProgram(l);const I=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,I),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const S=e.getAttribLocation(l,"position");e.enableVertexAttribArray(S),e.vertexAttribPointer(S,2,e.FLOAT,!1,0,0);const o=t=>e.getUniformLocation(l,t),A=o("uTime"),D=o("uResolution"),z=o("uMouse"),[q,N,U]=_(i.color1),[W,V,X]=_(i.color2);e.uniform1f(o("uSpeed"),i.speed),e.uniform1f(o("uScale"),i.scale);const Y=o("uBandHeight"),j=o("uBrightness");e.uniform3f(o("uColor1"),q,N,U),e.uniform3f(o("uColor2"),W,V,X),e.uniform1f(o("uNoiseFreq"),i.noiseFrequency),e.uniform1f(o("uNoiseAmp"),i.noiseAmplitude),e.uniform1f(o("uBandSpread"),i.bandSpread),e.uniform1f(o("uOctaveDecay"),i.octaveDecay),e.uniform1f(o("uLayerOffset"),i.layerOffset),e.uniform1f(o("uColorSpeed"),i.colorSpeed),e.uniform1f(o("uMouseInfluence"),i.mouseInfluence),e.uniform1i(o("uEnableMouse"),c?0:1),e.disable(e.BLEND),e.clearColor(0,0,0,0),n.appendChild(r);const E=()=>{const t=window.innerWidth<=k;e.uniform1f(Y,t?P.bandHeight:i.bandHeight),e.uniform1f(j,t?P.brightness:i.brightness)};E();const h=()=>{const t=Math.min(window.devicePixelRatio||1,Q),a=Math.max(1,Math.round(n.clientWidth*t)),d=Math.max(1,Math.round(n.clientHeight*t));(r.width!==a||r.height!==d)&&(r.width=a,r.height=d,e.viewport(0,0,a,d),e.uniform3f(D,a,d,a/d))};let R=0,f=0,C=0,g=!0;const s=[.5,.5],u=[.5,.5],x=()=>{e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLES,0,3)},L=t=>{f=requestAnimationFrame(L),!(t-C<K)&&(C=t,h(),R+=J,s[0]+=O*(u[0]-s[0]),s[1]+=O*(u[1]-s[1]),e.uniform1f(A,R),e.uniform2f(z,s[0],s[1]),x())},y=()=>{!f&&!c&&(f=requestAnimationFrame(L))},b=()=>{f&&cancelAnimationFrame(f),f=0};h(),e.uniform1f(A,0),e.uniform2f(z,.5,.5),x();const T=t=>{const a=n.getBoundingClientRect();!a.width||!a.height||(u[0]=(t.clientX-a.left)/a.width,u[1]=1-(t.clientY-a.top)/a.height)},w=()=>{u[0]=.5,u[1]=.5},m=(H=n.parentElement)!=null?H:n;c||(m.addEventListener("pointermove",T),m.addEventListener("pointerleave",w));const B=new IntersectionObserver(t=>{g=t.some(a=>a.isIntersecting),g?y():b()},{threshold:0});B.observe(n);const M=()=>{document.hidden?b():g&&y()};document.addEventListener("visibilitychange",M);const F=()=>{E(),h(),(c||!f)&&x()};return window.addEventListener("resize",F),c||y(),()=>{var t;b(),B.disconnect(),m.removeEventListener("pointermove",T),m.removeEventListener("pointerleave",w),document.removeEventListener("visibilitychange",M),window.removeEventListener("resize",F),(t=e.getExtension("WEBGL_lose_context"))==null||t.loseContext(),r.remove()}}export{ee as montarLuz};
