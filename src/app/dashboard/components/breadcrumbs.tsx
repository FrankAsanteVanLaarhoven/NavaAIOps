'use client';

import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const { theme } = useTheme();

  return (
    <nav className={cn("flex items-center gap-2 text-sm", className)}>
      <Link
        href="/dashboard"
        className={cn("flex items-center gap-1 hover:underline", {
          "text-slate-600 hover:text-slate-900": theme === 'light',
          "text-slate-400 hover:text-slate-200": theme === 'dark-plus'
        })}
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className={cn("w-4 h-4", {
            "text-slate-400": theme === 'light',
            "text-slate-600": theme === 'dark-plus'
          })} />
          {item.href ? (
            <Link
              href={item.href}
              className={cn("flex items-center gap-1 hover:underline", {
                "text-slate-600 hover:text-slate-900": theme === 'light',
                "text-slate-400 hover:text-slate-200": theme === 'dark-plus'
              })}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </Link>
          ) : (
            <span className={cn("flex items-center gap-1", {
              "text-slate-900": theme === 'light',
              "text-slate-100": theme === 'dark-plus'
            })}>
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
