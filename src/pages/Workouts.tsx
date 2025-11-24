import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Calendar, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
}

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadActiveWorkout();
  }, [user, navigate]);

  const loadActiveWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveWorkout(data);
    } catch (error) {
      console.error("Error loading active workout:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Se não tem treino ativo, mostrar opções de escolha
  if (!activeWorkout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gradient-primary">
              Bem-vindo aos Treinos!
            </h1>
            <p className="text-muted-foreground">
              Escolha como você quer começar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Treino do Zero */}
            <Card 
              className="cursor-pointer hover:border-primary transition-smooth shadow-card hover:shadow-primary/20 group"
              onClick={() => navigate("/create-workout")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Dumbbell className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Criar do Zero</CardTitle>
                <CardDescription className="text-base">
                  Monte seu treino personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Escolha seus exercícios</li>
                  <li>✓ Defina séries e repetições</li>
                  <li>✓ Personalização completa</li>
                </ul>
                <Button 
                  className="w-full gradient-primary text-primary-foreground font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/create-workout");
                  }}
                >
                  Criar Treino
                </Button>
              </CardContent>
            </Card>

            {/* Treinos Prontos */}
            <Card 
              className="cursor-pointer hover:border-accent transition-smooth shadow-card hover:shadow-accent/20 group"
              onClick={() => navigate("/preset-workouts")}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto rounded-full gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                  <Calendar className="w-10 h-10 text-accent-foreground" />
                </div>
                <CardTitle className="text-2xl">Treinos Montados</CardTitle>
                <CardDescription className="text-base">
                  Escolha treinos prontos por categoria
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Categorias organizadas</li>
                  <li>✓ Treinos profissionais</li>
                  <li>✓ Comece imediatamente</li>
                </ul>
                <Button 
                  className="w-full gradient-accent text-accent-foreground font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/preset-workouts");
                  }}
                >
                  Ver Treinos
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Se tem treino ativo, mostrar treino da semana
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gradient-primary">
            Treino da Semana
          </h1>
          <p className="text-muted-foreground">
            Seu treino ativo atual
          </p>
        </div>

        {/* Treino Ativo */}
        <Card className="mb-6 border-primary/30 shadow-primary">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {activeWorkout.division_letter || "A"}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl mb-1">{activeWorkout.name}</CardTitle>
                  <CardDescription className="text-base">
                    {activeWorkout.description || "Seu treino ativo"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {activeWorkout.muscle_groups.map((group, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {group}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate(`/workout/${activeWorkout.id}`)}
                className="flex-1 gradient-primary text-primary-foreground font-semibold"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Começar Treino
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate("/preset-workouts")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Mudar Treino
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Criar novo treino */}
        <Card className="hover:border-primary/30 transition-smooth">
          <CardHeader>
            <CardTitle>Quer criar um treino novo?</CardTitle>
            <CardDescription>
              Monte um treino do zero ou escolha outro treino pronto
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate("/create-workout")}
              className="flex-1"
            >
              Criar do Zero
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/preset-workouts")}
              className="flex-1"
            >
              Ver Treinos Prontos
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
