import React, { useState } from 'react';
import { analyzeTranscript } from '../services/analyzeClient';
import type { RiskReport } from '../types';

const MAX_CHARS = 8000;

interface RealAnalysisProps {
  onReport: (text: string, report: RiskReport) => void;
}

const RealAnalysis: React.FC<RealAnalysisProps> = ({ onReport }) => {
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const transcript = text.trim();
    if (!transcript || pending) return;
    setPending(true);
    setError('');
    try {
      const report = await analyzeTranscript(transcript);
      onReport(transcript, report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6" aria-labelledby="real-analysis-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="real-analysis-heading" className="text-lg font-semibold text-white">Real analysis</h2>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">Server key detected</p>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
        Optional. This sends the text to /api/analyze. The Gemini key stays on the server and is not in the page.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label htmlFor="transcript" className="block text-sm font-medium text-slate-300">
          Transcript
        </label>
        <textarea
          id="transcript"
          value={text}
          maxLength={MAX_CHARS}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste a call transcript. The scripted demo above does not use this."
          className="min-h-32 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">{text.length} / {MAX_CHARS}</p>
          <button
            type="submit"
            disabled={pending || text.trim().length === 0}
            className="min-h-11 rounded-full bg-slate-100 px-5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? 'Analyzing...' : 'Analyze with Gemini'}
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      </form>
    </section>
  );
};

export default RealAnalysis;
