import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  className
}) => {
  return (
    <div 
      className={cn(
        "flex items-center text-xs px-2 py-1 rounded-full transition-opacity",
        isConnected 
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" 
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        className
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3 mr-1" />
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}; 