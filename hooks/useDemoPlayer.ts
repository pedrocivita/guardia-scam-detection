import { useCallback, useEffect, useRef, useState } from 'react';
import {
  IDLE_REPORT,
  levelFor,
  scenarioById,
  sentimentFor,
  type ScenarioId,
} from '../demo/scenarios';
import type { RiskReport, TranscriptEntry } from '../types';

export type DemoPhase = 'idle' | 'playing' | 'paused' | 'done';

function reportFor(id: ScenarioId, lineCount: number, done: boolean): RiskReport {
  const scenario = scenarioById(id);
  const slice = scenario.lines.slice(0, lineCount);
  const last = slice[slice.length - 1];
  const score = done ? scenario.verdict.score : last?.score ?? 1;
  return {
    score,
    level: levelFor(score),
    reason: done ? scenario.verdict.reason : last?.note ?? IDLE_REPORT.reason,
    actions: done ? scenario.verdict.actions : [],
    detections: slice.flatMap((line, lineIndex) => line.flags.map((flag, flagIndex) => ({
      keyword: flag.phrase,
      category: flag.category,
      timestamp: lineIndex * 10 + flagIndex,
    }))),
    sentiment: sentimentFor(score),
  };
}

export function useDemoPlayer(reducedMotion: boolean) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('bank');
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [report, setReport] = useState<RiskReport>(IDLE_REPORT);
  const [showVerdict, setShowVerdict] = useState(false);

  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const runRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const scenarioRef = useRef<ScenarioId>('bank');
  const phaseRef = useRef<DemoPhase>('idle');

  const setPhaseSafe = (next: DemoPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const delay = () => (reducedRef.current ? 280 : 1500);

  const pump = useCallback((generation: number) => {
    if (generation !== runRef.current) return;
    const scenario = scenarioById(scenarioRef.current);
    const index = indexRef.current;
    if (index >= scenario.lines.length) {
      setEntries((prev) => {
        if (prev.some((entry) => entry.id === `${scenario.id}-closing`)) return prev;
        return [...prev, {
          id: `${scenario.id}-closing`,
          sender: 'system',
          text: scenario.closing,
          timestamp: Date.now(),
        }];
      });
      setReport(reportFor(scenario.id, scenario.lines.length, true));
      setShowVerdict(true);
      setPhaseSafe('done');
      return;
    }

    const line = scenario.lines[index];
    indexRef.current = index + 1;
    setEntries((prev) => [...prev, {
      id: `${scenario.id}-${index}`,
      sender: line.speaker === 'user' ? 'user' : 'caller',
      text: line.text,
      highlights: line.flags.map((flag) => flag.phrase),
      timestamp: Date.now(),
    }]);
    setReport(reportFor(scenario.id, index + 1, false));
    setShowVerdict(false);
    setPhaseSafe('playing');
    timerRef.current = window.setTimeout(() => pump(generation), delay());
  }, []);

  const start = useCallback((id: ScenarioId) => {
    clearTimer();
    const generation = ++runRef.current;
    scenarioRef.current = id;
    indexRef.current = 0;
    setScenarioId(id);
    setEntries([]);
    setShowVerdict(false);
    setReport({
      ...IDLE_REPORT,
      reason: 'Call connected. Listening for the first line.',
    });
    setPhaseSafe('playing');
    timerRef.current = window.setTimeout(() => pump(generation), reducedRef.current ? 80 : 400);
  }, [pump]);

  const pause = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    clearTimer();
    setPhaseSafe('paused');
  }, []);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    const generation = ++runRef.current;
    setPhaseSafe('playing');
    timerRef.current = window.setTimeout(() => pump(generation), delay());
  }, [pump]);

  const replay = useCallback(() => {
    start(scenarioRef.current);
  }, [start]);

  const showCustom = useCallback((text: string, next: RiskReport) => {
    clearTimer();
    runRef.current += 1;
    setEntries([{
      id: 'custom',
      sender: 'caller',
      text,
      highlights: next.detections.map((item) => item.keyword),
      timestamp: Date.now(),
    }]);
    setReport(next);
    setShowVerdict(true);
    setPhaseSafe('done');
  }, []);

  useEffect(() => {
    start('bank');
    return () => {
      clearTimer();
      runRef.current += 1;
    };
  }, [start]);

  return {
    scenarioId,
    phase,
    entries,
    report,
    showVerdict,
    start,
    pause,
    resume,
    replay,
    showCustom,
  };
}
