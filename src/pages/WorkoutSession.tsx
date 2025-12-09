import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Play, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Exercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string;
  exercise: {
    name: string;
    image_url: string;
    equipment: string;
  };
}

interface WorkoutPlan {
  id: string;
  name: string;
  muscle_groups: string[];
}

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [completedSets, setCompletedSets] = useState<{ [key: string]: boolean[] }>({});
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkout();
  }, [id, user]);

  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer === 0) {
      setRestTimer(null);
      toast({ title: "Descanso terminado!", description: "Pronto para a próxima série" });
      return;
    }
    const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [restTimer]);

  const loadWorkout = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_plans")
        .select("id, name, muscle_groups")
        .eq("id", id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select(`
          *,
          exercise:exercises(name, image_url, equipment)
        `)
        .eq("workout_plan_id", id)
        .order("order_index");

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      const initialCompleted: { [key: string]: boolean[] } = {};
      exercisesData?.forEach((ex) => {
        initialCompleted[ex.id] = Array(ex.sets).fill(false);
      });
      setCompletedSets(initialCompleted);

      // Create workout log
      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user?.id,
          workout_plan_id: id,
        })
        .select()
        .single();

      if (logError) throw logError;
      setWorkoutLogId(logData.id);
    } catch (error) {
      console.error("Error loading workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o treino",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetComplete = async (exerciseId: string, setIndex: number) => {
    const newCompleted = { ...completedSets };
    newCompleted[exerciseId][setIndex] = !newCompleted[exerciseId][setIndex];
    setCompletedSets(newCompleted);

    if (newCompleted[exerciseId][setIndex]) {
      const exercise = exercises.find((ex) => ex.id === exerciseId);
      if (exercise) {
        setRestTimer(exercise.rest_seconds);
      }
    }
  };

  const handleFinishWorkout = async () => {
    try {
      await supabase
        .from("workout_logs")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", workoutLogId);

      toast({
        title: "Treino concluído!",
        description: "Parabéns pelo treino completo!",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error finishing workout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando treino...</p>
      </div>
    );
  }

  const currentEx = exercises[currentExercise];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{workout?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {workout?.muscle_groups.join(", ")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {restTimer !== null && (
          <Card className="mb-6 bg-primary/10 border-primary">
            <CardContent className="py-4 text-center">
              <Timer className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">{restTimer}s</p>
              <p className="text-sm text-muted-foreground">Tempo de descanso</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {exercises.map((exercise, index) => (
            <Card
              key={exercise.id}
              className={index === currentExercise ? "border-primary" : ""}
            >
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {exercise.exercise.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {exercise.sets}x {exercise.reps_min}-{exercise.reps_max} repetições
                    </p>
                    <Badge variant="outline">{exercise.exercise.equipment}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Timer className="h-4 w-4" />
                    <span>Descanso: {exercise.rest_seconds}s</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: exercise.sets }).map((_, setIndex) => (
                      <Button
                        key={setIndex}
                        variant={
                          completedSets[exercise.id]?.[setIndex]
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleSetComplete(exercise.id, setIndex)}
                        className="h-12"
                      >
                        {completedSets[exercise.id]?.[setIndex] ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          `Série ${setIndex + 1}`
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {exercise.notes && (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-secondary/50 rounded">
                    💡 {exercise.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleFinishWorkout}
          className="w-full mt-8 h-14 text-lg"
        >
          Finalizar Treino
        </Button>
      </main>
    </div>
  );
}
