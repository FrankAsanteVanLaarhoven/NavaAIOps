'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GestureControllerProps {
  workspaceId: string;
  onGesture: (gesture: { type: string; params: any }) => void;
}

export function GestureController({
  workspaceId,
  onGesture,
}: GestureControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [expression, setExpression] = useState<string>('neutral');
  const { toast } = useToast();

  useEffect(() => {
    if (!isActive) return;

    let animationFrameId: number;

    const detectGestures = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        // Simplified gesture detection using canvas
        // In production, integrate MediaPipe or TensorFlow.js
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Draw video frame to canvas
        ctx.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // Simplified gesture detection
        // This is a placeholder - in production, use MediaPipe Hands/Face Mesh
        const imageData = ctx.getImageData(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        // Detect basic gestures (simplified)
        // Swipe left: detect motion from right to left
        // Swipe right: detect motion from left to right
        // Push: detect forward motion
        // Pinch: detect two points coming together

        // For now, use keyboard shortcuts as fallback
        // In production, implement full MediaPipe integration

        animationFrameId = requestAnimationFrame(detectGestures);
      } catch (error) {
        console.error('Gesture detection error:', error);
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        detectGestures();
      } catch (error) {
        console.error('Camera access error:', error);
        toast({
          title: 'Camera Access',
          description: 'Please allow camera access for gestures',
          variant: 'destructive',
        });
      }
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onGesture, toast]);

  const toggleGesture = () => {
    setIsActive(!isActive);
    if (!isActive) {
      toast({
        title: 'Gestures Enabled',
        description: 'Wave to navigate, smile to accept',
      });
      if (canvasRef.current) {
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
      }
    }
  };

  // Keyboard shortcuts as fallback
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Simulate gestures with keyboard
      if (e.key === 'ArrowLeft') {
        onGesture({
          type: 'swipe',
          params: { direction: 'left', target: 'lastMessage' },
        });
      } else if (e.key === 'ArrowRight') {
        onGesture({
          type: 'swipe',
          params: { direction: 'right', target: 'nextMessage' },
        });
      } else if (e.key === 'Enter') {
        onGesture({
          type: 'push',
          params: { action: 'reply', target: 'activeThread' },
        });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onGesture({
          type: 'pinch',
          params: { action: 'delete', target: 'activeMessage' },
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, onGesture]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        type="button"
        onClick={toggleGesture}
        variant={isActive ? 'destructive' : 'default'}
        className="flex items-center gap-2"
        size="sm"
      >
        <span>{isActive ? 'Gestures OFF' : 'Gestures ON'}</span>
        <span
          className={`text-xs ml-1 ${
            expression === 'smile' ? 'text-yellow-500' : 'text-muted-foreground'
          }`}
        >
          {expression === 'neutral' ? '😐' : '😊'}
        </span>
      </Button>
      {isActive && (
        <div className="mt-2 flex flex-col items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg p-2 border shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-64 h-48 rounded object-cover"
          />
          <canvas
            ref={canvasRef}
            className="w-64 h-48 rounded object-cover hidden"
          />
          <div className="text-xs text-muted-foreground text-center px-2">
            Try: Arrow keys to navigate, Enter to reply, Delete to remove
          </div>
        </div>
      )}
    </div>
  );
}
