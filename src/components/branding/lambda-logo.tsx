'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LambdaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
  hero: 'w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96',
};

export function LambdaLogo({ 
  className, 
  size = 'md',
  animated = true
}: LambdaLogoProps) {
  const sizeClass = sizeClasses[size];
  
  const LambdaSVG = () => (
    <svg
      viewBox="0 0 200 200"
      className={cn(sizeClass, className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Blue to Green Gradient */}
        <linearGradient id="lambdaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="1" />
          <stop offset="30%" stopColor="#00B8E6" stopOpacity="1" />
          <stop offset="60%" stopColor="#00E6CC" stopOpacity="1" />
          <stop offset="100%" stopColor="#00FFCC" stopOpacity="1" />
        </linearGradient>
        
        {/* Highlight gradient for 3D effect */}
        <linearGradient id="lambdaHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        
        {/* Shadow/Glow filter */}
        <filter id="lambdaGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Inner glow for depth */}
        <filter id="lambdaInnerGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Main Lambda Shape - 3D styled with rounded bottom */}
      <path
        d="M 100 20 
           L 60 120 
           L 80 120 
           L 100 80 
           L 120 120 
           L 140 120 
           L 100 20 Z"
        fill="url(#lambdaGradient)"
        filter="url(#lambdaGlow)"
        className={animated ? "transition-all duration-300" : ""}
      />
      
      {/* Rounded bottom point for more polished look */}
      <ellipse
        cx="100"
        cy="120"
        rx="8"
        ry="4"
        fill="url(#lambdaGradient)"
        filter="url(#lambdaGlow)"
      />
      
      {/* Horizontal bar connecting the legs */}
      <rect
        x="75"
        y="115"
        width="50"
        height="8"
        rx="2"
        fill="url(#lambdaGradient)"
        filter="url(#lambdaGlow)"
      />
      
      {/* Highlight overlay for 3D metallic effect */}
      <path
        d="M 100 20 
           L 60 120 
           L 80 120 
           L 100 80 
           L 120 120 
           L 140 120 
           L 100 20 Z"
        fill="url(#lambdaHighlight)"
        opacity="0.6"
      />
      
      {/* Additional shine on the bar */}
      <rect
        x="75"
        y="115"
        width="50"
        height="8"
        rx="2"
        fill="url(#lambdaHighlight)"
        opacity="0.4"
      />
      
      {/* Subtle inner glow */}
      <path
        d="M 100 25 
           L 65 115 
           L 85 115 
           L 100 75 
           L 115 115 
           L 135 115 
           L 100 25 Z"
        fill="none"
        stroke="url(#lambdaGradient)"
        strokeWidth="1"
        opacity="0.3"
        filter="url(#lambdaInnerGlow)"
      />
    </svg>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative inline-block"
      >
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 10px rgba(0, 255, 204, 0.3))",
              "drop-shadow(0 0 20px rgba(0, 255, 204, 0.5))",
              "drop-shadow(0 0 10px rgba(0, 255, 204, 0.3))",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <LambdaSVG />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="relative inline-block">
      <LambdaSVG />
    </div>
  );
}
