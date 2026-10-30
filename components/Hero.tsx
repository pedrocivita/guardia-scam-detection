import React from 'react';
import { SCENARIOS, type ScenarioId } from '../demo/scenarios';
import type { DemoPhase } from '../hooks/useDemoPlayer';

interface HeroProps {
  scenarioId: ScenarioId;
  phase: DemoPhase;
  progress: string;
  onSelect: (id: ScenarioId) => void;
  onPrimary: () => void;
  onRestart: () => void;
}

const Hero: React.FC<HeroProps> = ({ scenarioId, phase, progress, onSelect, onPrimary, onRestart }) => {
  const primaryLabel = phase === 'playing'
    ? 'Pause'
    : phase === 'paused'
      ? 'Resume'
      : phase === 'done'
        ? 'Replay'
        : 'Play live demo';

  return (
    <section className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Scripted demo</p>
      <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
        Catch the scam before the money moves.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
        Three scripted calls play on the page: a fake bank security desk, a delivery fee, and a Pix urgency scam.
        The risk meter and the red flags update as each line appears. No API key required.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Choose a call">
        {SCENARIOS.map((scenario) => {
          const selected = scenario.id === scenarioId;
          return (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(scenario.id)}
              className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
                selected
                  ? 'border-blue-500 bg-blue-500/15 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
              }`}
            >
              {scenario.title}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onPrimary}
          className="min-h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onRestart}
          disabled={phase === 'idle'}
          className="min-h-11 rounded-full border border-slate-600 px-5 text-sm font-semibold text-slate-200 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        >
          Restart
        </button>
        <p className="text-sm text-slate-400 sm:ml-2">{progress}</p>
      </div>
    </section>
  );
};

export default Hero;
