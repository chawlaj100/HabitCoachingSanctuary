import { UrgeLog } from '../types';

/**
 * Calculates the active habit-resistance streak based on the logged urges.
 * - If there are no logs, the streak is 0.
 * - If there are no slips ('given_in'), the streak is the number of unique days of logs.
 * - If the latest log is a slip, the streak is 0.
 * - Otherwise, the streak is the number of unique days since the latest slip.
 */
export function calculateStreak(logs: UrgeLog[]): number {
  if (logs.length === 0) {
    return 0;
  }

  const slips = logs.filter(l => l.status === 'given_in');
  
  if (slips.length === 0) {
    const uniqueDays = new Set(logs.map(l => l.timestamp.split('T')[0])).size;
    return uniqueDays || 1;
  }

  // Sort logs in descending chronological order (latest first) to ensure accuracy
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const sortedSlips = [...slips].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const latestLog = sortedLogs[0];
  if (latestLog.status === 'given_in') {
    return 0;
  }

  const latestSlipTime = new Date(sortedSlips[0].timestamp).getTime();
  const logsSinceSlip = sortedLogs.filter(l => new Date(l.timestamp).getTime() > latestSlipTime);
  const uniqueDays = new Set(logsSinceSlip.map(l => l.timestamp.split('T')[0])).size;
  
  return uniqueDays;
}
