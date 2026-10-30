export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface SentimentData {
  primary: string;
  intensity: number;
  scoreAdjustment: number;
}

export interface Detection {
  keyword: string;
  category: string;
  timestamp: number;
}

export interface RiskReport {
  score: number;
  level: RiskLevel;
  reason: string;
  actions: string[];
  detections: Detection[];
  sentiment?: SentimentData;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  sender: 'user' | 'caller' | 'system';
  timestamp: number;
  highlights?: string[];
}
