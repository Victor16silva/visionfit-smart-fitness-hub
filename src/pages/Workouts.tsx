import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Clock, Flame, ChevronRight, ChevronDown, Dumbbell, Check, Star, UserCheck, Play, Calendar } from "lucide-react";
import { toast } from "sonner";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
  cover_image_url?: string;
  category?: string;
  duration_minutes?: number;
  calories?: number;
  is_recommended?: boolean;
  is_daily?: boolean;
  created_by?: string;
  day_of_week?: string;
}

const dayTranslations: Record<string, string> = {
  "monday": "Segunda-feira",
  "tuesday": "Terça-feira",
  "wednesday": "Quarta-feira",
  "thursday": "Quinta-feira",
  "friday": "Sexta-feira",
  "saturday": "Sábado",
  "sunday": "Domingo",
};

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<WorkoutPlan[]>([]);
  const [personalizedWorkouts, setPersonalizedWorkouts] = useState<WorkoutPlan[]>([]);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [personalizedOpen, setPersonalizedOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, navigate]);

  const loadWorkouts = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("current_workout_id")
        .eq("id", user?.id)
        .single();

      setCurrentWorkoutId(profileData?.current_workout_id || null);

      const { data: recommended } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_recommended", true)
        .order("created_at", { ascending: false });

      setRecommendedWorkouts(recommended || []);

      const { data: personalized } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .not("created_by", "is", null)
        .order("division_letter", { ascending: true });

      setPersonalizedWorkouts(personalized || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectAsCurrentWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ current_workout_id: workoutId })
        .eq("id", user?.id);

      if (error) throw error;

      setCurrentWorkoutId(workoutId);
      toast.success("Treino selecionado como atual!");
    } catch (error) {
      console.error("Error selecting workout:", error);
      toast.error("Erro ao selecionar treino");
    }
  };

  const currentWorkout = [...personalizedWorkouts, ...recommendedWorkouts].find(w => w.id === currentWorkoutId);
  
  const filteredRecommended = recommendedWorkouts.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const warmupWorkouts = filteredRecommended.filter(w => 
    w.name.toLowerCase().includes("aquecimento") || w.category?.toLowerCase().includes("aquecimento")
  );

  const otherRecommended = filteredRecommended.filter(w => 
    !w.name.toLowerCase().includes("aquecimento") && !w.category?.toLowerCase().includes("aquecimento")
  );

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
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">Treinos</h1>
      </div>

      {/* Current Workout - Only when executing */}
      {currentWorkout && (
        <div className="px-4 mb-4">
          <Card className="bg-gradient-to-br from-lime/20 to-lime/5 border-lime/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play className="h-4 w-4 text-lime" />
                <span className="text-sm font-semibold text-lime">Treino Atual</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-lime/30 flex items-center justify-center">
                    <span className="text-2xl font-black text-lime">{currentWorkout.division_letter || "A"}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{currentWorkout.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentWorkout.muscle_groups?.join(", ")}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{currentWorkout.duration_minutes || 40} min</span>
                      <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange" />{currentWorkout.calories || 200} kcal</span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="bg-lime text-black font-bold hover:bg-lime/90"
                  onClick={() => navigate(`/workout-session/${currentWorkout.id}`)}
                >
                  Iniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Personalized vs Recommended */}
      <Tabs defaultValue="meus" className="px-4">
        <TabsList className="w-full bg-card/50 border border-border mb-4">
          <TabsTrigger value="meus" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Meus Treinos
          </TabsTrigger>
          <TabsTrigger value="recomendados" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Recomendados
          </TabsTrigger>
        </TabsList>

        {/* Meus Treinos Tab */}
        <TabsContent value="meus" className="mt-0 space-y-4">
          {personalizedWorkouts.length > 0 ? (
            <Collapsible open={personalizedOpen} onOpenChange={setPersonalizedOpen}>
              <Card className="bg-gradient-to-br from-purple/20 to-purple/5 border-purple/30">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-purple/10 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple/30 flex items-center justify-center">
                          <UserCheck className="h-6 w-6 text-purple" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-foreground">Treino Personalizado</CardTitle>
                          <p className="text-sm text-muted-foreground">{personalizedWorkouts.length} treino(s) disponível(is)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple/20 text-purple">Personal</Badge>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${personalizedOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-2">
                    {personalizedWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer ${
                          workout.id === currentWorkoutId 
                            ? 'bg-lime/10 border border-lime/30' 
                            : 'bg-background/50 hover:bg-background/80 border border-transparent'
                        }`}
                        onClick={() => navigate(`/workout-session/${workout.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-purple/30 flex items-center justify-center">
                            <span className="text-lg font-black text-purple">{workout.division_letter || "A"}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground">{workout.name}</h4>
                              {workout.id === currentWorkoutId && <Check className="h-4 w-4 text-lime" />}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {workout.day_of_week && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {dayTranslations[workout.day_of_week.toLowerCase()] || workout.day_of_week}
                                </span>
                              )}
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.duration_minutes || 40} min</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{workout.muscle_groups?.join(", ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {workout.id !== currentWorkoutId && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-lime/50 text-lime hover:bg-lime/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAsCurrentWorkout(workout.id);
                              }}
                            >
                              Selecionar
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">Nenhum treino personalizado</h3>
                <p className="text-sm text-muted-foreground">
                  Seu personal trainer ainda não criou um treino personalizado para você.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recomendados Tab */}
        <TabsContent value="recomendados" className="mt-0 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar treinos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Warmup Section */}
          {warmupWorkouts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Aquecimento</h3>
              <div className="space-y-2">
                {warmupWorkouts.map((workout) => (
                  <Card 
                    key={workout.id}
                    className="bg-gradient-to-r from-orange/10 to-transparent border-orange/20 cursor-pointer hover:border-orange/40 transition-all"
                    onClick={() => navigate(`/workout-session/${workout.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange/20 flex items-center justify-center">
                            <Flame className="h-6 w-6 text-orange" />
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground">{workout.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.duration_minutes || 10} min</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other Recommended */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Treinos Disponíveis</h3>
            {otherRecommended.length > 0 ? (
              <div className="space-y-2">
                {otherRecommended.map((workout) => (
                  <Card 
                    key={workout.id}
                    className={`bg-card border-border cursor-pointer transition-all ${
                      workout.id === currentWorkoutId ? 'border-lime/50 bg-lime/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => navigate(`/workout-session/${workout.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            {workout.is_daily ? (
                              <Star className="h-6 w-6 text-amber-500" />
                            ) : (
                              <Dumbbell className="h-6 w-6 text-amber-500" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground">{workout.name}</h4>
                              {workout.is_daily && <Badge className="bg-amber-500/20 text-amber-500 text-xs">Diário</Badge>}
                              {workout.id === currentWorkoutId && <Check className="h-4 w-4 text-lime" />}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{workout.duration_minutes || 40} min</span>
                              <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange" />{workout.calories || 200} kcal</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{workout.muscle_groups?.join(", ")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {workout.id !== currentWorkoutId && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-lime/50 text-lime hover:bg-lime/10 hidden sm:flex"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectAsCurrentWorkout(workout.id);
                              }}
                            >
                              Selecionar
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-8 text-center">
                  <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum treino recomendado encontrado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
