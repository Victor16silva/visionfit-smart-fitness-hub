import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Clock, Flame, Calendar, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProgramData();
  }, [user, programId]);

  const loadProgramData = async () => {
    try {
      // Load program details
      if (programId && programId !== "personalized") {
        const { data: programData } = await supabase
          .from("workout_programs")
          .select("*")
          .eq("id", programId)
          .single();
        
        setProgram(programData);
        
        // Load workouts for this program
        const { data: workoutsData } = await supabase
          .from("workout_plans")
          .select("*")
          .eq("program_id", programId)
          .eq("is_active", true)
          .order("division_letter", { ascending: true });
        
        setWorkouts(workoutsData || []);
      } else {
        // Load personalized workouts (created by personal trainer)
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

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">{program?.name || "Meu Programa"}</h1>
          </div>
        </div>
      </div>

      {/* Program Info Card */}
      <div className="p-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-primary mb-1">
                {program?.name || "Treino Personalizado"}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {program?.category || "Hipertrofia"} - Balanceado
              </p>
              
              <div className="flex items-center gap-2">
                <span className="text-primary text-sm font-medium">
                  Progresso {program?.progress_percent || 0}%
                </span>
              </div>
              <Progress 
                value={program?.progress_percent || 0} 
                className="h-2 mt-2 bg-muted"
              />
            </div>
            
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={program?.cover_image_url || categoryHipertrofia}
                alt="Program"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Workout Days Section */}
      <div className="px-4 mt-4">
        <h3 className="text-lg font-bold text-foreground mb-4">Dias de treino</h3>
        
        <div className="space-y-3">
          {workouts.length > 0 ? (
            // Filter only A-D workouts and sort by day order
            workouts
              .filter(w => ["a", "b", "c", "d"].includes((w.division_letter || "").toLowerCase()))
              .sort((a, b) => {
                const letterA = (a.division_letter || "a").toLowerCase();
                const letterB = (b.division_letter || "b").toLowerCase();
                const dayA = letterToDay[letterA] || "monday";
                const dayB = letterToDay[letterB] || "monday";
                return dayOrder.indexOf(dayA) - dayOrder.indexOf(dayB);
              })
              .map((workout, index) => {
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
              <p className="text-muted-foreground mb-4">Nenhum treino cadastrado ainda</p>
              <p className="text-sm text-muted-foreground">Aguarde seu personal criar treinos para você</p>
            </div>
          )}
        </div>

        {/* Add Workout Button */}
        <Button
          onClick={() => navigate("/create-workout")}
          className="w-full mt-4 bg-card hover:bg-muted border border-dashed border-border text-foreground"
          variant="outline"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
