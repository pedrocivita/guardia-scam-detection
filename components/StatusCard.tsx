import React from 'react';

interface StatusCardProps {
  tone: 'idle' | 'live' | 'alert' | 'safe';
  title: string;
  detail: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ tone, title, detail }) => {
  const shell = tone === 'alert'
    ? 'border-red-500/70 bg-red-950/40'
    : tone === 'safe'
      ? 'border-emerald-500/40 bg-slate-900'
      : tone === 'live'
        ? 'border-blue-500/50 bg-slate-900'
        : 'border-slate-700 bg-slate-900';
  const icon = tone === 'alert'
    ? 'fa-triangle-exclamation'
    : tone === 'safe'
      ? 'fa-circle-check'
      : tone === 'live'
        ? 'fa-shield-halved'
        : 'fa-play';
  const iconWrap = tone === 'alert'
    ? 'bg-red-500'
    : tone === 'safe'
      ? 'bg-emerald-500'
      : tone === 'live'
        ? 'bg-blue-500'
        : 'bg-slate-700';
  const titleColor = tone === 'alert'
    ? 'text-red-300'
    : tone === 'safe'
      ? 'text-emerald-300'
      : tone === 'live'
        ? 'text-blue-300'
        : 'text-slate-200';

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 ${shell}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrap} ${tone === 'live' || tone === 'alert' ? 'motion-safe:animate-pulse' : ''}`}>
        <i className={`fas ${icon} text-white`} aria-hidden="true"></i>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Call status</p>
        <p className={`text-lg font-semibold ${titleColor}`}>{title}</p>
        <p className="text-sm text-slate-400">{detail}</p>
      </div>
    </div>
  );
};

export default StatusCard;
