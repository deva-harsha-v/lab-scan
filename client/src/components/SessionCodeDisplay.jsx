import React, { useState } from 'react';

export default function SessionCodeDisplay({ code, status }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusColors = {
    DRAFT: 'text-slate-400 border-slate-600',
    ACTIVE: 'text-green-400 border-green-500/40',
    GRACE: 'text-yellow-400 border-yellow-500/40',
    CLOSED: 'text-red-400 border-red-500/40',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`font-mono text-4xl font-bold tracking-[0.3em] px-6 py-4 rounded-2xl
          bg-slate-800 border-2 ${statusColors[status] || 'text-slate-300 border-slate-600'}
          select-all cursor-pointer`}
        onClick={handleCopy}
        title="Click to copy"
      >
        {code}
      </div>

      <button
        onClick={handleCopy}
        className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-400">Copied!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy code
          </>
        )}
      </button>
    </div>
  );
}
