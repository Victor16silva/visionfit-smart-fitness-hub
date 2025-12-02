import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, Play, RefreshCw, Clock, Flame } from "lucide-react";
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

export default function CurrentWorkoutCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCurrentWorkout();
    }
  }, [user]);

  const loadCurrentWorkout = async () => {
    setLoading(true);
    try {
      // Get user's current workout id from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("current_workout_id")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;

      if (profileData?.current_workout_id) {
        // Load the workout details
        const { data: workoutData, error: workoutError } = await supabase
          .from("workout_plans")
          .select("id, name, division_letter, muscle_groups, duration_minutes, calories, description")
          .eq("id", profileData.current_workout_id)
          .single();

        if (workoutError) throw workoutError;
        setCurrentWorkout(workoutData);
      } else {
        setCurrentWorkout(null);
      }
    } catch (error) {
      console.error("Error loading current workout:", error);
      setCurrentWorkout(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border animate-pulse">
        <div className="h-20 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (!currentWorkout) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-lime/20 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-lime" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Seu Treino</h3>
            <p className="text-sm text-muted-foreground">Nenhum treino selecionado</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/workouts")}
          className="w-full bg-lime text-black font-bold h-11 hover:bg-lime/90"
        >
          <Dumbbell className="h-4 w-4 mr-2" />
          Escolher Treino
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground text-sm">Treino Atual</h3>
        <button 
          onClick={() => navigate("/workouts")}
          className="flex items-center gap-1 text-xs text-lime hover:text-lime/80 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Trocar
        </button>
      </div>

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
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {currentWorkout.duration_minutes || 40} min
            </span>
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange" />
              {currentWorkout.calories || 200} kcal
            </span>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => navigate(`/workout-session/${currentWorkout.id}`)}
        className="w-full bg-lime text-black font-bold h-11 hover:bg-lime/90"
      >
        <Play className="h-4 w-4 mr-2" />
        Iniciar Treino
      </Button>
    </div>
  );
}