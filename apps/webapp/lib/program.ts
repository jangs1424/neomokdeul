export type Round = 1 | 2 | 'final';

export interface ProgramDay {
  day: number;            // 1..8 (0 if not started yet; 9+ if completed)
  round: Round;
  isBeforeStart: boolean;
  isAfterEnd: boolean;
  daysUntilStart: number; // positive if not yet started, negative once started
  daysUntilEnd: number;   // 0 if today is end day, negative if past
}

export function computeProgramDay(
  programStartDate: string,
  programEndDate: string,
  now: Date = new Date(),
): ProgramDay {
  // Parse calendar dates as KST midnight / end-of-day
  const start = new Date(programStartDate + 'T00:00:00+09:00');
  const end = new Date(programEndDate + 'T23:59:59+09:00');

  const MS_DAY = 86_400_000;
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / MS_DAY);
  const rawDay = daysSinceStart + 1; // Day 1 = start day

  const isBeforeStart = now < start;
  const isAfterEnd = now > end;

  const day = isBeforeStart ? 0 : rawDay;

  let round: Round;
  if (rawDay <= 4) round = 1;
  else if (rawDay <= 7) round = 2;
  else round = 'final';

  const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / MS_DAY);
  const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / MS_DAY);

  return { day, round, isBeforeStart, isAfterEnd, daysUntilStart, daysUntilEnd };
}
