import { useState, useEffect } from "react";
import { X, Plus, Dumbbell, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface WorkoutExercise {
  id?: string;
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

interface EditWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: {
    id: string;
    name: string;
    muscle_groups: string[];
    category?: string;
    division_letter?: string;
    description?: string;
    user_id?: string;
  } | null;
  onOpenExercisePicker: () => void;
  selectedExercises: any[];
  onRemoveExercise: (id: string) => void;
  onSuccess: () => void;
}

export default function EditWorkoutModal({ 
  isOpen, 
  onClose, 
  workout,
  onOpenExercisePicker,
  selectedExercises,
  onRemoveExercise,
  onSuccess
}: EditWorkoutModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    division: "A",
    focus: "",
    focusArea: "",
    level: "Intermediário",
    duration: "30",
    calories: "200"
  });
  const [existingExercises, setExistingExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (workout && isOpen) {
      setFormData({
        name: workout.name || "",
        division: workout.division_letter || "A",
        focus: workout.description || "",
        focusArea: workout.muscle_groups?.[0] || "",
        level: workout.category || "Intermediário",
        duration: "30",
        calories: "200"
      });
      loadWorkoutExercises();
    }
  }, [workout, isOpen]);

  const loadWorkoutExercises = async () => {
    if (!workout) return;
    
    setLoadingExercises(true);
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
      
      setExistingExercises(formattedData);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.name || !workout) {
      toast.error("Preencha o nome do treino");
      return;
    }
    
    setLoading(true);
    try {
      const muscleGroups = formData.focusArea ? [formData.focusArea] : [];
      if (formData.focus && !muscleGroups.includes(formData.focus)) {
        muscleGroups.push(formData.focus);
      }

      // Update workout plan
      const { error: updateError } = await supabase
        .from("workout_plans")
        .update({
          name: formData.name,
          description: formData.focus,
          muscle_groups: muscleGroups.length > 0 ? muscleGroups : workout.muscle_groups,
          category: formData.level,
          division_letter: formData.division,
        })
        .eq("id", workout.id);

      if (updateError) throw updateError;

      // Add new exercises if any
      if (selectedExercises.length > 0) {
        const maxOrderIndex = existingExercises.length > 0 
          ? Math.max(...existingExercises.map(e => e.order_index)) 
          : -1;

        const exerciseInserts = selectedExercises.map((ex, index) => ({
          workout_plan_id: workout.id,
          exercise_id: ex.id,
          order_index: maxOrderIndex + 1 + index,
          sets: 4,
          reps_min: 8,
          reps_max: 12,
          rest_seconds: 45
        }));

        await supabase.from("workout_exercises").insert(exerciseInserts);
      }
      
      toast.success("Treino atualizado com sucesso");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating workout:", error);
      toast.error("Erro ao atualizar treino");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("workout_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;
      
      setExistingExercises(prev => prev.filter(e => e.id !== exerciseId));
      toast.success("Exercício removido");
    } catch (error) {
      console.error("Error removing exercise:", error);
      toast.error("Erro ao remover exercício");
    }
  };

  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">Editar Treino</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Name and Division */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted-foreground mb-1.5">Nome do Treino *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Treino A - Peito"
                className="bg-muted border-border h-11"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Divisão *</label>
              <Input
                value={formData.division}
                onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                placeholder="A"
                className="bg-muted border-border h-11"
              />
            </div>
          </div>

          {/* Focus */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Foco / Descrição</label>
            <Input
              value={formData.focus}
              onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))}
              placeholder="Ex: Peito e Tríceps"
              className="bg-muted border-border h-11"
            />
          </div>

          {/* Focus Area and Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Área de Foco</label>
              <Select 
                value={formData.focusArea} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, focusArea: value }))}
              >
                <SelectTrigger className="bg-muted border-border h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  <SelectItem value="Peito">Peito</SelectItem>
                  <SelectItem value="Costas">Costas</SelectItem>
                  <SelectItem value="Pernas">Pernas</SelectItem>
                  <SelectItem value="Ombros">Ombros</SelectItem>
                  <SelectItem value="Braços">Braços</SelectItem>
                  <SelectItem value="Abdômen">Abdômen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Nível</label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
              >
                <SelectTrigger className="bg-muted border-border h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Existing Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-muted-foreground">Exercícios do Treino</label>
              <span className="text-xs text-muted-foreground">
                {existingExercises.length + selectedExercises.length} exercícios
              </span>
            </div>

            {loadingExercises ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : (
              <div className="space-y-2 mb-3">
                {/* Existing exercises */}
                {existingExercises.map((we, index) => (
                  <div 
                    key={we.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <div className="w-8 h-8 rounded bg-lime/20 flex items-center justify-center">
                        <Dumbbell className="h-4 w-4 text-lime" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {we.exercise?.name || "Exercício"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {we.sets} séries • {we.reps_min}-{we.reps_max} reps • {we.rest_seconds}s
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveExistingExercise(we.id!)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* New exercises to add */}
                {selectedExercises.map((ex) => (
                  <div 
                    key={ex.id}
                    className="flex items-center justify-between p-3 bg-lime/10 rounded-lg border border-lime/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-lime/20 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-lime" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ex.name}</p>
                        <p className="text-xs text-lime">Novo • 4 séries • 8-12 reps</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemoveExercise(ex.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-dashed border-border h-11"
              onClick={onOpenExercisePicker}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Exercício
            </Button>
          </div>

          {/* Submit button */}
          <Button
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={handleUpdate}
            disabled={loading}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
