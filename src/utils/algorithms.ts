import { db } from '../db';

export const calculateEntropy = (timestamp: number): number => {
  const T = 24 * 60 * 60 * 1000; // Chu kỳ 24h 
  const E = 1 - ((Date.now() - timestamp) / T); // 
  return Math.max(0, Math.min(1, E));
};

export const fetchEchoes = async (text: string) => {
  if (text.length < 3) return [];
  const words = text.split(' ').filter(w => w.length > 2);
  return await db.masterDoc
    .where('content')
    .startsWithAnyOfIgnoreCase(words)
    .limit(3) // Giới hạn 3 tiếng vọng [cite: 26]
    .toArray();
};