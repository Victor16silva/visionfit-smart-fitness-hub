import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Clock, Dumbbell, Lightbulb, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface WorkoutDay {
  date: Date;
  calories: number;
  workout: string;
  duration: number;
  tip: string;
  exerciseCount?: number;
}

const tips = [
  "Mantenha-se hidratado durante o treino!",
  "Alongue-se antes e depois do treino.",
  "Descanse bem entre as séries.",
  "A consistência é a chave do sucesso!",
  "Aumente a intensidade gradualmente.",
  "Durma bem para melhor recuperação.",
  "Alimente-se adequadamente antes do treino.",
  "Não pule o aquecimento!"
];

export default function PerformanceCalendar() {
  const [workoutData, setWorkoutData] = useState<Record<string, WorkoutDay>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  
  // Generate 5 days starting from today
  const next5Days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);
    return date;
  });
  
  // Selected index is always 0 (today)
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (user) {
      loadWorkoutData();
    }
  }, [user]);

  const loadWorkoutData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Get last 7 days for history
      startDate.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select(`
          id,
          completed_at,
          duration_minutes,
          workout_plan_id,
          workout_plans (
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const dataMap: Record<string, WorkoutDay> = {};

      if (logs) {
        for (const log of logs) {
          const logDate = new Date(log.completed_at);
          logDate.setHours(0, 0, 0, 0);
          const dateKey = logDate.toDateString();

          // Count exercises for this workout
          const { count } = await supabase
            .from('exercise_logs')
            .select('*', { count: 'exact', head: true })
            .eq('workout_log_id', log.id);

          // Estimate calories (roughly 5-8 cal per minute depending on intensity)
          const estimatedCalories = Math.round((log.duration_minutes || 30) * 6.5);
          
          // Get workout name
          const workoutName = (log.workout_plans as any)?.name || 'Treino Personalizado';

          // If there's already data for this day, accumulate it
          if (dataMap[dateKey]) {
            dataMap[dateKey].calories += estimatedCalories;
            dataMap[dateKey].duration += log.duration_minutes || 0;
            dataMap[dateKey].exerciseCount = (dataMap[dateKey].exerciseCount || 0) + (count || 0);
          } else {
            dataMap[dateKey] = {
              date: logDate,
              calories: estimatedCalories,
              workout: workoutName,
              duration: log.duration_minutes || 0,
              tip: tips[Math.floor(Math.random() * tips.length)],
              exerciseCount: count || 0
            };
          }
        }
      }

      setWorkoutData(dataMap);
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDate = next5Days[selectedIndex];
  const selectedData = workoutData[selectedDate.toDateString()];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const isToday = (date: Date) => {
    const todayDate = new Date();
    return date.toDateString() === todayDate.toDateString();
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div>
      {/* Horizontal 5-day calendar starting from today */}
      <div className="flex gap-2 mb-4">
        {next5Days.map((date, index) => {
          const hasWorkout = !!workoutData[date.toDateString()];
          const isSelected = index === selectedIndex;
          const todayDate = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 py-3 rounded-xl transition-all relative ${
                isSelected 
                  ? 'bg-lime text-black' 
                  : 'bg-card border border-border text-foreground'
              }`}
            >
              <div className={`text-xs mb-0.5 ${isSelected ? 'text-black/70' : 'opacity-70'}`}>
                {dayNames[date.getDay()]}
              </div>
              <div className="text-xl font-bold">
                {date.getDate()}
              </div>
              {hasWorkout && !isSelected && (
                <div className="w-1.5 h-1.5 rounded-full mx-auto mt-1 bg-lime" />
              )}
            </button>
          );
        })}
      </div>

      {/* Performance Card */}
      <Card className="p-4 bg-card border-border">
        <h4 className="font-bold text-foreground mb-3">
          Desempenho - {formatDate(selectedDate)}
        </h4>
        
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        ) : selectedData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calorias Queimadas</p>
                <p className="font-semibold text-foreground">{selectedData.calories} kcal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-lime" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Treino Realizado</p>
                <p className="font-semibold text-foreground">{selectedData.workout}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo de Treino</p>
                <p className="font-semibold text-foreground">{selectedData.duration} minutos</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue mb-1">Dica do Dia</p>
                <p className="text-sm text-foreground">{selectedData.tip}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground text-sm mb-3">
              Nenhum treino registrado neste dia.
            </p>
            <div className="flex items-start gap-3 p-3 bg-blue/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-blue mb-1">Dica do Dia</p>
                <p className="text-sm text-foreground">{tips[new Date().getDay() % tips.length]}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
