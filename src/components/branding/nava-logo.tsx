'use client';

import { cn } from '@/lib/utils';

interface NavaLogoProps {
  className?: string;
  gradient?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl',
};

export function NavaLogo({ 
  className, 
  gradient = true, 
  size = 'md',
  theme = 'light'
}: NavaLogoProps) {
  const sizeClass = sizeClasses[size];
  
  const baseStyles = gradient
    ? {
        background: 'linear-gradient(to right, #3b82f6 0%, #60a5fa 50%, #e5e7eb 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }
    : theme === 'light'
    ? { color: '#1e293b' }
    : { color: '#f1f5f9' };

  return (
    <span 
      className={cn("font-bold font-cinematic tracking-tight inline-flex items-baseline", sizeClass, className)}
      style={baseStyles}
    >
      <span>NAV</span>
      {/* Lambda symbol (∧) styled to look like an A without the crossbar */}
      <span 
        className="inline-block"
        style={{
          fontFamily: 'inherit',
          fontWeight: 'inherit',
          fontSize: '1em', // Exact same size as NAV letters
          lineHeight: 'inherit', // Match line-height exactly
          letterSpacing: 'inherit', // Match letter spacing exactly
          display: 'inline-block',
          verticalAlign: 'baseline', // Align perfectly with baseline
          // Inherit gradient from parent
          ...(gradient ? {
            background: 'linear-gradient(to right, #3b82f6 0%, #60a5fa 50%, #e5e7eb 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } : {}),
        }}
        aria-label="A"
      >
        ∧
      </span>
    </span>
  );
}
