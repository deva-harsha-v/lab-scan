import React from 'react';

/**
 * Wraps a stage and shows a locked overlay if the stage is not yet unlocked.
 */
export default function StageUnlockGuard({ unlocked, lockMessage, children }) {
  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[200px]">
      <div className="pointer-events-none opacity-30 select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70 backdrop-blur-sm rounded-xl">
        <div className="w-14 h-14 bg-slate-700 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-slate-300 text-sm font-medium text-center max-w-xs px-4">
          {lockMessage || 'This stage is locked'}
        </p>
      </div>
    </div>
  );
}
