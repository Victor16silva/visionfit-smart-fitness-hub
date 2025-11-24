import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import hipertrofiaImg from "@/assets/category-hipertrofia.jpg";
import femininoImg from "@/assets/category-feminino.jpg";
import definicaoImg from "@/assets/category-definicao.jpg";
import perderPesoImg from "@/assets/category-perder-peso.jpg";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  category: string | null;
  cover_image_url: string | null;
}

interface Category {
  name: string;
  image: string;
  workouts: WorkoutPlan[];
}

export default function PresetWorkouts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryImages: Record<string, string> = {
    "Hipertrofia": hipertrofiaImg,
    "Treinos Femininos": femininoImg,
    "Definição": definicaoImg,
    "Perder Peso": perderPesoImg,
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadPresetWorkouts();
  }, [user, navigate]);

  const loadPresetWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .not("created_by", "is", null)
        .order("category", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Agrupar por categoria
      const grouped = (data || []).reduce((acc, workout) => {
        const category = workout.category || "Outros";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(workout);
        return acc;
      }, {} as Record<string, WorkoutPlan[]>);

      const categoriesArray = Object.entries(grouped).map(([name, workouts]) => ({
        name,
        image: categoryImages[name] || hipertrofiaImg,
        workouts,
      }));

      setCategories(categoriesArray);
    } catch (error) {
      console.error("Error loading preset workouts:", error);
      toast({
        title: "Erro ao carregar treinos",
        description: "Não foi possível carregar os treinos prontos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptWorkout = async (workout: WorkoutPlan) => {
    try {
      // Desativar treinos anteriores
      await supabase
        .from("workout_plans")
        .update({ is_active: false })
        .eq("user_id", user?.id);

      // Copiar treino pronto para o usuário
      const { data: newPlan, error: planError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user?.id,
          name: workout.name,
          division_letter: workout.division_letter,
          muscle_groups: workout.muscle_groups,
          description: workout.description,
          category: workout.category,
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

      toast({
        title: "Treino adicionado!",
        description: "O treino foi adicionado como seu treino ativo.",
      });
      
      navigate("/workouts");
    } catch (error) {
      console.error("Error adopting workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adotar o treino.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/workouts")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Treinos Montados</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gradient-primary">
            Escolha por Categoria
          </h2>
          <p className="text-muted-foreground">
            Treinos profissionais organizados por objetivo
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando treinos...</p>
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground text-lg mb-2">
                Nenhum treino pronto disponível no momento
              </p>
              <p className="text-sm text-muted-foreground">
                Em breve teremos novos treinos para você!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
              <div key={category.name}>
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-2xl font-bold">{category.name}</h3>
                  <Badge variant="secondary">{category.workouts.length} treinos</Badge>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.workouts.map((workout) => (
                    <Card
                      key={workout.id}
                      className="overflow-hidden hover:border-primary transition-smooth shadow-card hover:shadow-primary/20 group"
                    >
                      {/* Imagem da Categoria */}
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                              <span className="text-lg font-bold text-primary-foreground">
                                {workout.division_letter || "A"}
                              </span>
                            </div>
                            <h4 className="font-bold text-lg text-foreground">{workout.name}</h4>
                          </div>
                        </div>
                      </div>

                      <CardContent className="pt-4 space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {workout.description || "Treino completo e balanceado"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {workout.muscle_groups.slice(0, 3).map((group, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                          {workout.muscle_groups.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workout.muscle_groups.length - 3}
                            </Badge>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleAdoptWorkout(workout)}
                          className="w-full gradient-primary text-primary-foreground font-semibold group-hover:scale-105 transition-smooth"
                        >
                          <Dumbbell className="w-4 h-4 mr-2" />
                          Escolher Treino
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
