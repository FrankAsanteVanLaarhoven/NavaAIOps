'use client';
import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Scan, CheckCircle2, User } from 'lucide-react';

// Hand Model Component (must be inside Canvas)
function HandModel({ scanStatus, isHaloActive }: { scanStatus: string; isHaloActive: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Create hand geometry using useMemo
  const handGeometry = useMemo(() => {
    const group = new THREE.Group();
    
    // Palm
    const palmGeo = new THREE.CylinderGeometry(2, 1.5, 0.3, 32);
    const palmMat = new THREE.MeshStandardMaterial({ 
      color: 0x88cc88,
      emissive: isHaloActive ? 0x00ffcc : 0x000000,
      emissiveIntensity: isHaloActive ? 0.5 : 0
    });
    const palmMesh = new THREE.Mesh(palmGeo, palmMat);
    palmMesh.position.set(0, 0, 0);
    palmMesh.rotation.x = -Math.PI / 2;
    group.add(palmMesh);

    // Fingers (using CylinderGeometry as CapsuleGeometry may not be available)
    const fingerGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
    const fingerMat = new THREE.MeshStandardMaterial({ color: 0x88cc88 });
    const fingerPositions = [
      [0.8, 1.5, 0.2], [1.2, 2.2, 0.2], [1.6, 3.2, 0.2], [2.0, 4.5, 0.2],
    ];

    fingerPositions.forEach((pos) => {
      const mesh = new THREE.Mesh(fingerGeo, fingerMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      group.add(mesh);
    });

    // Wrist
    const wristGeo = new THREE.SphereGeometry(1, 32, 32);
    const wristMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const wristMesh = new THREE.Mesh(wristGeo, wristMat);
    wristMesh.position.set(0, 0.5, 0);
    group.add(wristMesh);

    return group;
  }, [isHaloActive]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Animate rotation during scan
    if (scanStatus === 'scanning') {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.5;
    }

    // Halo pulse effect
    if (isHaloActive && meshRef.current.children.length > 0) {
      const palmMesh = meshRef.current.children[0] as THREE.Mesh;
      if (palmMesh && palmMesh.material) {
        const mat = palmMesh.material as THREE.MeshStandardMaterial;
        if (mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
        }
      }
    }
  });

  return <primitive object={handGeometry} ref={meshRef} />;
}

export function PalmDisplay() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'printing' | 'enrolled'>('idle');
  const [authScore, setAuthScore] = useState(0);
  const [isHaloActive, setIsHaloActive] = useState(false);

  const handlePalmScan = () => {
    setScanStatus('scanning');
    setIsHaloActive(true);
    setAuthScore(95);

    setTimeout(() => {
      setScanStatus('printing');
      setAuthScore(100);
    }, 2000);
  };

  const handleReset = () => {
    setScanStatus('idle');
    setIsHaloActive(false);
    setAuthScore(0);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] border border-[#1a1a1f] overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows="soft"
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(to bottom, #050505, #141416)' }}
        >
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
          <ambientLight intensity={0.1} color="#ffffff" />
        </Canvas>
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-6 z-20">
          <h1 className="text-5xl font-bold text-white tracking-tight">BIOMETRIC COMMAND CENTER</h1>
          <div className="flex items-center gap-4">
            <div className={cn("px-4 py-2 rounded-lg border flex items-center gap-2", {
              "bg-slate-900 border-[#1a1a1f]/50": true
            })}>
              <Scan className="w-6 h-6 text-[#00ffcc]" />
              <span className="font-bold text-white">PALM INTERACTION</span>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-slate-400 hover:text-slate-600 border-[#1a1a1f]/50 hover:border-slate-300 bg-slate-900 hover:bg-slate-800"
              onClick={handleReset}
            >
              <User className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </div>
        </div>

        {/* 3D Palm Visualizer */}
        <div className="relative w-full max-w-2xl h-[500px] rounded-xl border border-[#1a1a1f]/30 shadow-2xl bg-black/40 backdrop-blur-xl z-10">
          <Canvas
            shadows="soft"
            camera={{ position: [0, 0, 10], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <pointLight position={[5, 2, 5]} intensity={2} color="#ffffff" />
            <ambientLight intensity={0.3} />
            <HandModel scanStatus={scanStatus} isHaloActive={isHaloActive} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>

          {/* HUD Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-black/60 via-black/20 to-transparent">
            <Button
              type="button"
              size="lg"
              onClick={handlePalmScan}
              disabled={scanStatus === 'scanning' || scanStatus === 'printing'}
              className={cn(
                "relative px-12 py-6 rounded-xl border-2 font-bold text-white tracking-wider transition-all",
                "bg-slate-900 hover:bg-[#00ffcc] border-[#1a1a1f]",
                "shadow-[0_0_15px_rgba(0,255,204,0)] hover:shadow-[0_0_15px_rgba(0,255,204,0.5)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {scanStatus === 'idle' && "SCAN PALM FOR LOGIN"}
              {scanStatus === 'scanning' && (
                <>
                  <Scan className="w-5 h-5 animate-spin mr-3" />
                  PROCESSING BIOMETRICS...
                </>
              )}
              {scanStatus === 'printing' && (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-3" />
                  VERIFYING IDENTITY...
                </>
              )}
              {(scanStatus === 'scanning' || scanStatus === 'printing') && (
                <div className="absolute top-0 right-0 p-2 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_10px_rgba(0,255,204,0.5)]">
                  <span className="text-[#050505] font-bold tracking-tight">ACTIVE</span>
                </div>
              )}
            </Button>

            {/* Status Text */}
            <div className="mt-4 text-center">
              {scanStatus === 'idle' && (
                <p className="text-white font-mono text-lg">READY FOR BIOMETRIC SCAN</p>
              )}
              {scanStatus === 'scanning' && (
                <p className="text-[#00ffcc] font-mono text-lg animate-pulse">SCANNING PALM...</p>
              )}
              {scanStatus === 'printing' && (
                <p className="text-green-500 font-mono text-lg">PRINTING IDENTITY...</p>
              )}
            </div>

            {/* Bio-Metrics Display */}
            <div className="absolute bottom-4 left-4 p-4 bg-black/80 rounded-lg border border-slate-800 w-2/3 max-w-sm">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Bio-Metric Score</p>
              <div className="text-4xl font-bold text-white font-mono" style={{ color: authScore > 90 ? '#22c55e' : '#64748b' }}>
                {authScore.toFixed(0)}
                <span className="text-lg text-slate-400">%</span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden mt-2">
                <div 
                  className={cn("h-full transition-all duration-1000", {
                    "bg-green-500": authScore > 90,
                    "bg-yellow-500": authScore >= 50 && authScore <= 90,
                    "bg-red-500": authScore < 50
                  })} 
                  style={{ width: `${authScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
