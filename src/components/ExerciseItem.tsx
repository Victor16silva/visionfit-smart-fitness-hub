import { ChevronRight, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExerciseItemProps {
  name: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  muscleGroup: string;
  imageUrl?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  onPlay?: () => void;
}

export default function ExerciseItem({
  name,
  sets,
  reps,
  restSeconds = 60,
  muscleGroup,
  imageUrl,
  isActive = false,
  isCompleted = false,
  onClick,
  onPlay
}: ExerciseItemProps) {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
        isActive 
          ? "bg-lime/10 border border-lime/30" 
          : isCompleted 
            ? "bg-muted/30 opacity-60" 
            : "bg-card border border-border hover:border-lime/30"
      }`}
      onClick={onClick}
    >
      {/* Exercise Image/Icon */}
      <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${
        isCompleted ? "grayscale" : ""
      }`}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-2xl">💪</span>
          </div>
        )}
      </div>
      
      {/* Exercise Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold text-sm line-clamp-1 ${
          isCompleted ? "text-muted-foreground line-through" : "text-foreground"
        }`}>
          {name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs px-2 py-0">
            {muscleGroup}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {sets} x {reps}
          </span>
          <span className="text-xs text-muted-foreground">
            • {restSeconds}s descanso
          </span>
        </div>
      </div>
      
      {/* Action */}
      {onPlay ? (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isActive 
              ? "bg-lime text-black" 
              : "bg-muted text-muted-foreground hover:bg-lime hover:text-black"
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
  );
}
