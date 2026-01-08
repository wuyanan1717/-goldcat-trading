export interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'info' | 'alert';
}

export interface ChartData {
  i: number;
  v: number; // Close Price
  o: number; // Open Price
  h: number; // High Price
  l: number; // Low Price
  vol: number; // Volume
  rsi?: number; // Relative Strength Index
  label?: string; 
  time?: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TacticalSignal {
  id: string;
  timeframe: '15M' | '1H' | '4H';
  type: 'FLAT_BOTTOM_GREEN' | 'BEHEADING_RED';
  price: number;
  timestamp: number;
  strength: 'HIGH' | 'MEDIUM';
}

export interface AIAnalysisResult {
  probability_up: number; // 0-100, 50 is superposition
  uncertainty: number; // 0-100, High means chaotic
  conclusion: string;
  quantum_phrase: string; // e.g., "WAVE_FUNCTION_COLLAPSE"
  signal: 'LONG' | 'SHORT' | 'WAIT';
  action_advice: string;
}