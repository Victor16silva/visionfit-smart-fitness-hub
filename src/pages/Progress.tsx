import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

interface WorkoutStats {
  total_workouts: number;
  this_week: number;
  this_month: number;
  recent_workouts: Array<{
    date: string;
    count: number;
  }>;
}

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkoutStats>({
    total_workouts: 0,
    this_week: 0,
    this_month: 0,
    recent_workouts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("workout_logs")
        .select("completed_at")
        .eq("user_id", user?.id)
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeek = logs?.filter(
        (log) => new Date(log.completed_at) >= weekAgo
      ).length || 0;

      const thisMonth = logs?.filter(
        (log) => new Date(log.completed_at) >= monthAgo
      ).length || 0;

      // Group by date for chart
      const workoutsByDate: { [key: string]: number } = {};
      logs?.forEach((log) => {
        const date = new Date(log.completed_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        });
        workoutsByDate[date] = (workoutsByDate[date] || 0) + 1;
      });

      const recentWorkouts = Object.entries(workoutsByDate)
        .slice(0, 7)
        .reverse()
        .map(([date, count]) => ({ date, count }));

      setStats({
        total_workouts: logs?.length || 0,
        this_week: thisWeek,
        this_month: thisMonth,
        recent_workouts: recentWorkouts,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    count: {
      label: "Treinos",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Meu Progresso</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <p className="text-center py-8">Carregando estatísticas...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total</CardDescription>
                  <CardTitle className="text-3xl">{stats.total_workouts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Treinos completos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Esta Semana</CardDescription>
                  <CardTitle className="text-3xl">{stats.this_week}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Este Mês</CardDescription>
                  <CardTitle className="text-3xl">{stats.this_month}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Treinos Recentes
                </CardTitle>
                <CardDescription>Seus últimos 7 dias de atividade</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recent_workouts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum treino registrado ainda
                  </p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.recent_workouts}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="count"
                          fill="hsl(var(--primary))"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dicas de Progresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Consistência é chave</p>
                    <p className="text-sm text-muted-foreground">
                      Tente treinar pelo menos 3-4 vezes por semana
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Progressão gradual</p>
                    <p className="text-sm text-muted-foreground">
                      Aumente cargas e volume gradualmente
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Recuperação adequada</p>
                    <p className="text-sm text-muted-foreground">
                      Durma bem e mantenha boa alimentação
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
