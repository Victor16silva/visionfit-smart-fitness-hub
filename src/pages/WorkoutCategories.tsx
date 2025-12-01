import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark } from "lucide-react";
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

const levels = ["Iniciante", "Intermediário", "Avançado"];

export default function WorkoutCategories() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string>("Iniciante");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = workouts.filter(w => 
    w.category?.toLowerCase() === selectedLevel.toLowerCase()
  );

  const WorkoutCard = ({ workout }: { workout: Workout }) => (
    <div 
      className="relative rounded-xl overflow-hidden cursor-pointer group w-44 flex-shrink-0"
      onClick={() => navigate(`/workout/${workout.id}`)}
    >
      <div className="aspect-[4/3] bg-muted">
        {workout.cover_image_url ? (
          <img 
            src={workout.cover_image_url} 
            alt={workout.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
            <span className="text-4xl font-black text-muted-foreground/30">
              {workout.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      {/* Bookmark button */}
      <button 
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          // TODO: Toggle favorite
        }}
      >
        <Bookmark className="h-4 w-4 text-white" />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{workout.name}</h4>
        <p className="text-white/70 text-xs">
          30 minutes • {workout.category || "Iniciante"}
        </p>
      </div>
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
          <h1 className="text-xl font-bold text-foreground">Workout Categories</h1>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 mb-6">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level
                  ? 'bg-lime text-black'
                  : 'bg-card border border-border text-foreground hover:bg-card-hover'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Iniciante section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">INICIANTE</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                View All &gt;
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {workouts
                .filter(w => w.category?.toLowerCase() === 'iniciante')
                .slice(0, 5)
                .map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              {workouts.filter(w => w.category?.toLowerCase() === 'iniciante').length === 0 && (
                <p className="text-muted-foreground text-sm py-4">Nenhum treino encontrado</p>
              )}
            </div>
          </div>

          {/* Intermediário section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">INTERMEDIÁRIO</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                View All &gt;
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {workouts
                .filter(w => w.category?.toLowerCase() === 'intermediário')
                .slice(0, 5)
                .map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              {workouts.filter(w => w.category?.toLowerCase() === 'intermediário').length === 0 && (
                <p className="text-muted-foreground text-sm py-4">Nenhum treino encontrado</p>
              )}
            </div>
          </div>

          {/* Avançado section */}
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">AVANÇADO</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground">
                View All &gt;
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {workouts
                .filter(w => w.category?.toLowerCase() === 'avançado')
                .slice(0, 5)
                .map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              {workouts.filter(w => w.category?.toLowerCase() === 'avançado').length === 0 && (
                <p className="text-muted-foreground text-sm py-4">Nenhum treino encontrado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
