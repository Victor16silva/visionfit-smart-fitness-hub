import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Play, Edit2, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface Workout {
  id: string;
  name: string;
  division_letter?: string;
  muscle_groups: string[];
  duration_minutes?: number;
  calories?: number;
  description?: string;
}

interface CurrentWorkoutCardProps {
  onChangeWorkout?: () => void;
}

export default function CurrentWorkoutCard({ onChangeWorkout }: CurrentWorkoutCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [userWorkouts, setUserWorkouts] = useState<Workout[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("id, name, division_letter, muscle_groups, duration_minutes, calories, description")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserWorkouts(data || []);
      if (data && data.length > 0) {
        setCurrentWorkout(data[0]); // Set the most recent as current
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectWorkout = (workout: Workout) => {
    setCurrentWorkout(workout);
    setShowSelector(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-20 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!currentWorkout && userWorkouts.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-lime/20 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-lime" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Seu Treino</h3>
            <p className="text-sm text-muted-foreground">Nenhum treino definido</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/create-workout")}
          className="w-full bg-lime text-black font-bold h-11 hover:bg-lime/90"
        >
          <Dumbbell className="h-4 w-4 mr-2" />
          Criar Meu Primeiro Treino
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-sm">Treino Atual</h3>
          <button 
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-1 text-xs text-lime hover:text-lime/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Trocar
          </button>
        </div>

        {currentWorkout && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lime/30 to-lime/10 flex items-center justify-center">
              <span className="text-2xl font-black text-lime">{currentWorkout.division_letter || "A"}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground">{currentWorkout.name}</h4>
              <p className="text-sm text-muted-foreground">
                {currentWorkout.muscle_groups?.join(", ") || "Geral"}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{currentWorkout.duration_minutes || 40} min</span>
                <span>•</span>
                <span>{currentWorkout.calories || 200} kcal</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={() => currentWorkout && navigate(`/workout-session/${currentWorkout.id}`)}
            className="flex-1 bg-lime text-black font-bold h-11 hover:bg-lime/90"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar
          </Button>
          <Button 
            variant="outline"
            onClick={() => currentWorkout && navigate(`/edit-workout/${currentWorkout.id}`)}
            className="h-11 px-4 border-border"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workout Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Escolher Treino</h3>
              <button onClick={() => setShowSelector(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
              {userWorkouts.map((workout) => (
                <button 
                  key={workout.id}
                  onClick={() => selectWorkout(workout)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    currentWorkout?.id === workout.id 
                      ? 'bg-lime/20 border border-lime/30' 
                      : 'bg-muted/50 hover:bg-muted border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-lime/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-lime">{workout.division_letter || "A"}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{workout.name}</p>
                    <p className="text-xs text-muted-foreground">{workout.muscle_groups?.join(", ")}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button 
                variant="outline"
                className="w-full h-11 border-dashed border-border"
                onClick={() => { setShowSelector(false); navigate("/create-workout"); }}
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                Criar Novo Treino
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
