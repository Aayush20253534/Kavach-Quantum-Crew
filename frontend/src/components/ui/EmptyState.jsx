import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel,
  onAction,
  action, 
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800/80 bg-[#0d1526]/50", className)}>
      {Icon && (
        <div className="w-14 h-14 mb-4 text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/5">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-100 mb-1 tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  );
}
