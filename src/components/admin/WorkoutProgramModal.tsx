import { useState, useEffect } from "react";
import { X, Plus, Dumbbell, Trash2, ChevronDown, ChevronUp, Upload, Calendar, Clock, Flame, Weight, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  image_url?: string;
}

interface ExerciseWithConfig {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

interface TrainingDay {
  id: string;
  name: string;
  dayOfWeek: string;
  exercises: ExerciseWithConfig[];
  duration: number;
  calories: number;
  totalWeight: number;
}

export interface WorkoutProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProgram?: any;
  studentId?: string | null;
}

const DAYS_OF_WEEK = [
  { value: "Seg", label: "Segunda" },
  { value: "Ter", label: "Terça" },
  { value: "Qua", label: "Quarta" },
  { value: "Qui", label: "Quinta" },
  { value: "Sex", label: "Sexta" },
  { value: "Sáb", label: "Sábado" },
  { value: "Dom", label: "Domingo" },
];

export default function WorkoutProgramModal({ isOpen, onClose, onSuccess, editingProgram, studentId }: WorkoutProgramModalProps) {
  const { user } = useAuth();
  const [programData, setProgramData] = useState({ name: "", description: "", category: "Hipertrofia", coverImageUrl: "", isRecommended: false });
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTrainingDayId, setActiveTrainingDayId] = useState<string | null>(null);
  
  // Training day detail view
  const [selectedTrainingDay, setSelectedTrainingDay] = useState<TrainingDay | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExercises();
      if (editingProgram) {
        loadProgramData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingProgram]);

  const resetForm = () => {
    setProgramData({ name: "", description: "", category: "Hipertrofia", coverImageUrl: "", isRecommended: false });
    setTrainingDays([]);
    setSelectedTrainingDay(null);
  };

  const loadExercises = async () => {
    const { data } = await supabase.from("exercises").select("id, name, muscle_groups, image_url").order("name");
    setAllExercises(data || []);
  };

  const loadProgramData = async () => {
    if (!editingProgram) return;
    
    setProgramData({
      name: editingProgram.name || "",
      description: editingProgram.description || "",
      category: editingProgram.category || "Hipertrofia",
      coverImageUrl: editingProgram.cover_image_url || "",
      isRecommended: editingProgram.is_recommended || false,
    });

    // Load training days (workout_plans linked to this program)
    const { data: workouts } = await supabase
      .from("workout_plans")
      .select(`
        id, name, day_of_week, duration_minutes, calories, total_weight_kg,
        workout_exercises (
          id, sets, reps_min, rest_seconds, order_index,
          exercises (id, name, muscle_groups)
        )
      `)
      .eq("program_id", editingProgram.id)
      .order("created_at");

    if (workouts) {
      const days: TrainingDay[] = workouts.map((w: any) => ({
        id: w.id,
        name: w.name,
        dayOfWeek: w.day_of_week || "Seg",
        duration: w.duration_minutes || 0,
        calories: w.calories || 0,
        totalWeight: w.total_weight_kg || 0,
        exercises: (w.workout_exercises || []).map((we: any) => ({
          id: we.exercises.id,
          name: we.exercises.name,
          sets: we.sets,
          reps: we.reps_min,
          restSeconds: we.rest_seconds,
        })),
      }));
      setTrainingDays(days);
    }
  };

  const addTrainingDay = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nextLetter = letters[trainingDays.length] || "A";
    const newDay: TrainingDay = {
      id: `temp-${Date.now()}`,
      name: `Treino ${nextLetter}`,
      dayOfWeek: DAYS_OF_WEEK[trainingDays.length % 7].value,
      exercises: [],
      duration: 0,
      calories: 0,
      totalWeight: 0,
    };
    setTrainingDays([...trainingDays, newDay]);
  };

  const removeTrainingDay = (dayId: string) => {
    setTrainingDays(trainingDays.filter(d => d.id !== dayId));
    if (selectedTrainingDay?.id === dayId) setSelectedTrainingDay(null);
  };

  const updateTrainingDay = (dayId: string, updates: Partial<TrainingDay>) => {
    setTrainingDays(prev => prev.map(d => d.id === dayId ? { ...d, ...updates } : d));
    if (selectedTrainingDay?.id === dayId) {
      setSelectedTrainingDay(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const openExercisePicker = (dayId: string) => {
    setActiveTrainingDayId(dayId);
    setShowExercisePicker(true);
  };

  const addExerciseToDay = (exercise: Exercise) => {
    if (!activeTrainingDayId) return;
    const newExercise: ExerciseWithConfig = {
      id: exercise.id,
      name: exercise.name,
      sets: 4,
      reps: 8,
      restSeconds: 60,
    };
    updateTrainingDay(activeTrainingDayId, {
      exercises: [...(trainingDays.find(d => d.id === activeTrainingDayId)?.exercises || []), newExercise],
    });
    setShowExercisePicker(false);
  };

  const removeExerciseFromDay = (dayId: string, exerciseId: string) => {
    const day = trainingDays.find(d => d.id === dayId);
    if (day) {
      updateTrainingDay(dayId, {
        exercises: day.exercises.filter(e => e.id !== exerciseId),
      });
    }
  };

  const updateExerciseConfig = (dayId: string, exerciseId: string, field: string, value: number) => {
    const day = trainingDays.find(d => d.id === dayId);
    if (day) {
      updateTrainingDay(dayId, {
        exercises: day.exercises.map(e => e.id === exerciseId ? { ...e, [field]: value } : e),
      });
    }
  };

  const handleSave = async () => {
    if (!programData.name || !user) {
      toast.error("Preencha o nome do programa");
      return;
    }
    if (trainingDays.length === 0) {
      toast.error("Adicione pelo menos um dia de treino");
      return;
    }

    setLoading(true);
    try {
      let programId = editingProgram?.id;

      if (editingProgram) {
        // Update existing program
        const { error } = await supabase.from("workout_programs").update({
          name: programData.name,
          description: programData.description,
          category: programData.category,
          cover_image_url: programData.coverImageUrl || null,
          is_recommended: programData.isRecommended,
        }).eq("id", editingProgram.id);
        if (error) throw error;

        // Delete existing workout plans for this program
        await supabase.from("workout_plans").delete().eq("program_id", editingProgram.id);
      } else {
        // Create new program
        const { data: newProgram, error } = await supabase.from("workout_programs").insert({
          name: programData.name,
          description: programData.description,
          category: programData.category,
          cover_image_url: programData.coverImageUrl || null,
          is_recommended: programData.isRecommended,
          user_id: user.id,
          created_by: user.id,
        }).select().single();
        if (error) throw error;
        programId = newProgram.id;
      }

      // Create training days (workout_plans)
      for (const day of trainingDays) {
        const muscleGroups = [...new Set(day.exercises.flatMap(e => {
          const ex = allExercises.find(x => x.id === e.id);
          return ex?.muscle_groups || [];
        }))];

        const { data: workoutData, error: workoutError } = await supabase.from("workout_plans").insert({
          name: day.name,
          day_of_week: day.dayOfWeek,
          program_id: programId,
          user_id: user.id,
          created_by: user.id,
          muscle_groups: muscleGroups.length > 0 ? muscleGroups : ["Geral"],
          duration_minutes: day.duration || day.exercises.length * 5,
          calories: day.calories || day.exercises.length * 30,
          total_weight_kg: day.totalWeight,
        }).select().single();

        if (workoutError) throw workoutError;

        // Add exercises to workout
        if (day.exercises.length > 0 && workoutData) {
          const exerciseInserts = day.exercises.map((ex, index) => ({
            workout_plan_id: workoutData.id,
            exercise_id: ex.id,
            order_index: index,
            sets: ex.sets,
            reps_min: ex.reps,
            reps_max: ex.reps,
            rest_seconds: ex.restSeconds,
          }));
          await supabase.from("workout_exercises").insert(exerciseInserts);
        }
      }

      toast.success(editingProgram ? "Programa atualizado!" : "Programa criado!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("Erro ao salvar programa");
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = allExercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  // Training Day Detail View
  if (selectedTrainingDay) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="p-4 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedTrainingDay(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
              <Input
                value={selectedTrainingDay.name}
                onChange={(e) => updateTrainingDay(selectedTrainingDay.id, { name: e.target.value })}
                className="text-xl font-bold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                placeholder="Nome do treino"
              />
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Duração</span>
                <Input
                  type="number"
                  value={selectedTrainingDay.duration || ""}
                  onChange={(e) => updateTrainingDay(selectedTrainingDay.id, { duration: parseInt(e.target.value) || 0 })}
                  className="w-16 h-7 text-center bg-muted border-border text-foreground"
                  placeholder="-"
                />
                <span>min</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-4 w-4 text-orange" />
                <Input
                  type="number"
                  value={selectedTrainingDay.calories || ""}
                  onChange={(e) => updateTrainingDay(selectedTrainingDay.id, { calories: parseInt(e.target.value) || 0 })}
                  className="w-16 h-7 text-center bg-muted border-border text-foreground"
                  placeholder="-"
                />
                <span>kcal</span>
              </div>
            </div>

            {/* Day of Week */}
            <div className="mt-4">
              <Select
                value={selectedTrainingDay.dayOfWeek}
                onValueChange={(value) => updateTrainingDay(selectedTrainingDay.id, { dayOfWeek: value })}
              >
                <SelectTrigger className="w-32 bg-amber-500 text-black border-none h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mt-4 bg-amber-500 text-black font-bold h-12 hover:bg-amber-400"
              disabled
            >
              Iniciar Treino
            </Button>
          </div>

          <div className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Lista de exercícios</h3>
            
            {selectedTrainingDay.exercises.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">Exercícios</p>
                <p className="text-sm text-muted-foreground mb-4">Adicione exercícios ao seu treino</p>
                <Button 
                  variant="outline" 
                  className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => openExercisePicker(selectedTrainingDay.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar exercícios
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTrainingDay.exercises.map((ex, index) => (
                  <div key={`${ex.id}-${index}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="w-16 h-16 rounded-lg bg-card flex items-center justify-center">
                      <Dumbbell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExerciseConfig(selectedTrainingDay.id, ex.id, 'sets', parseInt(e.target.value) || 1)}
                          className="w-12 h-7 text-center bg-muted border-border text-sm"
                        />
                        <span className="text-xs text-muted-foreground">séries</span>
                        <Input
                          type="number"
                          value={ex.reps}
                          onChange={(e) => updateExerciseConfig(selectedTrainingDay.id, ex.id, 'reps', parseInt(e.target.value) || 1)}
                          className="w-12 h-7 text-center bg-muted border-border text-sm"
                        />
                        <span className="text-xs text-muted-foreground">reps</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExerciseFromDay(selectedTrainingDay.id, ex.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border sticky bottom-0 bg-card">
            <Button 
              className="w-full bg-amber-100 text-amber-900 font-bold h-12 hover:bg-amber-200"
              onClick={() => openExercisePicker(selectedTrainingDay.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Exercise Picker */}
        {showExercisePicker && (
          <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">Selecionar Exercício</h3>
                <button onClick={() => setShowExercisePicker(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Buscar exercício..." 
                    className="pl-10 bg-muted border-border h-10" 
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[50vh] p-4 pt-0 space-y-2">
                {filteredExercises.map((ex) => (
                  <button 
                    key={ex.id} 
                    onClick={() => addExerciseToDay(ex)} 
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Dumbbell className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.muscle_groups?.join(", ")}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Program View
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">
            {editingProgram ? "Editar Programa" : "Novo Programa de Treino"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Program Info */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Nome do Programa *</label>
            <Input 
              value={programData.name} 
              onChange={(e) => setProgramData(prev => ({ ...prev, name: e.target.value }))} 
              placeholder="Treino Personalizado" 
              className="bg-muted border-border h-11" 
            />
          </div>

          <div>
            <label className="block text-sm text-foreground mb-1.5">Descrição</label>
            <Input 
              value={programData.description} 
              onChange={(e) => setProgramData(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Ganhe massa muscular com uma rotina individualizada" 
              className="bg-muted border-border h-11" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Categoria</label>
              <Select value={programData.category} onValueChange={(value) => setProgramData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-muted border-border h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
                  <SelectItem value="Força">Força</SelectItem>
                  <SelectItem value="Resistência">Resistência</SelectItem>
                  <SelectItem value="Funcional">Funcional</SelectItem>
                  <SelectItem value="HIIT">HIIT</SelectItem>
                  <SelectItem value="Balanceado">Balanceado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="program-recommended" 
                  checked={programData.isRecommended} 
                  onCheckedChange={(checked) => setProgramData(prev => ({ ...prev, isRecommended: !!checked }))} 
                />
                <label htmlFor="program-recommended" className="text-sm text-foreground cursor-pointer">Recomendado</label>
              </div>
            </div>
          </div>

          {/* Training Days */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-foreground">Dias de treino</label>
              <span className="text-sm text-muted-foreground">{trainingDays.length} treinos</span>
            </div>

            <div className="space-y-2">
              {trainingDays.map((day) => (
                <div 
                  key={day.id} 
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => setSelectedTrainingDay(day)}
                >
                  <div>
                    <p className="font-bold text-foreground">{day.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.duration || 0} min • {day.exercises.length} exercício(s) • {day.calories || "-"} kcal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-amber-500 text-black text-sm font-bold">
                      {day.dayOfWeek}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeTrainingDay(day.id); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-3 border-dashed border-border h-11" 
              onClick={addTrainingDay}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Dia de Treino
            </Button>
          </div>

          <Button 
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90" 
            onClick={handleSave} 
            disabled={loading}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : editingProgram ? "Salvar Alterações" : "Criar Programa"}
          </Button>
        </div>
      </div>
    </div>
  );
}