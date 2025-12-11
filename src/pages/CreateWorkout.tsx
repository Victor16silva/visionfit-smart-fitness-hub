import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Dumbbell, ChevronUp, ChevronDown, Upload, Search } from "lucide-react";
import { toast } from "sonner";

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
  isExpanded?: boolean;
}

export default function CreateWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", division: "A", focus: "", focusArea: "", level: "Intermediário", category: "Hipertrofia", duration: "40", calories: "200", totalWeight: "0", coverImageUrl: "", isRecommended: false, isDaily: false, isChallenge: false, challengePoints: "50" });
  const [exercises, setExercises] = useState<ExerciseWithConfig[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    const { data } = await supabase.from("exercises").select("id, name, muscle_groups, image_url").order("name");
    setAllExercises(data || []);
  };

  const toggleExerciseExpanded = (id: string) => setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, isExpanded: !ex.isExpanded } : ex));
  const updateExerciseConfig = (id: string, field: string, value: number) => setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, [field]: value } : ex));
  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    const newExercises = [...exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setExercises(newExercises);
  };
  const removeExercise = (id: string) => setExercises(prev => prev.filter(ex => ex.id !== id));
  const addExercise = (ex: Exercise) => {
    if (!exercises.find(e => e.id === ex.id)) {
      setExercises(prev => [...prev, { id: ex.id, name: ex.name, sets: 4, reps: 8, restSeconds: 60, isExpanded: false }]);
    }
    setShowPicker(false);
  };

  const handleCreate = async () => {
    if (!formData.name || !user) { toast.error("Preencha o nome do treino"); return; }
    if (exercises.length === 0) { toast.error("Adicione pelo menos um exercício"); return; }
    setLoading(true);
    try {
      const muscleGroups = formData.focusArea ? [formData.focusArea] : ["Geral"];
      const { data: workoutData, error } = await supabase.from("workout_plans").insert({ name: formData.name, description: formData.focus, muscle_groups: muscleGroups, category: formData.category, division_letter: formData.division, user_id: user.id, created_by: user.id, duration_minutes: parseInt(formData.duration) || 40, calories: parseInt(formData.calories) || 200, total_weight_kg: parseFloat(formData.totalWeight) || 0, cover_image_url: formData.coverImageUrl || null, is_recommended: formData.isRecommended, is_daily: formData.isDaily, is_challenge: formData.isChallenge, challenge_points: formData.isChallenge ? parseInt(formData.challengePoints) || 50 : 0 }).select().single();
      if (error) throw error;
      if (exercises.length > 0 && workoutData) {
        const exerciseInserts = exercises.map((ex, index) => ({ workout_plan_id: workoutData.id, exercise_id: ex.id, order_index: index, sets: ex.sets, reps_min: ex.reps, reps_max: ex.reps, rest_seconds: ex.restSeconds }));
        await supabase.from("workout_exercises").insert(exerciseInserts);
      }
      toast.success("Treino criado com sucesso!"); navigate("/dashboard");
    } catch (error) { console.error(error); toast.error("Erro ao criar treino"); } finally { setLoading(false); }
  };

  const filteredExercises = allExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-lg font-bold text-foreground">Criar Treino Personalizado</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><label className="block text-sm text-foreground mb-1.5">Nome do Treino *</label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Superior Peito Avançado" className="bg-muted border-border h-11" /></div>
          <div><label className="block text-sm text-foreground mb-1.5">Divisão *</label><Input value={formData.division} onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))} placeholder="A" className="bg-muted border-border h-11" /></div>
        </div>
        <div><label className="block text-sm text-foreground mb-1.5">Foco</label><Input value={formData.focus} onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))} placeholder="Peito e Tríceps" className="bg-muted border-border h-11" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-foreground mb-1.5">Área de Foco</label><Select value={formData.focusArea} onValueChange={(value) => setFormData(prev => ({ ...prev, focusArea: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Peito">Peito</SelectItem><SelectItem value="Costas">Costas</SelectItem><SelectItem value="Pernas">Pernas</SelectItem><SelectItem value="Ombros">Ombros</SelectItem><SelectItem value="Braços">Braços</SelectItem><SelectItem value="Abdômen">Abdômen</SelectItem></SelectContent></Select></div>
          <div><label className="block text-sm text-foreground mb-1.5">Nível</label><Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Iniciante">Iniciante</SelectItem><SelectItem value="Intermediário">Intermediário</SelectItem><SelectItem value="Avançado">Avançado</SelectItem></SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-foreground mb-1.5">Categoria</label><Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Hipertrofia">Hipertrofia</SelectItem><SelectItem value="Força">Força</SelectItem><SelectItem value="Resistência">Resistência</SelectItem><SelectItem value="Funcional">Funcional</SelectItem><SelectItem value="HIIT">HIIT</SelectItem></SelectContent></Select></div>
          <div><label className="block text-sm text-foreground mb-1.5">Duração (min)</label><Input value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-foreground mb-1.5">Calorias</label><Input value={formData.calories} onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div>
          <div><label className="block text-sm text-foreground mb-1.5">Carga Total (kg)</label><Input value={formData.totalWeight} onChange={(e) => setFormData(prev => ({ ...prev, totalWeight: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div>
        </div>
        <div><label className="block text-sm text-foreground mb-1.5">Imagem de Capa</label><div className="flex gap-2"><Input value={formData.coverImageUrl} onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))} placeholder="https://..." className="bg-muted border-border h-11 flex-1" /><Button variant="outline" size="icon" className="h-11 w-11 border-border"><Upload className="h-4 w-4" /></Button></div></div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Checkbox id="recommended-user" checked={formData.isRecommended} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecommended: !!checked }))} /><label htmlFor="recommended-user" className="text-sm text-foreground cursor-pointer">Recomendado</label></div>
          <div className="flex items-center gap-2"><Checkbox id="daily-user" checked={formData.isDaily} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDaily: !!checked }))} /><label htmlFor="daily-user" className="text-sm text-foreground cursor-pointer">Treino Diário</label></div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2"><Checkbox id="challenge-user" checked={formData.isChallenge} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isChallenge: !!checked }))} /><label htmlFor="challenge-user" className="text-sm text-amber-400 cursor-pointer">🏆 Marcar como Desafio</label></div>
          {formData.isChallenge && <div><label className="block text-sm text-foreground mb-1.5">Pontos do Desafio</label><Input value={formData.challengePoints} onChange={(e) => setFormData(prev => ({ ...prev, challengePoints: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div>}
        </div>

        {/* Exercises Section */}
        <div>
          <div className="flex items-center justify-between mb-2"><label className="block text-sm text-foreground">Exercícios do Treino</label><span className="text-sm text-muted-foreground">{exercises.length} exercícios</span></div>
          {exercises.length > 0 && <div className="space-y-2 mb-3">{exercises.map((ex, index) => (
            <div key={ex.id} className="bg-muted/50 rounded-lg border border-border overflow-hidden">
              <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleExerciseExpanded(ex.id)}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1"><button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'up'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0}><ChevronUp className="h-3 w-3" /></button><button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'down'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === exercises.length - 1}><ChevronDown className="h-3 w-3" /></button></div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Dumbbell className="h-5 w-5 text-amber-500" /></div>
                  <div><p className="text-sm font-medium text-foreground">{ex.name}</p><p className="text-xs text-muted-foreground">{ex.sets} séries • {ex.reps} reps • {ex.restSeconds}s</p></div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeExercise(ex.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              {ex.isExpanded && <div className="px-3 pb-3 grid grid-cols-3 gap-2"><div><label className="block text-xs text-muted-foreground mb-1">Séries</label><Input type="number" value={ex.sets} onChange={(e) => updateExerciseConfig(ex.id, 'sets', parseInt(e.target.value) || 1)} className="bg-muted border-border h-10 text-center font-bold" /></div><div><label className="block text-xs text-muted-foreground mb-1">Reps</label><Input type="number" value={ex.reps} onChange={(e) => updateExerciseConfig(ex.id, 'reps', parseInt(e.target.value) || 1)} className="bg-muted border-border h-10 text-center font-bold" /></div><div><label className="block text-xs text-muted-foreground mb-1">Descanso (s)</label><Input type="number" value={ex.restSeconds} onChange={(e) => updateExerciseConfig(ex.id, 'restSeconds', parseInt(e.target.value) || 30)} className="bg-muted border-border h-10 text-center font-bold" /></div></div>}
            </div>
          ))}</div>}
          <Button variant="outline" className="w-full border-dashed border-border h-11" onClick={() => setShowPicker(true)}><Plus className="h-4 w-4 mr-2" />Adicionar Exercício</Button>
        </div>

        <Button className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90" onClick={handleCreate} disabled={loading}><Dumbbell className="h-4 w-4 mr-2" />{loading ? "Criando..." : "Criar Treino"}</Button>
      </main>

      {/* Exercise Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Selecionar Exercício</h3>
              <button onClick={() => setShowPicker(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar exercício..." className="pl-10 bg-muted border-border h-10" /></div></div>
            <div className="overflow-y-auto max-h-[50vh] p-4 pt-0 space-y-2">
              {filteredExercises.map((ex) => (
                <button key={ex.id} onClick={() => addExercise(ex)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted text-left transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Dumbbell className="h-5 w-5 text-amber-500" /></div>
                  <div><p className="text-sm font-medium text-foreground">{ex.name}</p><p className="text-xs text-muted-foreground">{ex.muscle_groups?.join(", ")}</p></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
