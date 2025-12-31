'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { Canvas } from '@react-three/fiber';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHandTracking, type GestureType } from '@/lib/services/hand-tracking/useHandTracking';
import { IroncladScene } from './ironclad-scene';
import { HoloGridWidget } from './holo-grid-widget';
import { AnalyticsGrid } from './analytics-grid';

interface WidgetPosition {
  x: number;
  y: number;
}

export function MinorityReportDashboard() {
  const { theme } = useTheme();
  const [currentGesture, setCurrentGesture] = useState<GestureType>('IDLE');
  const [gestureEnabled, setGestureEnabled] = useState(false);
  
  // Widget positions state - initialize with defaults, load from localStorage on client
  const [widgetPositions, setWidgetPositions] = useState<Record<string, WidgetPosition>>({
    'widget-1': { x: 50, y: 50 },
    'widget-2': { x: 500, y: 50 },
    'widget-3': { x: 200, y: 400 },
  });
  const [mounted, setMounted] = useState(false);

  // Load positions from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('navaflow-widget-positions');
        if (saved) {
          const parsed = JSON.parse(saved);
          setWidgetPositions(parsed);
        }
      } catch (e) {
        console.warn('Failed to load widget positions:', e);
      }
    }
  }, []);

  // Save positions to localStorage whenever they change (client-side only)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        localStorage.setItem('navaflow-widget-positions', JSON.stringify(widgetPositions));
      } catch (e) {
        console.warn('Failed to save widget positions:', e);
      }
    }
  }, [widgetPositions, mounted]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px of movement before dragging starts
      },
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const widgetId = active.id as string;
    
    if (delta && widgetPositions[widgetId]) {
      setWidgetPositions((prev) => ({
        ...prev,
        [widgetId]: {
          x: prev[widgetId].x + delta.x,
          y: prev[widgetId].y + delta.y,
        },
      }));
    }
  };

  // Handle global gestures
  const handleGlobalGesture = (gesture: GestureType) => {
    console.log('Global Gesture:', gesture);
    setCurrentGesture(gesture);
    
    // Map gestures to actions
    switch (gesture) {
      case 'PINCH':
        // Expand widget
        break;
      case 'SCROLL_UP':
        // Scroll up
        break;
      case 'SCROLL_DOWN':
        // Scroll down
        break;
      case 'GRAB':
        // Select widget
        break;
      case 'FIST':
        // Close widget
        break;
      case 'OPEN_PALM':
        // Open menu
        break;
    }
  };

  const { currentGesture: detectedGesture, trackingState, confidence } = useHandTracking({
    onGesture: handleGlobalGesture,
    enabled: gestureEnabled,
  });

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      {/* --- 1. THE BACKGROUND: PARTICLE RAIN --- */}
      <IroncladScene />

      {/* --- 2. THE FOREGROUND: COMMAND DECK & GRID --- */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        
        {/* --- 2.1 TOP BAR (SYSTEM STATUS) --- */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
          {/* Status Indicator */}
          <div className="w-3 h-3 rounded-full border-2 border-cyan-500/30 animate-pulse bg-green-500"></div>
          <span className={cn("text-xs font-bold font-sci-fi", {
            "text-white": theme === 'dark-plus',
            "text-slate-700": theme === 'light'
          })}>
            OPS INTELLIGENCE
          </span>
        </div>

        {/* --- 2.2 CENTER LAYER: HOLOGRAPHIC GRID --- */}
        <div className="absolute top-16 left-4 right-4 bottom-20 z-10 w-[calc(100%-2rem)] h-[calc(100%-8rem)] pointer-events-auto overflow-visible">
          <DndContext 
            sensors={sensors} 
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="relative w-full h-full overflow-visible">
              {/* Example: A "Threat Monitoring" Widget at center */}
              <HoloGridWidget 
                id="widget-1" 
                title="THREAT MONITORING" 
                position={widgetPositions['widget-1'] || { x: 50, y: 50 }}
                onPositionChange={(id, pos) => setWidgetPositions(prev => ({ ...prev, [id]: pos }))}
                type="chart"
              >
                <AnalyticsGrid />
              </HoloGridWidget>
              
              {/* Example: A "Server Status" Widget at top right */}
              <HoloGridWidget 
                id="widget-2" 
                title="SERVER STATUS" 
                position={widgetPositions['widget-2'] || { x: 500, y: 50 }}
                onPositionChange={(id, pos) => setWidgetPositions(prev => ({ ...prev, [id]: pos }))}
                type="text" 
                content="SYSTEM HEALTH: 98%\nCPU: 34%\nRAM: 67%\nNETWORK: GOOD" 
              />

              {/* Example: A "Recent Log" Widget at bottom */}
              <HoloGridWidget 
                id="widget-3" 
                title="SYSTEM LOGS" 
                position={widgetPositions['widget-3'] || { x: 200, y: 400 }}
                onPositionChange={(id, pos) => setWidgetPositions(prev => ({ ...prev, [id]: pos }))}
                type="text" 
                content="[10:45] DETECTED: RAM LEAK\n[10:42] RESOLVED: DB CONNECTION\n[10:40] ALERT: HIGH LATENCY" 
              />
            </div>
          </DndContext>
        </div>

        {/* --- 2.3 RIGHT SIDEBAR (CONTROLS) --- */}
        <div className="absolute top-4 right-4 z-20 w-64 pointer-events-auto">
          {/* --- HAND TRACKING VISUALIZER (Minority Report Style) --- */}
          <div className={cn(
            "p-4 border rounded-lg backdrop-blur-xl",
            theme === 'dark-plus' 
              ? "border-cyan-500/30 bg-black/80" 
              : "border-slate-300 bg-white/80"
          )}>
            <h2 className={cn("font-sci-fi text-sm mb-2", {
              "text-white": theme === 'dark-plus',
              "text-slate-900": theme === 'light'
            })}>
              GESTURE CONTROL
            </h2>
            
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setGestureEnabled(!gestureEnabled)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  gestureEnabled
                    ? "bg-green-500 text-white"
                    : theme === 'dark-plus'
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-200 text-slate-700"
                )}
              >
                {gestureEnabled ? 'TRACKING: ON' : 'TRACKING: OFF'}
              </button>
            </div>

            <div className={cn("text-xs mb-4 space-y-2", {
              "text-slate-400": theme === 'dark-plus',
              "text-slate-500": theme === 'light'
            })}>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", {
                  "bg-slate-800": theme === 'dark-plus',
                  "bg-slate-300": theme === 'light'
                })}></div>
                <span className="text-xs">PALM TRACKER</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full border-2", {
                  "border-slate-700 bg-slate-900": theme === 'dark-plus',
                  "border-slate-400 bg-slate-100": theme === 'light'
                })}></div>
                <span className={cn("text-xs", {
                  "text-cyan-400": theme === 'dark-plus',
                  "text-cyan-600": theme === 'light'
                })}>HANDS</span>
              </div>
            </div>

            {/* --- GLOBAL GESTURE STATUS --- */}
            <div className="mt-4 text-center">
              <span className={cn("text-lg font-bold font-sci-fi", {
                "text-white": theme === 'dark-plus',
                "text-slate-900": theme === 'light'
              })}>
                COMMAND: <span id="current-gesture-text" className={cn({
                  "text-cyan-400": theme === 'dark-plus',
                  "text-cyan-600": theme === 'light'
                })}>{currentGesture}</span>
              </span>
              {confidence > 0 && (
                <div className={cn("text-xs mt-1", {
                  "text-slate-400": theme === 'dark-plus',
                  "text-slate-500": theme === 'light'
                })}>
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- 3. BOTTOM BAR (INTEGRATIONS) --- */}
        <div className="absolute bottom-4 left-4 right-4 z-20 w-[calc(100%-2rem)] pointer-events-auto">
          <div className={cn(
            "p-4 border rounded-lg backdrop-blur-xl",
            theme === 'dark-plus' 
              ? "border-cyan-500/30 bg-black/60" 
              : "border-slate-300 bg-white/80"
          )}>
            <div className="flex items-center gap-4">
              <span className={cn("text-xs font-sci-fi", {
                "text-white": theme === 'dark-plus',
                "text-slate-700": theme === 'light'
              })}>
                INTEGRATIONS READY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden video element for hand tracking */}
      {gestureEnabled && (
        <video
          id="video-input"
          autoPlay
          playsInline
          muted
          className="hidden"
          style={{ width: 640, height: 480 }}
        />
      )}
    </div>
  );
}
