import { Clock, Flame, Dumbbell, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface WorkoutCardProps {
  id: string;
  title: string;
  duration: number;
  calories: number;
  exercises: number;
  level: string;
  imageUrl: string;
  category?: string;
  muscleGroups?: string[];
  isFavorite?: boolean;
  variant?: "horizontal" | "vertical";
}

export default function WorkoutCard({
  id,
  title,
  duration,
  calories,
  exercises,
  level,
  imageUrl,
  category,
  muscleGroups = [],
  isFavorite = false,
  variant = "vertical"
}: WorkoutCardProps) {
  const navigate = useNavigate();
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
    // TODO: Save to database
  };

  const levelColors: Record<string, string> = {
    "Iniciante": "bg-lime/20 text-lime",
    "Intermediário": "bg-orange/20 text-orange",
    "Avançado": "bg-destructive/20 text-destructive",
  };

  if (variant === "horizontal") {
    return (
      <Card 
        className="flex overflow-hidden rounded-2xl bg-card border-border cursor-pointer group hover:border-lime/50 transition-all"
        onClick={() => navigate(`/workout/${id}`)}
      >
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50" />
        </div>
        
        {/* Content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {category && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {category}
                </Badge>
              )}
              <Badge className={`text-xs px-2 py-0 ${levelColors[level] || "bg-muted text-muted-foreground"}`}>
                {level}
              </Badge>
            </div>
            <h3 className="font-bold text-foreground line-clamp-1">{title}</h3>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration}min
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {calories}kcal
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3" />
              {exercises}
            </span>
          </div>
        </div>
        
        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className="p-3 self-center"
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              favorite ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"
            }`} 
          />
        </button>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden rounded-2xl bg-card border-border cursor-pointer group hover:border-lime/50 transition-all"
      onClick={() => navigate(`/workout/${id}`)}
    >
      {/* Image */}
      <div className="relative h-32">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              favorite ? "fill-destructive text-destructive" : "text-foreground"
            }`} 
          />
        </button>
        
        {/* Level Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`text-xs ${levelColors[level] || "bg-muted text-muted-foreground"}`}>
            {level}
          </Badge>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-foreground line-clamp-1 mb-2">{title}</h3>
        
        {muscleGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {muscleGroups.slice(0, 2).map((group) => (
              <Badge key={group} variant="outline" className="text-xs">
                {group}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}min
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {calories}kcal
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3" />
            {exercises}
          </span>
        </div>
      </div>
    </Card>
  );
}
