import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Clock } from "lucide-react";
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
  challenge_points?: number;
}

const levels = ["Iniciante", "Intermediário", "Avançado"];

// Mock data for demonstration
const mockWorkoutsByLevel: Record<string, Workout[]> = {
  iniciante: [
    { id: "1", name: "Leg Day Power Boost", category: "Iniciante", duration_minutes: 30, cover_image_url: workoutDaily, muscle_groups: ["pernas"] },
    { id: "2", name: "Abs Core Básico", category: "Iniciante", duration_minutes: 30, cover_image_url: workoutFullbody, muscle_groups: ["abdomen"] },
    { id: "3", name: "Learn the Basic of Training", category: "Iniciante", duration_minutes: 25, cover_image_url: workoutHiit, muscle_groups: ["fullbody"] },
  ],
  intermediário: [
    { id: "4", name: "Chest Burnout Full Exercise", category: "Intermediário", duration_minutes: 45, cover_image_url: workoutFullbody, muscle_groups: ["peito"] },
    { id: "5", name: "Chest Definition", category: "Intermediário", duration_minutes: 30, cover_image_url: workoutHiit, muscle_groups: ["peito"] },
    { id: "6", name: "HIIT Cardio Blast", category: "Intermediário", duration_minutes: 35, cover_image_url: workoutDaily, muscle_groups: ["cardio"] },
  ],
  avançado: [
    { id: "7", name: "Superior Peito Avançado", category: "Avançado", duration_minutes: 40, cover_image_url: workoutFullbody, challenge_points: 50, muscle_groups: ["peito"] },
    { id: "8", name: "Full Body Extreme", category: "Avançado", duration_minutes: 60, cover_image_url: workoutHiit, muscle_groups: ["fullbody"] },
  ],
};

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
        .eq("is_recommended", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setWorkouts(data);
      } else {
        // Use mock data if no data from DB
        const allMock = [
          ...mockWorkoutsByLevel.iniciante,
          ...mockWorkoutsByLevel.intermediário,
          ...mockWorkoutsByLevel.avançado,
        ];
        setWorkouts(allMock);
      }
    } catch (error) {
      console.error("Error loading workouts:", error);
      const allMock = [
        ...mockWorkoutsByLevel.iniciante,
        ...mockWorkoutsByLevel.intermediário,
        ...mockWorkoutsByLevel.avançado,
      ];
      setWorkouts(allMock);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutsByLevel = (level: string) => {
    const dbWorkouts = workouts.filter(w => 
      w.category?.toLowerCase() === level.toLowerCase()
    );
    
    if (dbWorkouts.length > 0) return dbWorkouts;
    return mockWorkoutsByLevel[level.toLowerCase()] || [];
  };

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
      
      {/* Points badge */}
      {workout.challenge_points && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-lime/90 rounded-full">
          <span className="text-xs font-bold text-black">🏆 +{workout.challenge_points}</span>
        </div>
      )}

      {/* Bookmark button */}
      <button 
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Bookmark className="h-4 w-4 text-white" />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
        <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{workout.name}</h4>
        <p className="text-white/70 text-xs">
          {workout.duration_minutes || 30} minutes • {workout.category || "Iniciante"}
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
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Workout Categories</h1>
        </div>

        {/* Level tabs */}
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

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {levels.map((level) => {
            const levelWorkouts = getWorkoutsByLevel(level);
            if (levelWorkouts.length === 0) return null;
            
            return (
              <div key={level} className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-foreground">{level.toUpperCase()}</h2>
                  <button className="text-sm text-muted-foreground hover:text-lime transition-colors">
                    View All &gt;
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                  {levelWorkouts.slice(0, 5).map((workout) => (
                    <WorkoutCard key={workout.id} workout={workout} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
