import { useState, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  difficulty?: string;
  equipment?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
}

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: Exercise | null; // If provided, we're editing
  onSuccess: () => void;
}

const categories = ["Peito", "Costas", "Pernas", "Ombros", "Braços", "Abdômen", "Glúteos"];
const equipment = ["Máquina", "Barra", "Haltere", "Cabo", "Peso Corporal", "Kettlebell", "Elástico"];
const difficulties = ["Iniciante", "Intermediário", "Avançado"];

export default function ExerciseFormModal({ 
  isOpen, 
  onClose, 
  exercise,
  onSuccess 
}: ExerciseFormModalProps) {
  const { user } = useAuth();
  const isEditing = !!exercise;
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    equipment: "",
    focusArea: "",
    difficulty: "Intermediário",
    mainMuscle: "",
    description: "",
    gifUrl: "",
    videoUrl: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.name || "",
        category: exercise.muscle_groups?.[0] || "",
        equipment: exercise.equipment || "",
        focusArea: exercise.muscle_groups?.[0] || "",
        difficulty: exercise.difficulty || "Intermediário",
        mainMuscle: exercise.muscle_groups?.join(", ") || "",
        description: exercise.description || "",
        gifUrl: exercise.image_url || "",
        videoUrl: exercise.video_url || ""
      });
    } else {
      setFormData({
        name: "",
        category: "",
        equipment: "",
        focusArea: "",
        difficulty: "Intermediário",
        mainMuscle: "",
        description: "",
        gifUrl: "",
        videoUrl: ""
      });
    }
  }, [exercise, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Preencha o nome e categoria do exercício");
      return;
    }
    
    setLoading(true);
    try {
      const muscleGroups = [formData.category];
      if (formData.focusArea && !muscleGroups.includes(formData.focusArea)) {
        muscleGroups.push(formData.focusArea);
      }

      const exerciseData = {
        name: formData.name,
        muscle_groups: muscleGroups,
        equipment: formData.equipment || null,
        difficulty: formData.difficulty || null,
        description: formData.description || null,
        image_url: formData.gifUrl || null,
        video_url: formData.videoUrl || null,
        created_by: user?.id
      };

      if (isEditing && exercise) {
        const { error } = await supabase
          .from("exercises")
          .update(exerciseData)
          .eq("id", exercise.id);

        if (error) throw error;
        toast.success("Exercício atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("exercises")
          .insert(exerciseData);

        if (error) throw error;
        toast.success("Exercício criado com sucesso");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("Erro ao salvar exercício");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? "Editar Exercício" : "Novo Exercício"}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Name */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Nome do Exercício *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Supino Reto (barra)"
              className="bg-muted border-border h-11"
            />
          </div>

          {/* Category and Equipment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Categoria *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-muted border-border h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Equipamento *</label>
              <Select 
                value={formData.equipment} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}
              >
                <SelectTrigger className="bg-muted border-border h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {equipment.map((eq) => (
                    <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Focus Area and Difficulty */}
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
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Dificuldade</label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger className="bg-muted border-border h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Muscle */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Músculo Principal</label>
            <Input
              value={formData.mainMuscle}
              onChange={(e) => setFormData(prev => ({ ...prev, mainMuscle: e.target.value }))}
              placeholder="Ex: Peitoral"
              className="bg-muted border-border h-11"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Descrição / Instruções</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva como executar o exercício..."
              className="bg-muted border-border min-h-[100px] resize-none"
            />
          </div>

          {/* GIF URL */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">URL do GIF</label>
            <div className="flex gap-2">
              <Input
                value={formData.gifUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, gifUrl: e.target.value }))}
                placeholder="https://..."
                className="bg-muted border-border h-11 flex-1"
              />
              <Button variant="outline" size="icon" className="h-11 w-11 border-border">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">URL do Vídeo</label>
            <Input
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://..."
              className="bg-muted border-border h-11"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Salvando..." : isEditing ? "Atualizar Exercício" : "Salvar Exercício"}
          </Button>
        </div>
      </div>
    </div>
  );
}
