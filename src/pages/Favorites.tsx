import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import WorkoutCard from "@/components/WorkoutCard";
import BottomNav from "@/components/BottomNav";

// Import images
import workoutDaily from "@/assets/workout-daily.jpg";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import workoutHiit from "@/assets/workout-hiit.jpg";

interface FavoriteWorkout {
  id: string;
  title: string;
  duration: number;
  calories: number;
  exercises: number;
  level: string;
  imageUrl: string;
  category?: string;
  muscleGroups?: string[];
}

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<FavoriteWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    // TODO: Fetch from database
    // Mock data for now
    setFavorites([
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
    ]);
    setLoading(false);
  };

  const filteredFavorites = favorites.filter((workout) =>
    workout.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black">Favoritos</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar favoritos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Favorites Count */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Heart className="w-4 h-4 fill-destructive text-destructive" />
          <span>{favorites.length} treinos favoritos</span>
        </div>

        {/* Favorites List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">
              {search ? "Nenhum resultado" : "Nenhum favorito ainda"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Tente buscar por outro termo"
                : "Adicione treinos aos favoritos para acessá-los rapidamente"}
            </p>
            {!search && (
              <Button
                onClick={() => navigate("/workouts")}
                className="bg-lime text-black hover:bg-lime/90"
              >
                Explorar Treinos
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFavorites.map((workout) => (
              <WorkoutCard
                key={workout.id}
                {...workout}
                isFavorite={true}
                variant="horizontal"
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
