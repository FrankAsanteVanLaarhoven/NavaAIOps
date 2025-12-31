'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HolographicOverlayProps {
  children?: React.ReactNode;
  isActive: boolean;
  onClose?: () => void;
}

export function HolographicOverlay({ children, isActive, onClose }: HolographicOverlayProps) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-50 opacity-100">
      {/* Simplified holographic effect using CSS */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
      
      {/* HOLOGRAPHIC MODE: ON Indicator */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="text-cyan-400 text-xs font-mono animate-pulse border border-cyan-500 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg">
          <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
          HOLOGRAPHIC MODE: ON
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="text-white text-xs font-mono bg-black/50 backdrop-blur-sm px-2 py-1.5 rounded-md hover:bg-black/70 transition-colors border border-slate-700"
            title="Close Holographic Mode"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Animated scan lines effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-1 animate-pulse" style={{ animation: 'scan 3s linear infinite' }}></div>
      </div>

      {children}
    </div>
  );
}
