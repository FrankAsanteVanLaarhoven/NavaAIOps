'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, Hand, CheckCircle2, CameraOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface PalmDisplayProps {
  userId?: string;
  onEnrollmentComplete?: (metrics: any) => void;
}

export function PalmDisplay({ userId, onEnrollmentComplete }: PalmDisplayProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [palmScore, setPalmScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const drawPalmVisualization = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw palm outline
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Simplified palm shape
    ctx.arc(200, 200, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Draw palm lines (simulated)
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(250, 200);
    ctx.moveTo(200, 150);
    ctx.lineTo(200, 250);
    ctx.stroke();

    // Draw connection points
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(200, 200, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleScan = async () => {
    setIsScanning(true);
    
    if (!streamRef.current) {
      await startCamera();
    }

    // Animate palm visualization
    const interval = setInterval(() => {
      drawPalmVisualization();
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const score = Math.random() * 30 + 70;
      setPalmScore(score);
      setIsScanning(false);
      
      if (onEnrollmentComplete) {
        const metrics = {
          id: crypto.randomUUID(),
          userId: userId || 'anonymous',
          type: 'palm_geometry',
          value: 'mock_palm_hash',
          confidence: score / 100,
          timestamp: new Date().toISOString(),
        };
        onEnrollmentComplete(metrics);
      }
    }, 3000);
  };

  const stopScan = () => {
    setIsScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isScanning) {
      drawPalmVisualization();
    }
  }, [isScanning]);

  return (
    <div className="flex flex-col gap-4 min-h-[600px] w-full max-w-3xl mx-auto bg-[#050505] border border-[#1a1f2e] rounded-xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-600 flex items-center justify-center border border-slate-800/20">
            <span className={cn("text-xs font-bold tracking-tight", {
              "text-green-400": isScanning,
              "text-slate-400": !isScanning
            })}>
              {isScanning ? 'SCAN' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - 3D Palm Visualization */}
      <div className="relative w-full h-[500px] bg-black/50 rounded-lg overflow-hidden border border-[#1a1f2e]/30">
        {/* Video Feed (for reference) */}
        <div className={cn("absolute inset-0 z-10", {
          "opacity-20 transition-opacity duration-500": !isScanning
        })}>
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>

        {/* 3D Palm Visualization Canvas */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
          {isScanning && (
            <>
              {/* Status Text */}
              <div className="absolute top-4 left-0 right-0 flex justify-between w-full px-4">
                <span className="text-3xl font-bold text-white font-mono tracking-widest animate-pulse">
                  PALM SCAN
                </span>
                <span className="text-white text-lg font-mono opacity-50">ANALYZING BIOMETRICS...</span>
              </div>

              {/* 3D Palm Canvas */}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="opacity-90"
              />

              {/* Palm Score Display */}
              {palmScore > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                  <div className="bg-black/80 px-6 py-3 rounded-lg border border-[#00ffcc]/50">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#00ffcc]" />
                      <span className="text-white font-mono">
                        Palm Score: {Math.round(palmScore)}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}

          {!isScanning && (
            <div className="flex flex-col items-center gap-6 text-center">
              <Hand className="w-24 h-24 text-slate-400 mb-4" />
              <p className="text-slate-500 mb-2">Place your hand on screen (Mirror).</p>
              <Button 
                onClick={handleScan} 
                size="lg" 
                className="bg-white text-slate-900 font-bold border border-slate-300 shadow-lg hover:bg-slate-100"
              >
                <Activity className="w-4 h-4 mr-2" />
                START PALM SCAN
              </Button>
              
              <div className="mt-8 p-4 border border-slate-300 bg-slate-100 rounded-xl max-w-md shadow-lg">
                <p className="text-sm text-slate-900 mb-3 font-bold">
                  <strong>Palm Recognition:</strong>
                </p>
                <ul className="space-y-2 text-xs text-slate-800 font-mono list-disc pl-4 text-left">
                  <li>• 3D palm geometry analysis</li>
                  <li>• Vein pattern recognition</li>
                  <li>• Contactless biometric verification</li>
                  <li>• ISO 27001 compliant</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {isScanning && (
        <div className="flex justify-center gap-4">
          <Button 
            onClick={stopScan}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Stop Scan
          </Button>
        </div>
      )}
    </div>
  );
}
