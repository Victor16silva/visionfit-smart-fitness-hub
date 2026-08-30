import { localDateKey, startOfDay } from "@/lib/dates";

export function computeWorkoutStreak(completedAt: string[]): number {
  const uniqueDays = [...new Set(completedAt.map((iso) => localDateKey(new Date(iso))))]
    .sort()
    .reverse();

  if (uniqueDays.length === 0) return 0;

  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const newest = uniqueDays[0];
  const todayKey = localDateKey(today);
  const yesterdayKey = localDateKey(yesterday);

  if (newest !== todayKey && newest !== yesterdayKey) {
    return 0;
  }

  let streak = 0;
  const cursor = newest === todayKey ? today : yesterday;

  for (const day of uniqueDays) {
    if (day !== localDateKey(cursor)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function workoutLevelLabel(totalWorkouts: number): string {
  if (totalWorkouts >= 20) return "Avançado";
  if (totalWorkouts >= 5) return "Intermediário";
  return "Iniciante";
}
