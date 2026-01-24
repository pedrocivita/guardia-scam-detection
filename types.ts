
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface SentimentData {
  primary: string;
  intensity: number; // 0-100
  scoreAdjustment: number; // How much this sentiment added to the risk
}

export interface Detection {
  keyword: string;
  category: string;
  timestamp: number;
}

export interface RiskReport {
  score: number; // Scale 1-10
  level: RiskLevel;
  reason: string;
  actions: string[]; // Steps for the user to take
  detections: Detection[];
  sentiment?: SentimentData;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  sender: 'user' | 'scammer' | 'system';
  timestamp: number;
}
