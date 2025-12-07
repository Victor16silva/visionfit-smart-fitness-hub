import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, Calendar, ChevronRight, Dumbbell, CalendarDays, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import workoutDaily from "@/assets/workout-daily.jpg";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import categoryHipertrofia from "@/assets/category-hipertrofia.jpg";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
  cover_image_url?: string;
  category?: string;
  duration_minutes?: number;
  calories?: number;
  day_of_week?: string;
  program_id?: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  progress_percent?: number;
}

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const dayNames: Record<string, string> = {
  "monday": "Segunda-feira",
  "tuesday": "Terça-feira",
  "wednesday": "Quarta-feira",
  "thursday": "Quinta-feira",
  "friday": "Sexta-feira",
};

const letterToDay: Record<string, string> = {
  "a": "monday",
  "b": "tuesday",
  "c": "wednesday",
  "d": "thursday",
};

const defaultImages = [workoutDaily, workoutFullbody, categoryHipertrofia];

const getTodayDayOfWeek = (): string => {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[new Date().getDay()];
};

export default function ProgramDetail() {
  const { programId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [completedWorkouts, setCompletedWorkouts] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProgramData();
  }, [user, programId]);

  const loadProgramData = async () => {
    try {
      if (programId && programId !== "personalized") {
        const { data: programData } = await supabase
          .from("workout_programs")
          .select("*")
          .eq("id", programId)
          .single();
        
        setProgram(programData);
        
        const { data: workoutsData } = await supabase
          .from("workout_plans")
          .select("*")
          .eq("program_id", programId)
          .eq("is_active", true)
          .order("division_letter", { ascending: true });
        
        setWorkouts(workoutsData || []);
        setTotalWorkouts(workoutsData?.length || 0);
      } else {
        setProgram({
          id: "personalized",
          name: "Treino Personalizado",
          description: "Treinos montados pelo seu Personal Trainer",
          category: "Hipertrofia",
          progress_percent: 13,
        });

        const { data: workoutsData } = await supabase
          .from("workout_plans")
          .select("*")
          .eq("user_id", user?.id)
          .eq("is_active", true)
          .not("created_by", "is", null)
          .order("division_letter", { ascending: true });
        
        setWorkouts(workoutsData || []);
        setTotalWorkouts(workoutsData?.length || 0);

        const { count } = await supabase
          .from("workout_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user?.id);
        
        setCompletedWorkouts(count || 0);
      }
    } catch (error) {
      console.error("Error loading program:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutImage = (workout: WorkoutPlan, index: number) => {
    if (workout.cover_image_url) return workout.cover_image_url;
    return defaultImages[index % defaultImages.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const filteredWorkouts = workouts
    .filter(w => ["a", "b", "c", "d"].includes((w.division_letter || "").toLowerCase()))
    .sort((a, b) => {
      const letterA = (a.division_letter || "a").toLowerCase();
      const letterB = (b.division_letter || "b").toLowerCase();
      const dayA = letterToDay[letterA] || "monday";
      const dayB = letterToDay[letterB] || "monday";
      return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
    });

  const totalDuration = filteredWorkouts.reduce((acc, w) => acc + (w.duration_minutes || 40), 0);
  const totalCalories = filteredWorkouts.reduce((acc, w) => acc + (w.calories || 200), 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header - Fixed overlap issue */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground truncate">{program?.name || "Meu Programa"}</h1>
        </div>
      </div>

      {/* Program Info Card - Without cover image */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl p-5 border border-border overflow-hidden relative">
          <div className="z-10">
            <h2 className="text-xl font-bold text-primary mb-1">
              {program?.name || "Treino Personalizado"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {program?.category || "Hipertrofia"} • Personalizado
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Treinos</p>
                  <p className="text-sm font-semibold text-foreground">{filteredWorkouts.length} por semana</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="text-sm font-semibold text-foreground">~{Math.round(totalDuration / filteredWorkouts.length || 40)} min</p>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-primary text-sm font-medium">
                Progresso {program?.progress_percent || 0}%
              </span>
            </div>
            <Progress 
              value={program?.progress_percent || 0} 
              className="h-2 bg-muted"
            />
          </div>

          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{completedWorkouts}</p>
            <p className="text-xs text-muted-foreground">Treinos Feitos</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-orange">{filteredWorkouts.length}</p>
            <p className="text-xs text-muted-foreground">Dias/Semana</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border text-center">
            <p className="text-2xl font-bold text-green-500">{totalCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/Semana</p>
          </div>
        </div>
      </div>

      {/* Workout Days Section - Renamed to Rotina de Treino */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Rotina de Treino</h3>
        </div>
        
        <div className="space-y-3">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout, index) => {
              const letter = (workout.division_letter || String.fromCharCode(65 + index)).toLowerCase();
              const workoutDay = letterToDay[letter] || dayOrder[index];
              const today = getTodayDayOfWeek();
              const isToday = workoutDay === today;
              
              return (
                <button
                  key={workout.id}
                  onClick={() => navigate(`/workout-detail/${workout.id}`)}
                  className={`w-full rounded-xl p-4 border transition-all flex items-center gap-4 ${
                    isToday 
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30" 
                      : "bg-card hover:bg-muted/50 border-border"
                  }`}
                >
                  {/* Workout Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={getWorkoutImage(workout, index)}
                      alt={workout.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Division Letter */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isToday ? "bg-primary" : "bg-primary/20"
                  }`}>
                    <span className={`text-lg font-black ${isToday ? "text-primary-foreground" : "text-primary"}`}>
                      {workout.division_letter?.toUpperCase() || String.fromCharCode(65 + index)}
                    </span>
                  </div>

                  {/* Workout Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        Treino {workout.division_letter?.toUpperCase() || String.fromCharCode(65 + index)}
                      </h4>
                      {isToday && (
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Hoje
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {workout.muscle_groups?.join(", ") || workout.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className={`text-xs ${isToday ? "border-primary text-primary" : "border-primary/30 text-primary"}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {dayNames[workoutDay] || "Segunda-feira"}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {workout.duration_minutes || 40} min
                      </span>
                    </div>
                  </div>

                  <ChevronRight className={`h-5 w-5 flex-shrink-0 ${isToday ? "text-primary" : "text-muted-foreground"}`} />
                </button>
              );
            })
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhum treino cadastrado ainda</p>
              <p className="text-sm text-muted-foreground">Aguarde seu personal criar treinos para você</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
