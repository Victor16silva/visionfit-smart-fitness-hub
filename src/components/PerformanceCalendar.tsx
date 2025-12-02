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
  const [selectedIndex, setSelectedIndex] = useState(4); // Start with today selected
  const [workoutData, setWorkoutData] = useState<Record<string, WorkoutDay>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  // Generate last 5 days
  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (4 - i));
    return date;
  });

  useEffect(() => {
    if (user) {
      loadWorkoutData();
    }
  }, [user]);

  const loadWorkoutData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 4);
      fiveDaysAgo.setHours(0, 0, 0, 0);

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
        .gte('completed_at', fiveDaysAgo.toISOString())
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

  const selectedDate = last5Days[selectedIndex];
  const selectedData = workoutData[selectedDate.toDateString()];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div>
      {/* Horizontal 5-day calendar */}
      <div className="flex gap-2 mb-4">
        {last5Days.map((date, index) => {
          const hasWorkout = !!workoutData[date.toDateString()];
          const isSelected = index === selectedIndex;
          const todayDate = isToday(date);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 p-3 rounded-xl transition-all relative ${
                isSelected 
                  ? 'bg-lime text-black' 
                  : 'bg-card border border-border text-foreground'
              }`}
            >
              {todayDate && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  isSelected ? 'bg-black' : 'bg-lime'
                }`} />
              )}
              <div className="text-xs opacity-80 mb-1">
                {dayNames[date.getDay()]}
              </div>
              <div className="text-xl font-bold mb-1">
                {date.getDate()}
              </div>
              {hasWorkout && (
                <div className={`w-1.5 h-1.5 rounded-full mx-auto ${
                  isSelected ? 'bg-black' : 'bg-lime'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="mt-4 p-4 bg-card border-border">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </Card>
      ) : selectedData ? (
        <Card className="mt-4 p-4 bg-card border-border">
          <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-lime" />
            Desempenho - {selectedData.date.toLocaleDateString('pt-BR')}
          </h4>
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
                <p className="text-xs text-muted-foreground mb-1">Dica do Dia</p>
                <p className="text-sm text-foreground">{selectedData.tip}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 p-4 bg-card border-border text-center">
          <div className="py-6">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum treino registrado em {selectedDate.toLocaleDateString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Complete um treino para ver seu desempenho aqui!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
