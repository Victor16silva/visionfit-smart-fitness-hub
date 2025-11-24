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
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Saudação */}
          <div className="mb-8">
            <h2 className="text-lg text-muted-foreground mb-1">Bem-vindo! 👋</h2>
            <h1 className="text-3xl font-bold mb-2">Primeiro Treino</h1>
            <p className="text-muted-foreground">
              Escolha como você quer começar
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Treino do Zero */}
            <Card 
              className="cursor-pointer hover:border-primary/50 transition-smooth border-none shadow-card hover:shadow-primary/20 group overflow-hidden"
              onClick={() => navigate("/create-workout")}
            >
              <div className="relative h-40 bg-gradient-to-br from-primary/20 to-background">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center group-hover:scale-110 transition-smooth shadow-primary">
                    <Dumbbell className="w-10 h-10 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <CardContent className="pt-6 pb-6">
                <h3 className="text-2xl font-bold mb-2">Criar do Zero</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Monte seu treino personalizado
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Escolha seus exercícios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Defina séries e repetições
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Personalização completa
                  </li>
                </ul>
                <Button 
                  size="lg"
                  className="w-full gradient-primary text-primary-foreground font-bold shadow-primary hover:scale-105 transition-smooth"
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
              className="cursor-pointer hover:border-accent/50 transition-smooth border-none shadow-card hover:shadow-accent/20 group overflow-hidden"
              onClick={() => navigate("/preset-workouts")}
            >
              <div className="relative h-40 bg-gradient-to-br from-accent/20 to-background">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center group-hover:scale-110 transition-smooth shadow-accent">
                    <Calendar className="w-10 h-10 text-accent-foreground" />
                  </div>
                </div>
              </div>
              <CardContent className="pt-6 pb-6">
                <h3 className="text-2xl font-bold mb-2">Treinos Montados</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha treinos prontos por categoria
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Categorias organizadas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Treinos profissionais
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    Comece imediatamente
                  </li>
                </ul>
                <Button 
                  size="lg"
                  className="w-full gradient-accent text-accent-foreground font-bold shadow-accent hover:scale-105 transition-smooth"
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
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Saudação */}
        <div className="mb-8">
          <h2 className="text-lg text-muted-foreground mb-1">Bom treino! 💪</h2>
          <h1 className="text-3xl font-bold mb-6">Treino da Semana</h1>
        </div>

        {/* Treino Ativo - Card Grande com Imagem */}
        <Card className="mb-6 overflow-hidden border-none shadow-card hover:shadow-primary/20 transition-smooth">
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-background">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-primary">
                  <span className="text-xl font-bold text-primary-foreground">
                    {activeWorkout.division_letter || "A"}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{activeWorkout.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeWorkout.description || "Treino ativo"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-4">
            {/* Grupos Musculares */}
            <div className="flex flex-wrap gap-2 mb-6">
              {activeWorkout.muscle_groups.map((group, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-medium">
                  {group}
                </Badge>
              ))}
            </div>
            
            {/* Botões */}
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate(`/workout/${activeWorkout.id}`)}
                size="lg"
                className="flex-1 gradient-accent text-accent-foreground font-bold text-base shadow-accent hover:scale-105 transition-smooth"
              >
                <Dumbbell className="w-5 h-5 mr-2" />
                Iniciar Treino
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-border/50 hover:border-primary hover:bg-primary/5"
                onClick={() => navigate("/preset-workouts")}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Ações Rápidas */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="hover:border-primary/30 transition-smooth cursor-pointer group" onClick={() => navigate("/create-workout")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-smooth">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Criar Novo</h3>
                  <p className="text-sm text-muted-foreground">Monte do zero</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-accent/30 transition-smooth cursor-pointer group" onClick={() => navigate("/preset-workouts")}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-smooth">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Treinos Prontos</h3>
                  <p className="text-sm text-muted-foreground">Escolher categoria</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
