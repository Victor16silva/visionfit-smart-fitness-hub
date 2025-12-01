import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
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
  level: string;
  imageUrl: string;
  isFavorite?: boolean;
}

const levels = ["Iniciante", "Intermediário", "Avançado"];

const workoutsByLevel: Record<string, Workout[]> = {
  "Iniciante": [
    { id: "1", title: "Leg Day Power Boost", duration: 30, level: "Iniciante", imageUrl: workoutDaily },
    { id: "2", title: "Abs Core Health", duration: 30, level: "Iniciante", imageUrl: workoutHiit },
    { id: "3", title: "Upper Body Basics", duration: 25, level: "Iniciante", imageUrl: workoutStretching },
  ],
  "Intermediário": [
    { id: "4", title: "Chest Burnout Full Exercise", duration: 45, level: "Intermediário", imageUrl: workoutFullbody },
    { id: "5", title: "Chest Definition Exercise", duration: 30, level: "Intermediário", imageUrl: workoutHiit },
    { id: "6", title: "Full Body Circuit", duration: 40, level: "Intermediário", imageUrl: workoutDaily },
  ],
  "Avançado": [
    { id: "7", title: "Extreme HIIT Challenge", duration: 50, level: "Avançado", imageUrl: workoutHiit },
    { id: "8", title: "Advanced Power Training", duration: 60, level: "Avançado", imageUrl: workoutFullbody },
    { id: "9", title: "Pro Strength Builder", duration: 55, level: "Avançado", imageUrl: workoutDaily },
  ]
};

export default function AllWorkouts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filteredLevels = selectedLevel ? [selectedLevel] : levels;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-black text-foreground">Workout Categories</h1>
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

      {/* Workouts by Level */}
      <div className="px-4 space-y-8">
        {filteredLevels.map((level) => (
          <div key={level}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{level}</h2>
              <button 
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                onClick={() => {}}
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {workoutsByLevel[level]?.map((workout) => (
                <Card 
                  key={workout.id}
                  className="relative overflow-hidden rounded-xl border-0 cursor-pointer group"
                  onClick={() => navigate(`/workout/${workout.id}`)}
                >
                  <div className="relative aspect-[3/4]">
                    <img 
                      src={workout.imageUrl} 
                      alt={workout.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    
                    {/* Bookmark Button */}
                    <button 
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                      onClick={(e) => toggleFavorite(workout.id, e)}
                    >
                      <Bookmark className={`h-4 w-4 ${favorites.has(workout.id) ? "fill-primary text-primary" : "text-white"}`} />
                    </button>
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="text-sm font-bold text-white line-clamp-2 mb-1">{workout.title}</h3>
                      <p className="text-xs text-white/70">
                        {workout.duration} minutes - {workout.level}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
