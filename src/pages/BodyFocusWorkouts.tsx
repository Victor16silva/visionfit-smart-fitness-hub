import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import workoutDaily from "@/assets/workout-daily.jpg";
import workoutHiit from "@/assets/workout-hiit.jpg";

interface Workout {
  id: string;
  name: string;
  muscle_groups: string[];
  category?: string;
  cover_image_url?: string;
  duration_minutes?: number;
}

const muscleNames: Record<string, string> = {
  ombros: "OMBROS",
  peito: "PEITO",
  abdomen: "ABDÔMEN",
  pernas: "PERNAS",
  costas: "COSTAS",
  bracos: "BRAÇOS",
};

const levels = ["Todos", "Iniciante", "Intermediário", "Avançado"];

// Mock data for demonstration
const mockWorkouts: Record<string, Workout[]> = {
  ombros: [
    { id: "1", name: "Ombros Sculptor", muscle_groups: ["ombros"], category: "Intermediário", duration_minutes: 30, cover_image_url: workoutFullbody },
    { id: "2", name: "Strong Ombros Blitz", muscle_groups: ["ombros"], category: "Avançado", duration_minutes: 45, cover_image_url: workoutHiit },
    { id: "3", name: "Ombros Definition Express", muscle_groups: ["ombros"], category: "Iniciante", duration_minutes: 20, cover_image_url: workoutDaily },
  ],
  peito: [
    { id: "4", name: "Chest Burnout Full", muscle_groups: ["peito"], category: "Intermediário", duration_minutes: 45, cover_image_url: workoutFullbody },
    { id: "5", name: "Peito Power Push", muscle_groups: ["peito"], category: "Avançado", duration_minutes: 40, cover_image_url: workoutHiit },
    { id: "6", name: "Peito Básico", muscle_groups: ["peito"], category: "Iniciante", duration_minutes: 25, cover_image_url: workoutDaily },
  ],
  abdomen: [
    { id: "7", name: "Abs Core Crusher", muscle_groups: ["abdomen"], category: "Intermediário", duration_minutes: 30, cover_image_url: workoutFullbody },
    { id: "8", name: "Six Pack Express", muscle_groups: ["abdomen"], category: "Avançado", duration_minutes: 35, cover_image_url: workoutHiit },
  ],
  pernas: [
    { id: "9", name: "Leg Day Power Boost", muscle_groups: ["pernas"], category: "Iniciante", duration_minutes: 30, cover_image_url: workoutDaily },
    { id: "10", name: "Pernas de Aço", muscle_groups: ["pernas"], category: "Intermediário", duration_minutes: 40, cover_image_url: workoutFullbody },
  ],
};

export default function BodyFocusWorkouts() {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string>("Todos");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const title = muscleNames[area || ""] || area?.toUpperCase() || "TREINOS";

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkouts();
  }, [user, area]);

  const loadWorkouts = async () => {
    setLoading(true);
    try {
      // Try to load from database first
      const { data, error } = await supabase
        .from("workout_plans")
        .select("*")
        .contains("muscle_groups", [area])
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // If no data from DB, use mock data
      if (data && data.length > 0) {
        setWorkouts(data);
      } else {
        setWorkouts(mockWorkouts[area || ""] || []);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
      setWorkouts(mockWorkouts[area || ""] || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkouts = selectedLevel === "Todos" 
    ? workouts 
    : workouts.filter(w => w.category?.toLowerCase() === selectedLevel.toLowerCase());

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
        </div>

        {/* Level filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedLevel === level
                  ? 'bg-lime text-black'
                  : 'bg-card border border-border text-foreground hover:bg-muted'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Workout List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Nenhum treino encontrado</p>
          </div>
        ) : (
          filteredWorkouts.map((workout) => (
            <button
              key={workout.id}
              onClick={() => navigate(`/workout/${workout.id}`)}
              className="w-full flex items-center gap-4 p-3 bg-card rounded-xl border border-border hover:border-lime/50 transition-all group"
            >
              {/* Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                {workout.cover_image_url ? (
                  <img 
                    src={workout.cover_image_url} 
                    alt={workout.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
                    <span className="text-2xl font-black text-muted-foreground/30">
                      {workout.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h3 className="font-bold text-foreground mb-1">{workout.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{workout.duration_minutes || 30} min</span>
                  <span>•</span>
                  <span>{workout.category || "Iniciante"}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}