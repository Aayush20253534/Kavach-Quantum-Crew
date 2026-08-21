import React from 'react';
import { cn } from '../../lib/utils';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 mb-4 text-gray-400 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
