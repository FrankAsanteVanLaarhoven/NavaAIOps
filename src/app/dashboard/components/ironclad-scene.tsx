'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

// --- A. THE DATA RAIN EFFECT (MINORITY REPORT) ---
function ParticleRain() {
  const particleCount = 1500;
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!particlesRef.current) return;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 50; // Spread X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // Spread Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // Spread Z

      velocities[i * 3] = 0;
      velocities[i * 3 + 1] = -0.05; // Fall Down
      velocities[i * 3 + 2] = -0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    positionsRef.current = positions;
    velocitiesRef.current = velocities;

    const material = new THREE.PointsMaterial({
      color: 0x00ffcc, // Cyan Data Stream
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    particlesRef.current.geometry = geometry;
    particlesRef.current.material = material;
  }, []);

  useFrame(() => {
    if (!particlesRef.current || !positionsRef.current || !velocitiesRef.current) return;

    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const geometry = particlesRef.current.geometry;

    for (let i = 0; i < particleCount; i++) {
      // Update positions based on velocities
      positions[i * 3 + 1] += velocities[i * 3 + 1];
      positions[i * 3 + 2] += velocities[i * 3 + 2];

      // Reset if fallen too far
      if (positions[i * 3 + 1] < -25) {
        positions[i * 3 + 1] = 25;
        positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      }
    }

    if (geometry.attributes.position) {
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return <points ref={particlesRef} />;
}

// --- B. THE FOG EFFECT (ATMOSPHERE) ---
function FogEffect() {
  return <fogExp2 attach="fog" args={[0x0a0f24, 1, 50]} />; // Dark Blue Fog
}

// --- C. THE GRID (HOLOGRAPHIC LAYER) ---
function HolographicGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  return (
    <>
      <gridHelper ref={gridRef} args={[22, 14, 0x00ffcc, 0x0066cc]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={0x00ffcc} />
    </>
  );
}

// --- MAIN SCENE COMPONENT ---
export function IroncladScene() {
  const { theme } = useTheme();

  return (
    <div className={cn("absolute inset-0 pointer-events-none transition-opacity duration-700", {
      "bg-white": theme === 'light',
      "bg-[#050505]": theme === 'dark-plus'
    })}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        shadows="soft"
        gl={{ antialias: true, alpha: true }}
      >
        {/* 1. PARTICLE RAIN (Minority Report Data Stream) */}
        <ParticleRain /> 

        {/* 2. THE FLOATING GRID (HOLOGRAPHIC LAYER) */}
        <HolographicGrid />

        {/* 3. STARS BACKGROUND */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Camera Controls */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>

      {/* HUD Overlay (Outside Canvas) */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {/* Mode Indicator */}
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", {
              "bg-green-500": theme === 'light',
              "bg-[#050505] border border-cyan-500/50 animate-pulse": theme === 'dark-plus',
            })}></div>
            <span className={cn("text-xs font-bold font-sci-fi", {
              "text-green-600": theme === 'light',
              "text-slate-300": theme === 'dark-plus'
            })}>
              HOLOGRAPHIC MODE: ON
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
