"use client";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "../../lib/utils";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uBgColor;
varying vec2 vUv;
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float bayerDither4x4(vec2 uv) {
    float x = mod(uv.x, 4.0);
    float y = mod(uv.y, 4.0);
    float index = floor(y) * 4.0 + floor(x);
    if (index < 1.0) return 0.0;
    if (index < 2.0) return 8.0 / 16.0;
    if (index < 3.0) return 2.0 / 16.0;
    if (index < 4.0) return 10.0 / 16.0;
    if (index < 5.0) return 12.0 / 16.0;
    if (index < 6.0) return 4.0 / 16.0;
    if (index < 7.0) return 14.0 / 16.0;
    if (index < 8.0) return 6.0 / 16.0;
    if (index < 9.0) return 3.0 / 16.0;
    if (index < 10.0) return 11.0 / 16.0;
    if (index < 11.0) return 1.0 / 16.0;
    if (index < 12.0) return 9.0 / 16.0;
    if (index < 13.0) return 15.0 / 16.0;
    if (index < 14.0) return 7.0 / 16.0;
    if (index < 15.0) return 13.0 / 16.0;
    return 5.0 / 16.0;
}
void main() {
    vec2 uv = vUv;
    vec2 coord = gl_FragCoord.xy;
    float noise = snoise(uv * 1.5 + vec2(uTime * 0.15, uTime * 0.1)) * 0.25;
    float diagonal = ((1.0 - uv.x) + uv.y) * 0.5;
    float gradient = diagonal * 1.2 + noise;
    vec3 deepBlue = uColor1;
    vec3 paleBlue = uColor2;
    vec3 softBlue = mix(deepBlue, paleBlue, 0.33);
    vec3 lightBlue = mix(deepBlue, paleBlue, 0.66);
    vec3 color;
    if (gradient < 0.3) {
        color = deepBlue;
    } else if (gradient < 0.55) {
        color = softBlue;
    } else if (gradient < 0.8) {
        color = lightBlue;
    } else {
        color = paleBlue;
    }
    float dither = bayerDither4x4(coord);
    float threshold = fract(gradient * 4.0);
    if (gradient < 0.3 && threshold > dither * 0.5) {
        color = softBlue;
    } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
        color = lightBlue;
    } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
        color = paleBlue;
    }
    vec2 cornerDist = vec2(uv.x, uv.y);
    float fadeMask = smoothstep(0.0, 0.25, length(cornerDist));
    color = mix(uBgColor, color, fadeMask);
    float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
    color = mix(color, color * 0.95, (1.0 - vignette) * 0.3);
    gl_FragColor = vec4(color, 1.0);
}
`;

function GradientPlane({ color1, color2, bgColor = "#ffffff", speed = 1 }) {
  const meshRef = useRef(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1000, 1000) },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
      uBgColor: { value: new THREE.Color(bgColor) },
    }),
    [color1, color2, bgColor]
  );
  useFrame((state, delta) => {
    const { size } = state;
    uniforms.uTime.value += delta * speed;
    uniforms.uResolution.value.set(size.width, size.height);
    uniforms.uColor1.value.set(color1);
    uniforms.uColor2.value.set(color2);
    uniforms.uBgColor.value.set(bgColor);
  });
  return (
    <mesh ref={meshRef} scale={[2, 2, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function HeroGeometric({
  color1 = "#3B82F6",
  color2 = "#F0F9FF",
  bgColor = "#ffffff",
  speed = 1,
  className,
  children,
}) {
  return (
    <div className={cn("relative overflow-hidden bg-transparent", className)}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 1] }}
          dpr={[1, 1]}
          gl={{ antialias: false, alpha: true }}
          style={{ width: '100%', height: '100%' }}
          frameloop="always"
        >
          <GradientPlane color1={color1} color2={color2} bgColor={bgColor} speed={speed} />
        </Canvas>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
