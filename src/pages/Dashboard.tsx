import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Dumbbell, LineChart, LogOut, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkoutPlans();
  }, [user, navigate]);

  const loadWorkoutPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("division_letter");

      if (error) throw error;
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error("Error loading workout plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayAbbr = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { weekday: "short" }).slice(0, 3);
  };

  const getWeekDays = () => {
    const today = new Date();
    const days = [];
    for (let i = -2; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const todayIndex = 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Meu Treino</h2>
          <p className="text-muted-foreground">
            Olá, {user?.user_metadata?.full_name || "Atleta"}!
          </p>
        </div>

        {/* Calendar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex justify-around items-center">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center ${
                    index === todayIndex ? "scale-110" : ""
                  }`}
                >
                  <span className="text-xs text-muted-foreground mb-2">
                    {getDayAbbr(day)}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      index === todayIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {index === todayIndex && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workout Plans */}
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Divisões de Treino</h3>
            <Button onClick={() => navigate("/create-workout")} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Treino
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando treinos...</p>
          ) : workoutPlans.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Você ainda não tem treinos cadastrados.
                </p>
                <Button onClick={() => navigate("/create-workout")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Treino
                </Button>
              </CardContent>
            </Card>
          ) : (
            workoutPlans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/workout/${plan.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xl font-bold text-primary">
                          {plan.division_letter}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {plan.muscle_groups.map((group, idx) => (
                      <Badge key={idx} variant="secondary">
                        {group}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate("/progress")}
          >
            <LineChart className="h-6 w-6" />
            <span>Progresso</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => navigate("/create-workout")}
          >
            <Calendar className="h-6 w-6" />
            <span>Criar Treino</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
