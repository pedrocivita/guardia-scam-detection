import React, { useEffect, useState } from 'react';
import AnalysisPanel from './components/AnalysisPanel';
import CallPanel from './components/CallPanel';
import Hero from './components/Hero';
import RealAnalysis from './components/RealAnalysis';
import { scenarioById } from './demo/scenarios';
import { useDemoPlayer } from './hooks/useDemoPlayer';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import { getRealModeAvailable } from './services/analyzeClient';
import { RiskLevel } from './types';

const App: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const player = useDemoPlayer(reducedMotion);
  const [realModeAvailable, setRealModeAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getRealModeAvailable().then((available) => {
      if (!cancelled) setRealModeAvailable(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scenario = scenarioById(player.scenarioId);
  const spoken = player.entries.filter((entry) => entry.sender !== 'system').length;
  const progress = player.phase === 'done'
    ? 'Call ended'
    : player.phase === 'idle'
      ? 'Ready'
      : `Line ${Math.min(spoken, scenario.lines.length)} of ${scenario.lines.length}`;

  const tone = player.showVerdict
    ? player.report.level === RiskLevel.HIGH
      ? 'alert'
      : player.report.level === RiskLevel.LOW
        ? 'safe'
        : 'live'
    : player.phase === 'playing' || player.phase === 'paused'
      ? 'live'
      : 'idle';

  const statusTitle = player.showVerdict
    ? player.report.level === RiskLevel.HIGH
      ? 'Scam pattern confirmed'
      : player.report.level === RiskLevel.MEDIUM
        ? 'Treat this call with care'
        : 'Nothing urgent in this text'
    : player.phase === 'paused'
      ? 'Paused'
      : player.phase === 'playing'
        ? 'Listening to the call'
        : 'Demo ready';

  const statusDetail = scenario.title;

  const onPrimary = () => {
    if (player.phase === 'playing') player.pause();
    else if (player.phase === 'paused') player.resume();
    else if (player.phase === 'done') player.replay();
    else player.start('bank');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <i className="fas fa-fingerprint text-white" aria-hidden="true"></i>
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">GUARD.<span className="text-blue-500">IA</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Call protection demo</p>
            </div>
          </div>
          <p className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {realModeAvailable ? 'Server key ready' : 'Demo mode'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Hero
          scenarioId={player.scenarioId}
          phase={player.phase}
          progress={progress}
          onSelect={player.start}
          onPrimary={onPrimary}
          onRestart={player.replay}
        />
        <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-slate-100">{statusTitle}</p>
            <p className="font-mono tabular-nums text-slate-300">{player.report.score.toFixed(1)} / 10</p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"
            role="meter"
            aria-label="Call risk"
            aria-valuemin={1}
            aria-valuemax={10}
            aria-valuenow={Number(player.report.score.toFixed(1))}
          >
            <div
              className={`h-2 rounded-full ${
                player.report.level === RiskLevel.HIGH
                  ? 'bg-red-400'
                  : player.report.level === RiskLevel.MEDIUM
                    ? 'bg-amber-300'
                    : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, player.report.score) * 10)}%` }}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:mt-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <CallPanel
              entries={player.entries}
              phaseLabel={player.phase === 'paused' ? 'Paused' : player.showVerdict ? 'Final read' : 'Playing'}
              reducedMotion={reducedMotion}
            />
          </div>
          <div className="lg:col-span-5">
            <AnalysisPanel
              report={player.report}
              showVerdict={player.showVerdict}
              tone={tone}
              statusTitle={statusTitle}
              statusDetail={statusDetail}
            />
          </div>
        </div>
        {realModeAvailable && <RealAnalysis onReport={player.showCustom} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-slate-500 sm:px-6 lg:px-8">
        Scripted demo for education. These are not real calls, and the page does not record audio.
      </footer>
    </div>
  );
};

export default App;
