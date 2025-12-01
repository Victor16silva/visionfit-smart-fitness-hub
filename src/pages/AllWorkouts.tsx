import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import WorkoutCard from "@/components/WorkoutCard";
import BottomNav from "@/components/BottomNav";

// Import images
import workoutDaily from "@/assets/workout-daily.jpg";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import workoutHiit from "@/assets/workout-hiit.jpg";
import workoutStretching from "@/assets/workout-stretching.jpg";

interface Workout {
  id: string;
  title: string;
  duration: number;
  calories: number;
  exercises: number;
  level: string;
  imageUrl: string;
  category: string;
  muscleGroups: string[];
}

const levels = ["Iniciante", "Intermediário", "Avançado"];
const categories = ["Hipertrofia", "Definição", "Condicionamento", "Cardio", "Força"];
const muscleGroups = ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Abdômen", "Full Body"];

export default function AllWorkouts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    levels: [] as string[],
    categories: [] as string[],
    muscleGroups: [] as string[],
  });

  useEffect(() => {
    loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    // TODO: Fetch from database
    // Mock data
    setWorkouts([
      {
        id: "1",
        title: "Treino de Peito Avançado",
        duration: 45,
        calories: 380,
        exercises: 8,
        level: "Avançado",
        imageUrl: workoutDaily,
        category: "Hipertrofia",
        muscleGroups: ["Peito", "Tríceps"],
      },
      {
        id: "2",
        title: "Full Body Iniciante",
        duration: 30,
        calories: 250,
        exercises: 6,
        level: "Iniciante",
        imageUrl: workoutFullbody,
        category: "Condicionamento",
        muscleGroups: ["Full Body"],
      },
      {
        id: "3",
        title: "HIIT Queima Gordura",
        duration: 20,
        calories: 300,
        exercises: 10,
        level: "Intermediário",
        imageUrl: workoutHiit,
        category: "Cardio",
        muscleGroups: ["Cardio"],
      },
      {
        id: "4",
        title: "Alongamento Completo",
        duration: 15,
        calories: 80,
        exercises: 12,
        level: "Iniciante",
        imageUrl: workoutStretching,
        category: "Condicionamento",
        muscleGroups: ["Full Body"],
      },
      {
        id: "5",
        title: "Treino de Pernas Intenso",
        duration: 50,
        calories: 420,
        exercises: 9,
        level: "Avançado",
        imageUrl: workoutDaily,
        category: "Hipertrofia",
        muscleGroups: ["Pernas", "Glúteos"],
      },
      {
        id: "6",
        title: "Core Power",
        duration: 25,
        calories: 200,
        exercises: 8,
        level: "Intermediário",
        imageUrl: workoutHiit,
        category: "Força",
        muscleGroups: ["Abdômen"],
      },
    ]);
    setLoading(false);
  };

  const toggleFilter = (type: "levels" | "categories" | "muscleGroups", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const clearFilters = () => {
    setFilters({ levels: [], categories: [], muscleGroups: [] });
  };

  const activeFiltersCount = 
    filters.levels.length + filters.categories.length + filters.muscleGroups.length;

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch = workout.title.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = filters.levels.length === 0 || filters.levels.includes(workout.level);
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(workout.category);
    const matchesMuscle = filters.muscleGroups.length === 0 || 
      workout.muscleGroups.some((m) => filters.muscleGroups.includes(m));
    
    return matchesSearch && matchesLevel && matchesCategory && matchesMuscle;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black flex-1">Todos os Treinos</h1>
          
          {/* Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-lime text-black text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background border-border">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Limpar
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Level Filter */}
                <div>
                  <h3 className="font-bold text-foreground mb-3">Nível</h3>
                  <div className="space-y-2">
                    {levels.map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`level-${level}`}
                          checked={filters.levels.includes(level)}
                          onCheckedChange={() => toggleFilter("levels", level)}
                        />
                        <Label htmlFor={`level-${level}`}>{level}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-bold text-foreground mb-3">Categoria</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => toggleFilter("categories", category)}
                        />
                        <Label htmlFor={`category-${category}`}>{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Muscle Groups Filter */}
                <div>
                  <h3 className="font-bold text-foreground mb-3">Grupo Muscular</h3>
                  <div className="space-y-2">
                    {muscleGroups.map((muscle) => (
                      <div key={muscle} className="flex items-center space-x-2">
                        <Checkbox
                          id={`muscle-${muscle}`}
                          checked={filters.muscleGroups.includes(muscle)}
                          onCheckedChange={() => toggleFilter("muscleGroups", muscle)}
                        />
                        <Label htmlFor={`muscle-${muscle}`}>{muscle}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar treinos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredWorkouts.length} treino{filteredWorkouts.length !== 1 ? "s" : ""} encontrado{filteredWorkouts.length !== 1 ? "s" : ""}
        </p>

        {/* Workouts Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              Nenhum treino encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                {...workout}
                variant="vertical"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
