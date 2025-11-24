import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
  created_by: string | null;
}

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myWorkouts, setMyWorkouts] = useState<WorkoutPlan[]>([]);
  const [readyWorkouts, setReadyWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, navigate]);

  const loadWorkouts = async () => {
    try {
      // Meus treinos
      const { data: myData, error: myError } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (myError) throw myError;
      setMyWorkouts(myData || []);

      // Treinos prontos (criados por personal trainers)
      const { data: readyData, error: readyError } = await supabase
        .from("workout_plans")
        .select("*")
        .not("created_by", "is", null)
        .neq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (readyError) throw readyError;
      setReadyWorkouts(readyData || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptWorkout = async (workout: WorkoutPlan) => {
    try {
      // Copiar treino pronto para o usuário
      const { data: newPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user?.id,
          name: workout.name,
          division_letter: workout.division_letter,
          muscle_groups: workout.muscle_groups,
          description: workout.description,
          is_active: true,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Copiar exercícios
      const { data: exercises, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_plan_id", workout.id);

      if (exercisesError) throw exercisesError;

      if (exercises && exercises.length > 0) {
        const newExercises = exercises.map((ex) => ({
          workout_plan_id: newPlan.id,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          sets: ex.sets,
          reps_min: ex.reps_min,
          reps_max: ex.reps_max,
          rest_seconds: ex.rest_seconds,
          notes: ex.notes,
        }));

        const { error: insertError } = await supabase
          .from("workout_exercises")
          .insert(newExercises);

        if (insertError) throw insertError;
      }

      loadWorkouts();
      navigate(`/workout/${newPlan.id}`);
    } catch (error) {
      console.error("Error adopting workout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient-primary">Treinos</h1>
          <p className="text-muted-foreground">
            Monte seu treino personalizado ou escolha treinos prontos
          </p>
        </div>

        {/* Criar Treino */}
        <Card className="mb-8 border-primary/30 shadow-primary hover:border-primary/50 transition-smooth">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">Criar Treino Personalizado</CardTitle>
                <CardDescription>Monte seu treino do zero com exercícios personalizados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/create-workout")} 
              size="lg"
              className="gradient-primary text-primary-foreground font-semibold shadow-primary hover:scale-105 transition-smooth"
            >
              <Plus className="w-5 h-5 mr-2" />
              Montar Meu Treino
            </Button>
          </CardContent>
        </Card>

        {/* Meus Treinos */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-primary" />
            Meus Treinos
          </h2>
          
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : myWorkouts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não criou nenhum treino.
                </p>
                <Button onClick={() => navigate("/create-workout")} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Treino
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myWorkouts.map((plan) => (
                <Card
                  key={plan.id}
                  className="cursor-pointer hover:border-primary transition-smooth shadow-card"
                  onClick={() => navigate(`/workout/${plan.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {plan.division_letter || "A"}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription className="line-clamp-1">{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {plan.muscle_groups.slice(0, 3).map((group, idx) => (
                        <Badge key={idx} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                      {plan.muscle_groups.length > 3 && (
                        <Badge variant="secondary">+{plan.muscle_groups.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Treinos Prontos */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Treinos Prontos
          </h2>
          
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : readyWorkouts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum treino pronto disponível no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyWorkouts.map((plan) => (
                <Card
                  key={plan.id}
                  className="hover:border-accent transition-smooth shadow-card"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
                        <span className="text-xl font-bold text-accent-foreground">
                          {plan.division_letter || "A"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription className="line-clamp-1">{plan.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {plan.muscle_groups.slice(0, 3).map((group, idx) => (
                        <Badge key={idx} variant="secondary">
                          {group}
                        </Badge>
                      ))}
                      {plan.muscle_groups.length > 3 && (
                        <Badge variant="secondary">+{plan.muscle_groups.length - 3}</Badge>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleAdoptWorkout(plan)}
                      className="w-full gradient-accent text-accent-foreground font-semibold shadow-accent hover:scale-105 transition-smooth"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Adotar Este Treino
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
