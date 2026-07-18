import { describe, it, expect } from 'vitest';
import { calculateStreak } from './streak';
import { UrgeLog } from '../types';

describe('calculateStreak', () => {
  it('returns 0 for empty logs list', () => {
    const logs: UrgeLog[] = [];
    expect(calculateStreak(logs)).toBe(0);
  });

  it('returns unique days of resisted urges when there are no slips', () => {
    const logs: UrgeLog[] = [
      {
        id: '1',
        timestamp: '2026-07-15T10:00:00.000Z',
        intensity: 5,
        triggerContext: 'Boredom',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '2',
        timestamp: '2026-07-15T14:00:00.000Z',
        intensity: 3,
        triggerContext: 'Stress',
        status: 'resisted',
        distractionOffered: 'No'
      },
      {
        id: '3',
        timestamp: '2026-07-16T09:00:00.000Z',
        intensity: 7,
        triggerContext: 'Anxiety',
        status: 'resisted',
        distractionOffered: 'Yes'
      }
    ];

    // 2 unique days: July 15 and July 16
    expect(calculateStreak(logs)).toBe(2);
  });

  it('returns 0 when the latest log is a slip (given_in)', () => {
    const logs: UrgeLog[] = [
      {
        id: '1',
        timestamp: '2026-07-15T10:00:00.000Z',
        intensity: 5,
        triggerContext: 'Boredom',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '2',
        timestamp: '2026-07-16T15:00:00.000Z',
        intensity: 8,
        triggerContext: 'Anxiety',
        status: 'given_in',
        distractionOffered: 'No'
      }
    ];

    expect(calculateStreak(logs)).toBe(0);
  });

  it('returns unique days since last slip when recovering after a slip', () => {
    const logs: UrgeLog[] = [
      {
        id: '1',
        timestamp: '2026-07-14T10:00:00.000Z',
        intensity: 5,
        triggerContext: 'Boredom',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '2',
        timestamp: '2026-07-15T12:00:00.000Z',
        intensity: 8,
        triggerContext: 'Anxiety',
        status: 'given_in',
        distractionOffered: 'No'
      },
      {
        id: '3',
        timestamp: '2026-07-16T14:00:00.000Z',
        intensity: 4,
        triggerContext: 'Social setting',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '4',
        timestamp: '2026-07-17T09:00:00.000Z',
        intensity: 6,
        triggerContext: 'Fatigue',
        status: 'resisted',
        distractionOffered: 'Yes'
      }
    ];

    // Last slip was July 15. Resisted on July 16 and July 17.
    // 2 unique days after the slip.
    expect(calculateStreak(logs)).toBe(2);
  });

  it('correctly handles chronologically out-of-order logs', () => {
    const logs: UrgeLog[] = [
      {
        id: '4',
        timestamp: '2026-07-17T09:00:00.000Z',
        intensity: 6,
        triggerContext: 'Fatigue',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '2',
        timestamp: '2026-07-15T12:00:00.000Z',
        intensity: 8,
        triggerContext: 'Anxiety',
        status: 'given_in',
        distractionOffered: 'No'
      },
      {
        id: '3',
        timestamp: '2026-07-16T14:00:00.000Z',
        intensity: 4,
        triggerContext: 'Social setting',
        status: 'resisted',
        distractionOffered: 'Yes'
      },
      {
        id: '1',
        timestamp: '2026-07-14T10:00:00.000Z',
        intensity: 5,
        triggerContext: 'Boredom',
        status: 'resisted',
        distractionOffered: 'Yes'
      }
    ];

    // Sorted: 14 (resist), 15 (slip), 16 (resist), 17 (resist).
    // Should recover streak after the slip on the 15th, giving 2 days (16th and 17th).
    expect(calculateStreak(logs)).toBe(2);
  });
});
