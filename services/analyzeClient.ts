import { RiskLevel, type Detection, type RiskReport } from '../types';

export async function getRealModeAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/api/analyze', { headers: { Accept: 'application/json' } });
    if (!res.ok) return false;
    const data = (await res.json()) as { realModeAvailable?: unknown };
    return data.realModeAvailable === true;
  } catch {
    return false;
  }
}

function isReport(value: unknown): value is RiskReport {
  if (!value || typeof value !== 'object') return false;
  const report = value as Partial<RiskReport>;
  return typeof report.score === 'number'
    && typeof report.reason === 'string'
    && Array.isArray(report.actions)
    && Array.isArray(report.detections);
}

export async function analyzeTranscript(transcript: string): Promise<RiskReport> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error
      : 'Analysis failed.';
    throw new Error(message);
  }

  if (!isReport(data)) throw new Error('Analysis failed.');

  const score = Math.min(10, Math.max(1, data.score));
  const level = data.level === RiskLevel.HIGH || data.level === RiskLevel.MEDIUM || data.level === RiskLevel.LOW
    ? data.level
    : score >= 8
      ? RiskLevel.HIGH
      : score >= 5
        ? RiskLevel.MEDIUM
        : RiskLevel.LOW;

  const detections: Detection[] = data.detections
    .filter((item) => item && typeof item.keyword === 'string')
    .map((item) => ({
      keyword: item.keyword,
      category: typeof item.category === 'string' ? item.category : 'Pattern',
      timestamp: typeof item.timestamp === 'number' ? item.timestamp : Date.now(),
    }));

  return {
    score,
    level,
    reason: data.reason,
    actions: data.actions.filter((item) => typeof item === 'string'),
    detections,
    sentiment: data.sentiment,
  };
}
