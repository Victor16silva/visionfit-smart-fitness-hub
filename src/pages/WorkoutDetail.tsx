import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, Flame, Weight, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  image_url?: string;
  description?: string;
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  order_index: number;
  notes?: string;
  exercise?: Exercise;
}

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  duration_minutes?: number;
  calories?: number;
  total_weight_kg?: number;
}

export default function WorkoutDetail() {
  const { workoutId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkoutData();
  }, [user, workoutId]);

  const loadWorkoutData = async () => {
    try {
      // Load workout details
      const { data: workoutData } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("id", workoutId)
        .single();
      
      setWorkout(workoutData);

      // Load exercises for this workout
      const { data: exercisesData } = await supabase
        .from("workout_exercises")
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq("workout_plan_id", workoutId)
        .order("order_index", { ascending: true });
      
      setExercises(exercisesData || []);
    } catch (error) {
      console.error("Error loading workout:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Workout Header */}
      <div className="px-4 pb-4">
        <h1 className="text-2xl font-black text-foreground mb-4">
          Treino {workout?.division_letter || "A"}
        </h1>
        
        {/* Stats */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duração</p>
              <p className="font-semibold text-foreground">{workout?.duration_minutes || 10}-20 min</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center">
              <Flame className="h-5 w-5 text-orange" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Calorias</p>
              <p className="font-semibold text-foreground">{workout?.calories || 139} kcal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Weight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carga</p>
              <p className="font-semibold text-foreground">{workout?.total_weight_kg || "-"} kg</p>
            </div>
          </div>
        </div>

        {/* Start Workout Button */}
        <Button 
          onClick={() => navigate(`/workout-session/${workoutId}`)}
          className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-full"
        >
          Iniciar Treino
        </Button>
      </div>

      {/* Divider */}
      <div className="h-2 bg-muted" />

      {/* Exercise List */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-foreground mb-4">Lista de exercícios</h2>
        
        <div className="space-y-3">
          {exercises.length > 0 ? (
            exercises.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border"
              >
                {/* Exercise Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                  {item.exercise?.image_url ? (
                    <img 
                      src={item.exercise.image_url}
                      alt={item.exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Weight className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Exercise Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">
                    {item.exercise?.name || "Exercício"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {item.sets} séries
                  </p>
                </div>

                {/* Menu */}
                <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum exercício cadastrado</p>
            </div>
          )}
        </div>

        {/* Add Exercise Button */}
        <Button
          variant="outline"
          className="w-full mt-4 bg-card hover:bg-muted border-dashed"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar
        </Button>

        {/* Target Muscles */}
        {workout?.muscle_groups && workout.muscle_groups.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-foreground mb-3">Músculos alvo</h3>
            <div className="flex flex-wrap gap-2">
              {workout.muscle_groups.map((muscle, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {muscle}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
