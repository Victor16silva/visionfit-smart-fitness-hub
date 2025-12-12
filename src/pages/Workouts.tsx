import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Flame, ChevronRight, Dumbbell, Check, Star, UserCheck } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { toast } from "sonner";
import workoutFullbody from "@/assets/workout-fullbody.jpg";

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
  is_recommended?: boolean;
  is_daily?: boolean;
  created_by?: string;
  day_of_week?: string;
}

const levels = ["Iniciante", "Intermediário", "Avançado"];

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<WorkoutPlan[]>([]);
  const [personalizedWorkouts, setPersonalizedWorkouts] = useState<WorkoutPlan[]>([]);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, navigate]);

  const loadWorkouts = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      setCurrentWorkoutId((profileData as any)?.current_workout_id || null);

      const { data: recommended } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_recommended", true)
        .order("created_at", { ascending: false });

      setRecommendedWorkouts(recommended || []);

      const { data: personalized } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .not("created_by", "is", null)
        .order("division_letter", { ascending: true });

      setPersonalizedWorkouts(personalized || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectAsCurrentWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ current_workout_id: workoutId } as any)
        .eq("id", user?.id);

      if (error) throw error;

      setCurrentWorkoutId(workoutId);
      toast.success("Treino selecionado como atual!");
    } catch (error) {
      console.error("Error selecting workout:", error);
      toast.error("Erro ao selecionar treino");
    }
  };

  const filteredRecommended = recommendedWorkouts.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !selectedLevel || w.category === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const currentWorkout = [...personalizedWorkouts, ...recommendedWorkouts].find(w => w.id === currentWorkoutId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-6">Treinos</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar treinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Level Filters */}
        <div className="flex gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:border-primary/50"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Current Workout Card */}
      {currentWorkout && (
        <div className="px-4 mb-6">
          <SectionHeader title="Treino Atual" />
          <Card className="mt-3 bg-gradient-to-br from-lime/20 to-lime/5 border-lime/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-lime/30 flex items-center justify-center">
                    <span className="text-2xl font-black text-lime">{currentWorkout.division_letter || "A"}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{currentWorkout.name}</h3>
                      <Check className="h-4 w-4 text-lime" />
                    </div>
                    <p className="text-sm text-muted-foreground">{currentWorkout.muscle_groups?.join(", ")}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{currentWorkout.duration_minutes || 40} min</span>
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange" />{currentWorkout.calories || 200} kcal</span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="bg-lime text-black font-bold hover:bg-lime/90"
                  onClick={() => navigate(`/workout-session/${currentWorkout.id}`)}
                >
                  Iniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personalized Workouts - Card that navigates to program detail */}
      {personalizedWorkouts.length > 0 && (
        <div className="px-4 mb-6">
          <SectionHeader title="Treino Personalizado" subtitle="Montado pelo seu Personal" />
          <Card
            className="mt-3 bg-gradient-to-br from-purple/20 to-purple/5 border-purple/30 cursor-pointer hover:border-purple/50 transition-all"
            onClick={() => navigate("/program/personalized")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple/30 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-purple" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      Meu Programa
                      <Badge className="bg-purple/20 text-purple text-xs border-0">Personal</Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">{personalizedWorkouts.length} treino(s)</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recommended Workouts */}
      <div className="px-4">
        <SectionHeader
          title="Treinos Recomendados"
          subtitle="Escolha um treino para começar"
        />

        <div className="grid grid-cols-1 gap-3 mt-3">
          {filteredRecommended.length > 0 ? (
            filteredRecommended.map((workout, index) => (
              <Card
                key={workout.id}
                className={`bg-card border-border cursor-pointer transition-all overflow-hidden ${
                  workout.id === currentWorkoutId ? 'border-lime/50 bg-lime/5' : 'hover:border-primary/50'
                }`}
                onClick={() => navigate(`/workout-session/${workout.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground truncate">{workout.name}</h3>
                          {workout.id === currentWorkoutId && <Check className="h-4 w-4 text-lime flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{workout.duration_minutes || 40} min</span>
                          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange" />{workout.calories || 200} kcal</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{workout.muscle_groups?.join(", ")}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum treino recomendado disponível</p>
              <p className="text-sm text-muted-foreground mt-1">Aguarde seu personal criar treinos para você</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}