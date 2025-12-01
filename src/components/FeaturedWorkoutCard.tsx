import { Play, Clock, Flame, Dumbbell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeaturedWorkoutCardProps {
  id: string;
  title: string;
  duration: number;
  calories: number;
  exercises: number;
  level: string;
  imageUrl: string;
  category?: string;
}

export default function FeaturedWorkoutCard({
  id,
  title,
  duration,
  calories,
  exercises,
  level,
  imageUrl,
  category
}: FeaturedWorkoutCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="relative overflow-hidden rounded-2xl min-w-[280px] h-[180px] cursor-pointer group"
      onClick={() => navigate(`/workout/${id}`)}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Category Badge */}
      {category && (
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-lime text-black rounded-full">
            {category}
          </span>
        </div>
      )}
      
      {/* Level Badge */}
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 text-xs font-medium bg-muted/80 text-foreground rounded-full backdrop-blur-sm">
          {level}
        </span>
      </div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-1">{title}</h3>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange" />
            <span>{calories} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Dumbbell className="w-4 h-4" />
            <span>{exercises}</span>
          </div>
        </div>
      </div>
      
      {/* Play Button */}
      <Button
        size="icon"
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-lime text-black hover:bg-lime/90 shadow-primary opacity-0 group-hover:opacity-100 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/workout/${id}/play`);
        }}
      >
        <Play className="w-5 h-5 fill-current" />
      </Button>
    </Card>
  );
}
