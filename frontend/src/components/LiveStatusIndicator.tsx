import React from 'react';

interface LiveStatusIndicatorProps {
  isLive: boolean;
  isError?: boolean;
  isLoading?: boolean;
}

export default function LiveStatusIndicator({
  isLive,
  isError = false,
  isLoading = false,
}: LiveStatusIndicatorProps) {
  if (!isLive) return null;

  if (isError) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="block h-2 w-2 rounded-full bg-bear" />
        </span>
        <span className="text-xs font-mono font-semibold text-bear tracking-widest">ERROR</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-bull" />
      </span>
      <span className="text-xs font-mono font-semibold text-bull tracking-widest">
        {isLoading ? 'SYNCING' : 'LIVE'}
      </span>
    </div>
  );
}
