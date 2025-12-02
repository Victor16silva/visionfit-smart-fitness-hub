import { useState } from "react";
import { X, Plus, Dumbbell, Trash2 } from "lucide-react";
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

interface AdminWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExercisePicker: () => void;
  selectedExercises: any[];
  onRemoveExercise: (id: string) => void;
  onSuccess: () => void;
}

export default function AdminWorkoutModal({ 
  isOpen, 
  onClose,
  onOpenExercisePicker,
  selectedExercises,
  onRemoveExercise,
  onSuccess
}: AdminWorkoutModalProps) {
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
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name || !user) {
      toast.error("Preencha o nome do treino");
      return;
    }
    
    setLoading(true);
    try {
      const muscleGroups = formData.focusArea ? [formData.focusArea] : ["Geral"];
      if (formData.focus) {
        muscleGroups.push(formData.focus);
      }

      const { data: workoutData, error } = await supabase
        .from("workout_plans")
        .insert({
          name: formData.name,
          description: formData.focus,
          muscle_groups: muscleGroups,
          category: formData.level,
          division_letter: formData.division,
          user_id: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add exercises to the workout
      if (selectedExercises.length > 0 && workoutData) {
        const exerciseInserts = selectedExercises.map((ex, index) => ({
          workout_plan_id: workoutData.id,
          exercise_id: ex.id,
          order_index: index,
          sets: 4,
          reps_min: 8,
          reps_max: 12,
          rest_seconds: 45
        }));

        await supabase.from("workout_exercises").insert(exerciseInserts);
      }
      
      toast.success("Treino criado com sucesso");
      onSuccess();
      onClose();
      setFormData({
        name: "",
        division: "A",
        focus: "",
        focusArea: "",
        level: "Intermediário",
        duration: "30",
        calories: "200"
      });
    } catch (error) {
      console.error("Error creating workout:", error);
      toast.error("Erro ao criar treino");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">Novo Treino</h2>
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

          {/* Duration and Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Duração (min)</label>
              <Input
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                type="number"
                className="bg-muted border-border h-11"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Calorias</label>
              <Input
                value={formData.calories}
                onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                type="number"
                className="bg-muted border-border h-11"
              />
            </div>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-muted-foreground">Exercícios do Treino</label>
              <span className="text-xs text-muted-foreground">{selectedExercises.length} exercícios</span>
            </div>

            {/* Selected exercises list */}
            {selectedExercises.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedExercises.map((ex) => (
                  <div 
                    key={ex.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-lime/20 flex items-center justify-center">
                        <Dumbbell className="h-4 w-4 text-lime" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ex.name}</p>
                        <p className="text-xs text-muted-foreground">4 séries • 8-12 reps • 45s</p>
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
            onClick={handleCreate}
            disabled={loading}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            {loading ? "Criando..." : "Criar Treino"}
          </Button>
        </div>
      </div>
    </div>
  );
}
