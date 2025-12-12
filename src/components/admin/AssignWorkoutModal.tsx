import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AssignWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    full_name: string;
    email?: string;
  } | null;
}

interface WorkoutPlan {
  id: string;
  name: string;
}

export default function AssignWorkoutModal({ isOpen, onClose, user }: AssignWorkoutModalProps) {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWorkouts();
    }
  }, [isOpen]);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from("workout_plans")
      .select("id, name")
      .order("name");
    
    setWorkouts(data || []);
  };

  const handleAssign = async () => {
    if (!selectedWorkout || !user) return;
    
    setLoading(true);
    try {
      // Get the workout plan details
      const { data: workoutData } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("id", selectedWorkout)
        .single();

      if (workoutData) {
        // Create a copy of the workout for the user
        const { data: newWorkout, error } = await supabase
          .from("workout_plans")
          .insert({
            name: workoutData.name,
            description: workoutData.description,
            muscle_groups: workoutData.muscle_groups,
            category: workoutData.category,
            division_letter: workoutData.division_letter,
            cover_image_url: workoutData.cover_image_url,
            user_id: user.id,
            created_by: workoutData.created_by
          })
          .select()
          .single();

        if (error) throw error;

        // Create notification for the user
        if (newWorkout) {
          await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Novo Treino Atribuído!",
            message: `O treino "${workoutData.name}" foi atribuído a você. Confira agora!`,
            type: "workout",
            workout_id: newWorkout.id
          });
        }

        toast.success(`Treino atribuído para ${user.full_name}`);
        onClose();
        setSelectedWorkout("");
      }
    } catch (error) {
      console.error("Error assigning workout:", error);
      toast.error("Erro ao atribuir treino");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Atribuir Treino</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* User info */}
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Atribuindo para:</p>
            <p className="font-bold text-foreground">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          {/* Workout select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Selecione o Treino
            </label>
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
              <SelectTrigger className="w-full bg-muted border-border h-12">
                <SelectValue placeholder="Escolha um plano de treino" />
              </SelectTrigger>
              <SelectContent>
                {workouts.map((workout) => (
                  <SelectItem key={workout.id} value={workout.id}>
                    {workout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected workout preview */}
          {selectedWorkout && (
            <div className="bg-lime/20 border border-lime rounded-xl p-3">
              <p className="text-sm font-medium text-lime">
                {workouts.find(w => w.id === selectedWorkout)?.name}
              </p>
            </div>
          )}

          {/* Action button */}
          <Button
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={handleAssign}
            disabled={!selectedWorkout || loading}
          >
            {loading ? "Atribuindo..." : "Atribuir Treino"}
          </Button>
        </div>
      </div>
    </div>
  );
}
