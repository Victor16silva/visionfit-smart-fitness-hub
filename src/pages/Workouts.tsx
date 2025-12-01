import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, CalendarDays, Clock, Flame, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import workoutFullbody from "@/assets/workout-fullbody.jpg";

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
  description: string;
  is_active: boolean;
  cover_image_url?: string;
  category?: string;
}

const levels = ["Iniciante", "Intermediário", "Avançado"];

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, navigate]);

  const loadWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const dailyWorkout = {
    id: "daily",
    title: "Cardio Fitness",
    duration: 45,
    calories: 1450,
    level: "Intermediário",
    imageUrl: workoutFullbody,
    division: "A"
  };

  const continueWorkouts = [
    {
      id: "1",
      title: "Superior Peito Avan...",
      duration: 45,
      exercises: 6,
      division: "E",
      color: "bg-purple"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-6">Treinos</h1>
        
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar treinos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Level Filters */}
        <div className="flex gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:border-primary/50"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Quick Actions */}
        <Card 
          className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => navigate("/create-workout")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-primary">Criar Novo</h3>
                <p className="text-sm text-muted-foreground">Monte do zero</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => navigate("/preset-workouts")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-card-hover border border-border flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Treinos do Mês</h3>
                <p className="text-sm text-muted-foreground">Escolher categoria</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treino do Dia */}
      <div className="px-4 mt-6">
        <SectionHeader title="Treino do Dia" />
        
        <Card className="relative overflow-hidden rounded-2xl border-0 mt-3">
          <div className="relative h-[220px]">
            <img 
              src={dailyWorkout.imageUrl} 
              alt={dailyWorkout.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Division Badge */}
            <div className="absolute top-4 left-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">{dailyWorkout.division}</span>
              </div>
            </div>

            {/* Carousel Arrows */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronLeft className="h-4 w-4 text-white" />
              </button>
              <button className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                <ChevronRight className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-2xl font-black text-white mb-2">{dailyWorkout.title}</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{dailyWorkout.duration} min</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Flame className="h-4 w-4 text-orange" />
                  <span>{dailyWorkout.calories} kcal</span>
                </div>
                <Badge className="bg-card-hover text-foreground border-0 font-medium">
                  {dailyWorkout.level}
                </Badge>
              </div>
              
              <Button 
                className="w-full h-12 bg-primary text-primary-foreground font-bold text-base rounded-xl hover:bg-primary/90"
                onClick={() => navigate(`/workout/${dailyWorkout.id}/play`)}
              >
                Iniciar Treino
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Continue Evoluindo */}
      <div className="px-4 mt-6">
        <SectionHeader 
          title="Continue Evoluindo" 
          subtitle="Explore treinos intermediários"
        />
        
        <div className="space-y-3 mt-3">
          {continueWorkouts.map((workout) => (
            <Card 
              key={workout.id}
              className="bg-card border-border cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate(`/workout/${workout.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${workout.color} flex items-center justify-center`}>
                      <Dumbbell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{workout.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {workout.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {workout.exercises} exercícios
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">{workout.division}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
