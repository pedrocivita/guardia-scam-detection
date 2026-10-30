import React, { useEffect, useRef } from 'react';
import HighlightedText from './HighlightedText';
import type { TranscriptEntry } from '../types';

interface CallPanelProps {
  entries: TranscriptEntry[];
  phaseLabel: string;
  reducedMotion: boolean;
}

const CallPanel: React.FC<CallPanelProps> = ({ entries, phaseLabel, reducedMotion }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [entries, reducedMotion]);

  return (
    <section className="relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl lg:h-[680px]" aria-labelledby="call-monitor-title">
      <div className="scanline" aria-hidden="true"></div>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
        <div>
          <h2 id="call-monitor-title" className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Live transcript</h2>
          <p className="text-xs text-slate-500">{phaseLabel}</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">No audio recorded</p>
      </div>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
      >
        {entries.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-500">The call is about to start.</p>
        )}
        {entries.map((entry) => {
          const align = entry.sender === 'user'
            ? 'items-end'
            : entry.sender === 'system'
              ? 'items-center'
              : 'items-start';
          const bubble = entry.sender === 'user'
            ? 'bg-blue-600 text-white'
            : entry.sender === 'system'
              ? 'border border-red-500/50 bg-red-950/50 text-center text-red-100'
              : (entry.highlights?.length
                ? 'border border-red-500/40 bg-slate-900 text-slate-100'
                : 'border border-slate-700 bg-slate-900 text-slate-100');
          const label = entry.sender === 'user' ? 'You' : entry.sender === 'caller' ? 'Caller' : 'GUARD.IA';
          return (
            <div key={entry.id} className={`flex flex-col ${align}`}>
              <div className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[85%] ${bubble}`}>
                <HighlightedText text={entry.text} phrases={entry.highlights} />
              </div>
              <p className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CallPanel;
