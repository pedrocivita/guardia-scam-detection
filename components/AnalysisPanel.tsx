import React from 'react';
import RiskMeter from './RiskMeter';
import StatusCard from './StatusCard';
import type { RiskReport } from '../types';

interface AnalysisPanelProps {
  report: RiskReport;
  showVerdict: boolean;
  tone: 'idle' | 'live' | 'alert' | 'safe';
  statusTitle: string;
  statusDetail: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ report, showVerdict, tone, statusTitle, statusDetail }) => {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <StatusCard tone={tone} title={statusTitle} detail={statusDetail} />
      <section className="hidden rounded-3xl border border-slate-800 bg-slate-900 p-5 lg:block" aria-labelledby="risk-heading">
        <h2 id="risk-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risk, 1 to 10</h2>
        <div className="mt-4 flex justify-center">
          <RiskMeter score={report.score} level={report.level} />
        </div>
        {report.sentiment && (
          <p className="mt-2 text-center text-xs uppercase tracking-[0.14em] text-slate-400">
            Tone: {report.sentiment.primary}
          </p>
        )}
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-labelledby="flags-heading">
        <h2 id="flags-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Red flags</h2>
        {report.detections.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">None yet. Flags show up on the words that raise the risk.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.detections.map((detection, index) => (
              <li key={`${detection.keyword}-${index}`} className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                <i className="fas fa-exclamation-triangle mt-0.5 text-xs text-red-300" aria-hidden="true"></i>
                <span>
                  <span className="block text-sm font-semibold text-red-100">{detection.keyword}</span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">{detection.category}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5" aria-live="polite" aria-labelledby="verdict-heading">
        <h2 id="verdict-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {showVerdict ? 'Verdict' : 'What we are hearing'}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{report.reason}</p>
        {showVerdict && report.actions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {report.actions.map((action) => (
              <li key={action} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                {action}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AnalysisPanel;
