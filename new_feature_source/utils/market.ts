import { ChartData } from '../types';
import { calculateRSI } from './indicators';

// Binance Public API Base URL
const BASE_URL = 'https://api.binance.com/api/v3/klines';

export async function fetchBinanceKlines(symbol: string, interval: string, limit: number = 50): Promise<ChartData[]> {
  try {
    // We fetch limit + 15 to allow RSI to "warm up" so the visible charts have accurate RSI
    const fetchLimit = limit + 15;
    const url = `${BASE_URL}?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${fetchLimit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const rawData = await response.json();

    // Transform Binance format [time, open, high, low, close, volume...]
    let charts: ChartData[] = rawData.map((k: any, index: number) => ({
      i: index,
      v: parseFloat(k[4]), // Close price
      o: parseFloat(k[1]), // Open
      h: parseFloat(k[2]), // High
      l: parseFloat(k[3]), // Low
      vol: parseFloat(k[5]), // Volume
      time: k[0], 
      label: new Date(k[0]).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }));

    // Calculate RSI
    charts = calculateRSI(charts, 14);

    // Return only the requested amount (cutting off the warmup period)
    return charts.slice(-limit);

  } catch (error) {
    console.error("Failed to fetch market data:", error);
    return Array.from({ length: limit }, (_, i) => ({ 
      i, 
      v: 50000 + Math.random() * 1000, 
      o: 50000,
      h: 51000,
      l: 49000,
      vol: Math.random() * 100,
      time: Date.now() 
    }));
  }
}

export async function fetchBacktestData(symbol: string) {
  const [d1m, d5m, d1h] = await Promise.all([
    fetchBinanceKlines(symbol, '1m', 1000),
    fetchBinanceKlines(symbol, '5m', 200),
    fetchBinanceKlines(symbol, '1h', 50)
  ]);
  return { d1m, d5m, d1h };
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}