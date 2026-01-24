
import React from 'react';
import { RiskLevel } from '../types';

interface RiskMeterProps {
  score: number;
}

const RiskMeter: React.FC<RiskMeterProps> = ({ score }) => {
  const getLevel = () => {
    if (score >= 8) return RiskLevel.HIGH;
    if (score >= 5) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  };

  const level = getLevel();

  const getColor = () => {
    switch (level) {
      case RiskLevel.HIGH: return 'text-red-500 stroke-red-500';
      case RiskLevel.MEDIUM: return 'text-yellow-500 stroke-yellow-500';
      default: return 'text-green-500 stroke-green-500';
    }
  };

  const getBgColor = () => {
    switch (level) {
      case RiskLevel.HIGH: return 'bg-red-500/10';
      case RiskLevel.MEDIUM: return 'bg-yellow-500/10';
      default: return 'bg-green-500/10';
    }
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((score * 10) / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center p-8 rounded-full border border-slate-700 transition-colors duration-500 ${getBgColor()}`}>
      <svg className="w-40 h-40 transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-800"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getColor()}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold mono ${getColor()}`}>{score.toFixed(1)}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-[-4px]">Risk Score (1-10)</span>
      </div>
    </div>
  );
};

export default RiskMeter;
