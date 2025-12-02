import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Flame, ChevronRight, Dumbbell, Check, Star, UserCheck } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { toast } from "sonner";

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
      // Load user's profile to get current workout
      const { data: profileData } = await supabase
        .from("profiles")
        .select("current_workout_id")
        .eq("id", user?.id)
        .single();

      setCurrentWorkoutId(profileData?.current_workout_id || null);

      // Load recommended workouts (created by admins with is_recommended = true)
      const { data: recommended } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_recommended", true)
        .order("created_at", { ascending: false });

      setRecommendedWorkouts(recommended || []);

      // Load personalized workouts (assigned by trainer - has created_by that's different from user_id)
      const { data: personalized } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .not("created_by", "is", null)
        .order("created_at", { ascending: false });

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
        .update({ current_workout_id: workoutId })
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
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-6">Treinos</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar treinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Level Filters */}
        <div className="flex gap-2 flex-wrap">
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
          <Card className="mt-3 bg-gradient-to-br from-lime/20 to-lime/5 border-lime/30 max-w-2xl">
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

      {/* Personalized Workouts Card */}
      {personalizedWorkouts.length > 0 && (
        <div className="px-4 mb-6">
          <Card className="bg-gradient-to-br from-purple/20 to-purple/5 border-purple/30 max-w-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-purple" />
                <span className="text-foreground">Treino Personalizado</span>
                <Badge className="bg-purple/20 text-purple text-xs">Personal</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {personalizedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                    workout.id === currentWorkoutId 
                      ? 'bg-lime/10 border border-lime/30' 
                      : 'bg-background/50 hover:bg-background/80'
                  }`}
                  onClick={() => navigate(`/workout-session/${workout.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple">{workout.division_letter || "A"}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">{workout.name}</h4>
                        {workout.id === currentWorkoutId && <Check className="h-4 w-4 text-lime" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.duration_minutes || 40} min</span>
                        <span>•</span>
                        <span className="truncate max-w-[150px]">{workout.muscle_groups?.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {workout.id !== currentWorkoutId && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-lime/50 text-lime hover:bg-lime/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAsCurrentWorkout(workout.id);
                        }}
                      >
                        Selecionar
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {filteredRecommended.length > 0 ? (
            filteredRecommended.map((workout) => (
              <Card 
                key={workout.id}
                className={`bg-card border-border cursor-pointer transition-all ${
                  workout.id === currentWorkoutId ? 'border-lime/50 bg-lime/5' : 'hover:border-primary/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1" onClick={() => navigate(`/workout-session/${workout.id}`)}>
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        {workout.is_daily ? (
                          <Star className="h-6 w-6 text-amber-500" />
                        ) : (
                          <Dumbbell className="h-6 w-6 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground truncate">{workout.name}</h3>
                          {workout.is_daily && <Badge className="bg-amber-500/20 text-amber-500 text-xs">Diário</Badge>}
                          {workout.id === currentWorkoutId && <Check className="h-4 w-4 text-lime flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{workout.duration_minutes || 40} min</span>
                          <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange" />{workout.calories || 200} kcal</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{workout.muscle_groups?.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {workout.id !== currentWorkoutId && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-lime/50 text-lime hover:bg-lime/10 hidden sm:flex"
                          onClick={() => selectAsCurrentWorkout(workout.id)}
                        >
                          Selecionar
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
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
