import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  order_index: number;
  exercise?: {
    id: string;
    name: string;
    muscle_groups: string[];
    image_url?: string;
  };
}

interface WorkoutDetailCardProps {
  workout: {
    id: string;
    name: string;
    muscle_groups: string[];
    category?: string;
    division_letter?: string;
    description?: string;
    user_id?: string;
    created_by?: string;
  };
  onEdit: (workout: any) => void;
  onDelete: (workoutId: string) => void;
}

export default function WorkoutDetailCard({ 
  workout, 
  onEdit,
  onDelete 
}: WorkoutDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded && exercises.length === 0) {
      loadExercises();
    }
  }, [isExpanded]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          exercise_id,
          sets,
          reps_min,
          reps_max,
          rest_seconds,
          order_index,
          exercises (
            id,
            name,
            muscle_groups,
            image_url
          )
        `)
        .eq("workout_plan_id", workout.id)
        .order("order_index");

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        ...item,
        exercise: item.exercises as any
      }));
      
      setExercises(formattedData);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level: string | undefined) => {
    const variants: Record<string, string> = {
      "Iniciante": "bg-green-500/20 text-green-500",
      "Intermediário": "bg-yellow-500/20 text-yellow-500",
      "Avançado": "bg-red-500/20 text-red-500"
    };
    return variants[level || ""] || "bg-muted text-foreground";
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center">
              <span className="text-lg font-bold text-black">
                {workout.division_letter || "A"}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-foreground">{workout.name}</h3>
              <p className="text-sm text-muted-foreground">
                {workout.description || workout.muscle_groups?.slice(0, 2).join(" e ")}
              </p>
              <div className="flex gap-1.5 mt-1">
                <Badge className={`text-xs ${getLevelBadge(workout.category)}`}>
                  {workout.category || "Intermediário"}
                </Badge>
                {workout.muscle_groups?.slice(0, 2).map((mg, idx) => (
                  <Badge key={idx} className="bg-lime/20 text-lime text-xs">
                    {mg}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(workout);
              }}
              title="Editar treino"
            >
              <Pencil className="h-4 w-4 text-blue-400" />
            </button>
            <button 
              className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(workout.id);
              }}
              title="Excluir treino"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
            <button className="text-muted-foreground ml-1">
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Exercícios do treino
              </p>
              <span className="text-xs text-muted-foreground">
                {exercises.length} exercícios
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Carregando...
              </p>
            ) : exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum exercício adicionado
              </p>
            ) : (
              <div className="space-y-2">
                {exercises.map((we, index) => (
                  <div 
                    key={we.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    {we.exercise?.image_url ? (
                      <img 
                        src={we.exercise.image_url} 
                        alt={we.exercise?.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-lime/20 flex items-center justify-center">
                        <Dumbbell className="h-4 w-4 text-lime" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {we.exercise?.name || "Exercício"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {we.sets} séries • {we.reps_min}-{we.reps_max} reps • {we.rest_seconds}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-11 mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(workout);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar Treino
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
