import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dates";

export type DailyPerformance = {
  dateKey: string;
  workoutName: string;
  durationMinutes: number;
  calories: number;
  exercises: number;
  workoutCount: number;
};

type WorkoutPlanInfo = {
  name?: string | null;
  calories?: number | null;
};

function upsertDay(
  map: Record<string, DailyPerformance>,
  dateKey: string,
  name: string,
  duration: number,
  calories: number,
  exercises: number,
) {
  const existing = map[dateKey];
  if (!existing) {
    map[dateKey] = {
      dateKey,
      workoutName: name,
      durationMinutes: duration,
      calories,
      exercises,
      workoutCount: 1,
    };
    return;
  }

  existing.durationMinutes += duration;
  existing.calories += calories;
  existing.exercises += exercises;
  existing.workoutCount += 1;
  if (existing.workoutCount > 1) {
    existing.workoutName = `${existing.workoutCount} treinos`;
  }
}

export function useDailyPerformance(from: Date | null, to: Date | null) {
  const { user } = useAuth();
  const [byDate, setByDate] = useState<Record<string, DailyPerformance>>({});
  const [loading, setLoading] = useState(true);

  const fromKey = from ? toLocalDateKey(from) : "";
  const toKey = to ? toLocalDateKey(to) : "";

  useEffect(() => {
    if (!user || !fromKey || !toKey) {
      setByDate({});
      setLoading(false);
      return;
    }

    const rangeStart = parseLocalDateKey(fromKey);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = parseLocalDateKey(toKey);
    rangeEnd.setHours(23, 59, 59, 999);

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data: logs, error } = await supabase
          .from("workout_logs")
          .select(`
            id,
            completed_at,
            duration_minutes,
            workout_plans (
              name,
              calories
            )
          `)
          .eq("user_id", user.id)
          .gte("completed_at", rangeStart.toISOString())
          .lte("completed_at", rangeEnd.toISOString())
          .order("completed_at", { ascending: false });

        if (error) throw error;

        const logIds = (logs ?? []).map((log) => log.id);
        const exerciseCounts: Record<string, number> = {};

        if (logIds.length > 0) {
          const { data: exerciseRows } = await supabase
            .from("exercise_logs")
            .select("workout_log_id")
            .in("workout_log_id", logIds);

          for (const row of exerciseRows ?? []) {
            exerciseCounts[row.workout_log_id] =
              (exerciseCounts[row.workout_log_id] || 0) + 1;
          }
        }

        const map: Record<string, DailyPerformance> = {};

        for (const log of logs ?? []) {
          const dateKey = toLocalDateKey(new Date(log.completed_at));
          const plan = log.workout_plans as WorkoutPlanInfo | WorkoutPlanInfo[] | null;
          const planInfo = Array.isArray(plan) ? plan[0] : plan;
          const duration = log.duration_minutes || 0;
          const calories = planInfo?.calories ?? Math.round((duration || 30) * 6.5);
          const exercises = exerciseCounts[log.id] || 0;
          const name = planInfo?.name || "Treino Personalizado";
          upsertDay(map, dateKey, name, duration, calories, exercises);
        }

        if (!cancelled) setByDate(map);
      } catch (error) {
        console.error("Error loading workout performance:", error);
        if (!cancelled) setByDate({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, fromKey, toKey]);

  return { byDate, loading };
}
