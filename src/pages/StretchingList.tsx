import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface Workout {
  id: string;
  name: string;
  muscle_groups: string[];
  category?: string;
  cover_image_url?: string;
  description?: string;
}

const filters = ["Todos", "Iniciante", "Intermediário", "Avançado"];

export default function StretchingList() {
  const navigate = useNavigate();
  const { category } = useParams();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<string>("Todos");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const pageTitle = category?.toUpperCase() || "ALONGAMENTO";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, category]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by category if specified
      if (category) {
        query = query.contains("muscle_groups", [category]);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = selectedFilter === "Todos" 
    ? workouts 
    : workouts.filter(w => w.category?.toLowerCase() === selectedFilter.toLowerCase());

  const WorkoutListItem = ({ workout }: { workout: Workout }) => (
    <div 
      className="flex items-center gap-4 p-3 bg-card rounded-xl cursor-pointer hover:bg-card-hover transition-colors"
      onClick={() => navigate(`/workout/${workout.id}`)}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {workout.cover_image_url ? (
          <img 
            src={workout.cover_image_url} 
            alt={workout.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple/30 to-lime/30 flex items-center justify-center">
            <span className="text-xl font-bold text-muted-foreground/50">
              {workout.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-foreground text-sm line-clamp-1 mb-1">
          {workout.name}
        </h4>
        <p className="text-xs text-muted-foreground">
          20 min • {workout.category || "Iniciante"}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedFilter === filter
                  ? 'bg-orange text-white'
                  : 'bg-card border border-border text-foreground hover:bg-card-hover'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Nenhum treino encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => (
              <WorkoutListItem key={workout.id} workout={workout} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
