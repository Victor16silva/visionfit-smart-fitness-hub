import { useState, useEffect } from "react";
import { X, Plus, Dumbbell, Trash2, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface WorkoutExercise { id?: string; exercise_id: string; sets: number; reps_min: number; reps_max: number; rest_seconds: number; order_index: number; isExpanded?: boolean; exercise?: { id: string; name: string; muscle_groups: string[]; image_url?: string; }; }
interface EditWorkoutModalProps { isOpen: boolean; onClose: () => void; workout: { id: string; name: string; muscle_groups: string[]; category?: string; division_letter?: string; description?: string; user_id?: string; duration_minutes?: number; calories?: number; total_weight_kg?: number; cover_image_url?: string; is_recommended?: boolean; is_daily?: boolean; is_challenge?: boolean; challenge_points?: number; } | null; onOpenExercisePicker: () => void; selectedExercises: any[]; onRemoveExercise: (id: string) => void; onSuccess: () => void; }

export default function EditWorkoutModal({ isOpen, onClose, workout, onOpenExercisePicker, selectedExercises, onRemoveExercise, onSuccess }: EditWorkoutModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: "", division: "A", focus: "", focusArea: "", level: "Intermediário", category: "Hipertrofia", duration: "40", calories: "200", totalWeight: "0", coverImageUrl: "", isRecommended: false, isDaily: false, isChallenge: false, challengePoints: "50" });
  const [existingExercises, setExistingExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (workout && isOpen) {
      setFormData({ name: workout.name || "", division: workout.division_letter || "A", focus: workout.description || "", focusArea: workout.muscle_groups?.[0] || "", level: workout.category || "Intermediário", category: workout.category || "Hipertrofia", duration: String(workout.duration_minutes || 40), calories: String(workout.calories || 200), totalWeight: String(workout.total_weight_kg || 0), coverImageUrl: workout.cover_image_url || "", isRecommended: workout.is_recommended || false, isDaily: workout.is_daily || false, isChallenge: workout.is_challenge || false, challengePoints: String(workout.challenge_points || 50) });
      loadWorkoutExercises();
    }
  }, [workout, isOpen]);

  const loadWorkoutExercises = async () => {
    if (!workout) return;
    setLoadingExercises(true);
    try {
      const { data, error } = await supabase.from("workout_exercises").select(`id, exercise_id, sets, reps_min, reps_max, rest_seconds, order_index, exercises (id, name, muscle_groups, image_url)`).eq("workout_plan_id", workout.id).order("order_index");
      if (error) throw error;
      setExistingExercises((data || []).map(item => ({ ...item, exercise: item.exercises as any, isExpanded: false })));
    } catch (error) { console.error("Error loading exercises:", error); } finally { setLoadingExercises(false); }
  };

  const toggleExerciseExpanded = (id: string) => setExistingExercises(prev => prev.map(ex => ex.id === id ? { ...ex, isExpanded: !ex.isExpanded } : ex));
  const updateExerciseConfig = async (id: string, field: string, value: number) => {
    setExistingExercises(prev => prev.map(ex => { if (ex.id === id) { if (field === 'sets') return { ...ex, sets: value }; if (field === 'reps') return { ...ex, reps_min: value, reps_max: value }; if (field === 'restSeconds') return { ...ex, rest_seconds: value }; } return ex; }));
    try { const updateData: any = {}; if (field === 'sets') updateData.sets = value; if (field === 'reps') { updateData.reps_min = value; updateData.reps_max = value; } if (field === 'restSeconds') updateData.rest_seconds = value; await supabase.from("workout_exercises").update(updateData).eq("id", id); } catch (error) { console.error("Error updating exercise:", error); }
  };
  const moveExercise = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= existingExercises.length) return;
    const newExercises = [...existingExercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    newExercises.forEach((ex, i) => ex.order_index = i);
    setExistingExercises(newExercises);
    try { for (const ex of newExercises) { if (ex.id) await supabase.from("workout_exercises").update({ order_index: ex.order_index }).eq("id", ex.id); } } catch (error) { console.error("Error reordering:", error); }
  };

  const handleUpdate = async () => {
    if (!formData.name || !workout) { toast.error("Preencha o nome do treino"); return; }
    setLoading(true);
    try {
      const muscleGroups = formData.focusArea ? [formData.focusArea] : workout.muscle_groups;
      const { error: updateError } = await supabase.from("workout_plans").update({ name: formData.name, description: formData.focus, muscle_groups: muscleGroups, category: formData.category, division_letter: formData.division, duration_minutes: parseInt(formData.duration) || 40, calories: parseInt(formData.calories) || 200, total_weight_kg: parseFloat(formData.totalWeight) || 0, cover_image_url: formData.coverImageUrl || null, is_recommended: formData.isRecommended, is_daily: formData.isDaily, is_challenge: formData.isChallenge, challenge_points: formData.isChallenge ? parseInt(formData.challengePoints) || 50 : 0 }).eq("id", workout.id);
      if (updateError) throw updateError;
      if (selectedExercises.length > 0) {
        const maxOrderIndex = existingExercises.length > 0 ? Math.max(...existingExercises.map(e => e.order_index)) : -1;
        const exerciseInserts = selectedExercises.map((ex, index) => ({ workout_plan_id: workout.id, exercise_id: ex.id, order_index: maxOrderIndex + 1 + index, sets: ex.sets || 4, reps_min: ex.reps || 8, reps_max: ex.reps || 12, rest_seconds: ex.restSeconds || 60 }));
        await supabase.from("workout_exercises").insert(exerciseInserts);
      }
      toast.success("Treino atualizado com sucesso"); onSuccess(); onClose();
    } catch (error) { console.error("Error updating workout:", error); toast.error("Erro ao atualizar treino"); } finally { setLoading(false); }
  };

  const handleRemoveExistingExercise = async (exerciseId: string) => {
    try { const { error } = await supabase.from("workout_exercises").delete().eq("id", exerciseId); if (error) throw error; setExistingExercises(prev => prev.filter(e => e.id !== exerciseId)); toast.success("Exercício removido"); } catch (error) { console.error("Error removing exercise:", error); toast.error("Erro ao remover exercício"); }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      setUploadingImage(true);

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `workout-cover-${workout?.id || Date.now()}-${Date.now()}.${fileExt}`;
      const filePath = `workout-covers/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update form data with new URL
      setFormData(prev => ({ ...prev, coverImageUrl: publicUrl }));

      toast.success("Imagem carregada com sucesso!");
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isOpen || !workout) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10"><h2 className="text-lg font-bold text-foreground">Editar Treino</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"><X className="h-4 w-4 text-muted-foreground" /></button></div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3"><div className="col-span-2"><label className="block text-sm text-foreground mb-1.5">Nome do Treino *</label><Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Superior Peito Avançado" className="bg-muted border-border h-11" /></div><div><label className="block text-sm text-foreground mb-1.5">Divisão *</label><Input value={formData.division} onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))} placeholder="A" className="bg-muted border-border h-11" /></div></div>
          <div><label className="block text-sm text-foreground mb-1.5">Foco</label><Input value={formData.focus} onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))} placeholder="Peito e Tríceps" className="bg-muted border-border h-11" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm text-foreground mb-1.5">Área de Foco</label><Select value={formData.focusArea} onValueChange={(value) => setFormData(prev => ({ ...prev, focusArea: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Peito">Peito</SelectItem><SelectItem value="Costas">Costas</SelectItem><SelectItem value="Pernas">Pernas</SelectItem><SelectItem value="Ombros">Ombros</SelectItem><SelectItem value="Braços">Braços</SelectItem><SelectItem value="Abdômen">Abdômen</SelectItem></SelectContent></Select></div><div><label className="block text-sm text-foreground mb-1.5">Nível</label><Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Iniciante">Iniciante</SelectItem><SelectItem value="Intermediário">Intermediário</SelectItem><SelectItem value="Avançado">Avançado</SelectItem></SelectContent></Select></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm text-foreground mb-1.5">Categoria</label><Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}><SelectTrigger className="bg-muted border-border h-11"><SelectValue /></SelectTrigger><SelectContent className="bg-card border-border z-[60]"><SelectItem value="Hipertrofia">Hipertrofia</SelectItem><SelectItem value="Força">Força</SelectItem><SelectItem value="Resistência">Resistência</SelectItem><SelectItem value="Funcional">Funcional</SelectItem><SelectItem value="HIIT">HIIT</SelectItem></SelectContent></Select></div><div><label className="block text-sm text-foreground mb-1.5">Duração (min)</label><Input value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="block text-sm text-foreground mb-1.5">Calorias</label><Input value={formData.calories} onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div><div><label className="block text-sm text-foreground mb-1.5">Carga Total (kg)</label><Input value={formData.totalWeight} onChange={(e) => setFormData(prev => ({ ...prev, totalWeight: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div></div>
          <div><label className="block text-sm text-foreground mb-1.5">Imagem de Capa</label><div className="flex gap-2"><Input value={formData.coverImageUrl} onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))} placeholder="https://..." className="bg-muted border-border h-11 flex-1" /><input type="file" id="cover-image-upload" accept="image/*" onChange={handleCoverImageUpload} className="hidden" /><Button variant="outline" size="icon" className="h-11 w-11 border-border" onClick={() => document.getElementById('cover-image-upload')?.click()} disabled={uploadingImage} type="button">{uploadingImage ? <span className="animate-spin">⏳</span> : <Upload className="h-4 w-4" />}</Button></div></div>
          <div className="flex items-center gap-6"><div className="flex items-center gap-2"><Checkbox id="recommended-edit" checked={formData.isRecommended} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecommended: !!checked }))} /><label htmlFor="recommended-edit" className="text-sm text-foreground cursor-pointer">Recomendado</label></div><div className="flex items-center gap-2"><Checkbox id="daily-edit" checked={formData.isDaily} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDaily: !!checked }))} /><label htmlFor="daily-edit" className="text-sm text-foreground cursor-pointer">Treino Diário</label></div></div>
          <div className="space-y-3"><div className="flex items-center gap-2"><Checkbox id="challenge-edit" checked={formData.isChallenge} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isChallenge: !!checked }))} /><label htmlFor="challenge-edit" className="text-sm text-amber-400 cursor-pointer">🏆 Marcar como Desafio</label></div>{formData.isChallenge && <div><label className="block text-sm text-foreground mb-1.5">Pontos do Desafio</label><Input value={formData.challengePoints} onChange={(e) => setFormData(prev => ({ ...prev, challengePoints: e.target.value }))} type="number" className="bg-muted border-border h-11" /></div>}</div>
          <div>
            <div className="flex items-center justify-between mb-2"><label className="block text-sm text-foreground">Exercícios do Treino</label><span className="text-sm text-muted-foreground">{existingExercises.length + selectedExercises.length} exercícios</span></div>
            {loadingExercises ? <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p> : <div className="space-y-2 mb-3">
              {existingExercises.map((we, index) => (
                <div key={we.id} className="bg-muted/50 rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => toggleExerciseExpanded(we.id!)}>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1"><button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'up'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === 0}><ChevronUp className="h-3 w-3" /></button><button onClick={(e) => { e.stopPropagation(); moveExercise(index, 'down'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={index === existingExercises.length - 1}><ChevronDown className="h-3 w-3" /></button></div>
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center"><Dumbbell className="h-5 w-5 text-amber-500" /></div>
                      <div><p className="text-sm font-medium text-foreground">{we.exercise?.name || "Exercício"}</p><p className="text-xs text-muted-foreground">{we.sets} séries • {we.reps_min} reps • {we.rest_seconds}s</p></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveExistingExercise(we.id!); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {we.isExpanded && <div className="px-3 pb-3 grid grid-cols-3 gap-2"><div><label className="block text-xs text-muted-foreground mb-1">Séries</label><Input type="number" value={we.sets} onChange={(e) => updateExerciseConfig(we.id!, 'sets', parseInt(e.target.value) || 1)} className="bg-muted border-border h-10 text-center font-bold" /></div><div><label className="block text-xs text-muted-foreground mb-1">Reps</label><Input type="number" value={we.reps_min} onChange={(e) => updateExerciseConfig(we.id!, 'reps', parseInt(e.target.value) || 1)} className="bg-muted border-border h-10 text-center font-bold" /></div><div><label className="block text-xs text-muted-foreground mb-1">Descanso (s)</label><Input type="number" value={we.rest_seconds} onChange={(e) => updateExerciseConfig(we.id!, 'restSeconds', parseInt(e.target.value) || 30)} className="bg-muted border-border h-10 text-center font-bold" /></div></div>}
                </div>
              ))}
              {selectedExercises.map((ex) => (<div key={ex.id} className="flex items-center justify-between p-3 bg-lime/10 rounded-lg border border-lime/30"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-lime/20 flex items-center justify-center"><Plus className="h-5 w-5 text-lime" /></div><div><p className="text-sm font-medium text-foreground">{ex.name}</p><p className="text-xs text-lime">Novo • 4 séries • 8 reps • 60s</p></div></div><button onClick={() => onRemoveExercise(ex.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>))}
            </div>}
            <Button variant="outline" className="w-full border-dashed border-border h-11" onClick={onOpenExercisePicker}><Plus className="h-4 w-4 mr-2" />Adicionar Exercício</Button>
          </div>
          <Button className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90" onClick={handleUpdate} disabled={loading}><Dumbbell className="h-4 w-4 mr-2" />{loading ? "Salvando..." : "Salvar Alterações"}</Button>
        </div>
      </div>
    </div>
  );
}
