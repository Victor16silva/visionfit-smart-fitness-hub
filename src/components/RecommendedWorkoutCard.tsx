import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Clock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Workout {
  id?: string;
  title: string;
  duration: string;
  calories?: string;
  level: string;
  image: string;
  points?: number;
}

interface RecommendedWorkoutCardProps {
  workouts: Workout[];
}

export default function RecommendedWorkoutCard({ workouts }: RecommendedWorkoutCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const currentWorkout = workouts[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? workouts.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === workouts.length - 1 ? 0 : prev + 1));
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  if (!currentWorkout) return null;

  return (
    <div
      className="relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer group"
      onClick={() => navigate("/workouts")}
    >
      <img
        src={currentWorkout.image}
        alt={currentWorkout.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Points badge */}
      {currentWorkout.points && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-lime/90 rounded-full">
          <span className="text-xs font-bold text-black">🏆 +{currentWorkout.points} pts</span>
        </div>
      )}

      {/* Favorite button */}
      <button
        onClick={toggleFavorite}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
      >
        <Heart 
          className={`h-5 w-5 ${isFavorite ? 'fill-lime text-lime' : 'text-white'}`} 
        />
      </button>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-white font-bold text-lg mb-2">{currentWorkout.title}</h4>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <Clock className="h-4 w-4" />
              <span>{currentWorkout.duration}</span>
            </div>
            {currentWorkout.calories && (
              <div className="flex items-center gap-1 text-white/90 text-sm">
                <Flame className="h-4 w-4" />
                <span>{currentWorkout.calories}</span>
              </div>
            )}
          </div>

          {/* Navigation arrows and level badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              onClick={handleNext}
              className="w-8 h-8 rounded-full bg-lime flex items-center justify-center hover:bg-lime/90 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-black" />
            </button>
            <span className="px-3 py-1 bg-lime text-black text-xs font-bold rounded-full ml-1">
              {currentWorkout.level}
            </span>
          </div>
        </div>
      </div>

      {/* Carousel indicators */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
        {workouts.map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === currentIndex ? 'bg-lime w-4' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
