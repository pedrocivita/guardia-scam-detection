
import React from 'react';

interface StatusCardProps {
  isActive: boolean;
  isAlerting: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ isActive, isAlerting }) => {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 flex items-center gap-4 ${
      isAlerting 
        ? 'bg-red-950/40 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' 
        : isActive 
          ? 'bg-slate-900 border-blue-500/50' 
          : 'bg-slate-900 border-slate-700 opacity-60'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        isAlerting 
          ? 'bg-red-500 animate-pulse' 
          : isActive 
            ? 'bg-blue-500' 
            : 'bg-slate-700'
      }`}>
        <i className={`fas ${isAlerting ? 'fa-triangle-exclamation' : isActive ? 'fa-shield-halved' : 'fa-power-off'} text-white text-xl`}></i>
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Agent Status</h3>
        <p className={`text-xl font-bold ${isAlerting ? 'text-red-400' : isActive ? 'text-blue-400' : 'text-slate-500'}`}>
          {isAlerting ? 'ALERT: SCAM DETECTED' : isActive ? 'Protection Active' : 'Protection Disabled'}
        </p>
      </div>
      {isActive && !isAlerting && (
        <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-xs text-blue-400 font-mono">MONITORING...</span>
        </div>
      )}
    </div>
  );
};

export default StatusCard;
