'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import type { AuraData } from '@aura/shared'

// Custom GLSL shader for the aura effect
const AuraMaterial = shaderMaterial(
  {
    uTime: 0,
    uPrimaryColor: new THREE.Color('#6366f1'),
    uSecondaryColor: new THREE.Color('#ec4899'),
    uTertiaryColor: new THREE.Color('#f59e0b'),
    uIntensity: 0.7,
    uSpeed: 0.4,
    uComplexity: 0.6,
    uPattern: 0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uComplexity;

    void main() {
      vUv = uv;
      vPosition = position;

      float displacement = sin(position.x * uComplexity * 3.0 + uTime * uSpeed) *
                          cos(position.y * uComplexity * 2.0 + uTime * uSpeed * 0.7) * 0.1;

      vec3 newPosition = position + normal * displacement;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uTertiaryColor;
    uniform float uIntensity;
    uniform float uSpeed;
    uniform float uComplexity;
    uniform float uPattern;

    // Simplex-like noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * uSpeed;

      // Generate layered noise for organic movement
      float n1 = snoise(uv * uComplexity * 3.0 + vec2(t * 0.3, t * 0.2));
      float n2 = snoise(uv * uComplexity * 5.0 - vec2(t * 0.2, t * 0.4));
      float n3 = snoise(uv * uComplexity * 2.0 + vec2(t * 0.1, -t * 0.15));

      float noise = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * 0.5 + 0.5;

      // Radial gradient for edge fade
      float dist = distance(uv, vec2(0.5));
      float radial = 1.0 - smoothstep(0.3, 0.5, dist);

      // Color mixing based on noise layers
      vec3 color = mix(uPrimaryColor, uSecondaryColor, n1 * 0.5 + 0.5);
      color = mix(color, uTertiaryColor, n2 * 0.3 + 0.3);

      // Add luminous core
      float core = exp(-dist * 4.0) * uIntensity;
      color += core * uPrimaryColor * 0.5;

      float alpha = noise * radial * uIntensity;
      alpha = clamp(alpha, 0.0, 0.95);

      gl_FragColor = vec4(color, alpha);
    }
  `
)

extend({ AuraMaterial })

function AuraMesh({ auraData }: { auraData: AuraData }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)

  const primaryColor = useMemo(() => new THREE.Color(auraData.primaryColor), [auraData.primaryColor])
  const secondaryColor = useMemo(() => new THREE.Color(auraData.secondaryColor), [auraData.secondaryColor])
  const tertiaryColor = useMemo(() => new THREE.Color(auraData.tertiaryColor), [auraData.tertiaryColor])

  const patternIndex = useMemo(() => {
    const patterns = ['waves', 'particles', 'geometric', 'fluid', 'crystalline']
    return patterns.indexOf(auraData.pattern)
  }, [auraData.pattern])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uTime = clock.getElapsedTime()
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.1) * 0.05
    }
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2.4, 2.4, 64, 64]} />
      {/* @ts-ignore */}
      <auraMaterial
        ref={materialRef}
        transparent
        uPrimaryColor={primaryColor}
        uSecondaryColor={secondaryColor}
        uTertiaryColor={tertiaryColor}
        uIntensity={auraData.intensity}
        uSpeed={auraData.speed}
        uComplexity={auraData.complexity}
        uPattern={patternIndex}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

interface AuraCanvasProps {
  auraData: AuraData
  size?: number
  className?: string
  interactive?: boolean
}

export function AuraCanvas({ auraData, size = 320, className = '' }: AuraCanvasProps) {
  return (
    <div
      className={`relative rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{
          background: `radial-gradient(circle, ${auraData.primaryColor}, ${auraData.secondaryColor}, transparent)`,
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 2], fov: 60 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <AuraMesh auraData={auraData} />
      </Canvas>

      {/* Trait indicators */}
      {auraData.traits.length > 0 && (
        <div className="absolute inset-0 rounded-full">
          {auraData.traits.map((trait, i) => {
            const angle = (i / auraData.traits.length) * Math.PI * 2 - Math.PI / 2
            const r = size * 0.42
            const x = Math.cos(angle) * r + size / 2
            const y = Math.sin(angle) * r + size / 2
            return (
              <div
                key={trait.name}
                className="absolute w-2 h-2 rounded-full animate-pulse"
                style={{
                  left: x - 4,
                  top: y - 4,
                  backgroundColor: trait.color,
                  opacity: 0.4 + trait.value * 0.6,
                  boxShadow: `0 0 8px ${trait.color}`,
                }}
                title={`${trait.name}: ${Math.round(trait.value * 100)}%`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
