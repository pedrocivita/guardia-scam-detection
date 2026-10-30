import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
  level: RiskLevel;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score, level }) => {
  const color = level === RiskLevel.HIGH
    ? 'text-red-400'
    : level === RiskLevel.MEDIUM
      ? 'text-amber-300'
      : 'text-emerald-400';
  const label = level === RiskLevel.HIGH ? 'High risk' : level === RiskLevel.MEDIUM ? 'Medium risk' : 'Low risk';
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(10, Math.max(0, score));
  const offset = circumference - (clamped / 10) * circumference;
  const shown = clamped.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="meter"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={Number(shown)}
        aria-valuetext={`${shown} out of 10, ${label}`}
        aria-label="Call risk"
        className="relative h-36 w-36"
      >
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" className="stroke-slate-800" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-[stroke-dashoffset] duration-700 ease-out ${color}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-mono text-4xl font-semibold tabular-nums ${color}`}>{shown}</span>
        </div>
      </div>
      <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${color}`}>{label}</p>
    </div>
  );
};

export default RiskMeter;
