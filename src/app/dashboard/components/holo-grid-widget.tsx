'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { GripVertical } from 'lucide-react';

interface HoloWidgetProps {
  id: string;
  title: string;
  children?: React.ReactNode;
  content?: string; // Chart data or text
  type?: 'text' | 'chart';
  position: { x: number; y: number }; // x, y coordinates in pixels
  onPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onResize?: () => void;
}

export function HoloGridWidget({ 
  id, 
  title, 
  children, 
  content, 
  type = 'text', 
  position, 
  onPositionChange,
  onResize 
}: HoloWidgetProps) {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: dndIsDragging,
  } = useDraggable({
    id,
    data: {
      type: 'widget',
      position,
    },
  });

  const style = {
    position: 'absolute' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: '400px',
    minHeight: '250px',
    maxWidth: '90vw',
    zIndex: isDragging || dndIsDragging ? 50 : 10,
    cursor: isDragging || dndIsDragging ? 'grabbing' : 'grab',
    touchAction: 'none' as const,
    ...(transform && {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    }),
  };

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging || dndIsDragging ? 1.02 : 1, 
        y: 0,
        rotate: isDragging || dndIsDragging ? 0.5 : 0,
      }}
      transition={{ duration: 0.2, type: "spring" }}
      className={cn(
        "absolute bg-white/10 backdrop-blur-md border rounded-xl",
        "shadow-[0_20px_25px_rgba(0,0,0,0.1)] overflow-hidden",
        "hover:shadow-[0_25px_30px_rgba(0,0,0,0.15)] transition-shadow",
        theme === 'dark-plus' ? "border-cyan-500/30" : "border-slate-200/20",
        (isDragging || dndIsDragging) && "border-cyan-500/60 shadow-[0_30px_40px_rgba(6,182,212,0.2)]"
      )}
      style={style}
    >
      {/* 1. HEADER (Galaxy Glass) - Draggable Handle */}
      <div 
        {...listeners}
        {...attributes}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onMouseDown={(e) => {
          setIsDragging(true);
          // Allow the drag to proceed
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className={cn(
          "relative overflow-hidden rounded-t-xl bg-gradient-to-br p-4 cursor-grab active:cursor-grabbing select-none",
          theme === 'dark-plus' 
            ? "from-white/10 via-slate-50/50 to-slate-900/10" 
            : "from-slate-50/50 via-white/80 to-slate-100/50"
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Drag Handle Icon */}
            <GripVertical className={cn("w-4 h-4", {
              "text-slate-400": theme === 'light',
              "text-slate-500": theme === 'dark-plus'
            })} />
            {/* Status Indicator */}
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <h3 className={cn("font-sci-fi text-sm font-bold tracking-wide", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              {title}
            </h3>
          </div>
          
          {/* Resize Handle */}
          {onResize && (
            <button 
              type="button"
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                theme === 'light' 
                  ? "bg-slate-100 hover:bg-slate-200" 
                  : "bg-slate-800 hover:bg-slate-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onResize();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18V12H15M2.75L10.25-5.25H12.75M18l4.685-4.685a6 6v6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. CONTENT (Data/Text) */}
      <div className="relative min-h-[180px] overflow-visible p-4">
        {/* If TEXT: Minority Report Style Font */}
        {type === 'text' && content && (
          <p className={cn("font-sci-fi text-xs leading-relaxed whitespace-pre-line break-words", {
            "text-slate-600": theme === 'light',
            "text-slate-300": theme === 'dark-plus'
          })}>
            {content}
          </p>
        )}

        {/* If CHART: Placeholder for Recharts */}
        {type === 'chart' && (
          <div className="h-full w-full min-h-[180px] overflow-visible">
            {children || (
              <div className={cn("flex items-center justify-center h-full text-xs", {
                "text-slate-500": theme === 'light',
                "text-slate-400": theme === 'dark-plus'
              })}>
                [CHART VISUALIZATION]
              </div>
            )}
          </div>
        )}

        {/* Custom children override */}
        {children && type !== 'chart' && (
          <div className="w-full h-full min-h-[180px] overflow-visible">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
