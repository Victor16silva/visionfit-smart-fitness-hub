import { useState, useEffect, useRef, DragEvent } from "react";
import { X, Upload, FileVideo, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  exercise?: Exercise | null;
  onSuccess: () => void;
}

const categories = ["Nenhuma", "Peito", "Costas", "Pernas", "Ombros", "Braços", "Abdômen", "Glúteos"];
const equipmentOptions = ["Nenhum", "Máquina", "Barra", "Haltere", "Cabo", "Peso Corporal", "Kettlebell", "Elástico"];
const difficulties = ["Nenhuma", "Iniciante", "Intermediário", "Avançado"];

export default function ExerciseFormModal({ isOpen, onClose, exercise, onSuccess }: ExerciseFormModalProps) {
  const { user } = useAuth();
  const isEditing = !!exercise;
  
  const [formData, setFormData] = useState({ 
    name: "", category: "", equipment: "", focusArea: "", difficulty: "", 
    mainMuscle: "", description: "", gifUrl: "", videoUrl: "" 
  });
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [uploadingGif, setUploadingGif] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [dragOverGif, setDragOverGif] = useState(false);
  const [dragOverVideo, setDragOverVideo] = useState(false);
  
  const gifInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (exercise) {
      setFormData({ 
        name: exercise.name || "", 
        category: exercise.muscle_groups?.[0] || "", 
        equipment: exercise.equipment || "", 
        focusArea: exercise.muscle_groups?.[0] || "", 
        difficulty: exercise.difficulty || "", 
        mainMuscle: exercise.muscle_groups?.join(", ") || "", 
        description: exercise.description || "", 
        gifUrl: exercise.image_url || "", 
        videoUrl: exercise.video_url || "" 
      });
    } else {
      setFormData({ name: "", category: "", equipment: "", focusArea: "", difficulty: "", mainMuscle: "", description: "", gifUrl: "", videoUrl: "" });
    }
    setNameError(false);
  }, [exercise, isOpen]);

  const uploadFile = async (file: File, type: 'gif' | 'video'): Promise<string | null> => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer upload");
      return null;
    }

    const isGif = type === 'gif';
    const allowedTypes = isGif 
      ? ['image/gif', 'image/png', 'image/jpeg', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`);
      return null;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 50MB");
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('exercise-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('exercise-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload do arquivo");
      return null;
    }
  };

  const handleFileUpload = async (file: File, type: 'gif' | 'video') => {
    if (type === 'gif') {
      setUploadingGif(true);
      const url = await uploadFile(file, type);
      if (url) {
        setFormData(prev => ({ ...prev, gifUrl: url }));
        toast.success("Imagem enviada com sucesso!");
      }
      setUploadingGif(false);
    } else {
      setUploadingVideo(true);
      const url = await uploadFile(file, type);
      if (url) {
        setFormData(prev => ({ ...prev, videoUrl: url }));
        toast.success("Vídeo enviado com sucesso!");
      }
      setUploadingVideo(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, type: 'gif' | 'video') => {
    e.preventDefault();
    if (type === 'gif') setDragOverGif(false);
    else setDragOverVideo(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, type);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: 'gif' | 'video') => {
    e.preventDefault();
    if (type === 'gif') setDragOverGif(true);
    else setDragOverVideo(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>, type: 'gif' | 'video') => {
    e.preventDefault();
    if (type === 'gif') setDragOverGif(false);
    else setDragOverVideo(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setNameError(true);
      toast.error("Nome do exercício é obrigatório");
      return;
    }
    setNameError(false);
    setLoading(true);
    try {
      const muscleGroups: string[] = [];
      if (formData.category && formData.category !== "Nenhuma") muscleGroups.push(formData.category);
      if (formData.focusArea && formData.focusArea !== "Nenhuma" && !muscleGroups.includes(formData.focusArea)) muscleGroups.push(formData.focusArea);
      if (muscleGroups.length === 0) muscleGroups.push("Geral");

      if (isEditing && exercise) {
        const updateData = {
          name: formData.name,
          muscle_groups: muscleGroups,
          equipment: formData.equipment && formData.equipment !== "Nenhum" ? formData.equipment : null,
          difficulty: formData.difficulty && formData.difficulty !== "Nenhuma" ? formData.difficulty : null,
          description: formData.description || null,
          image_url: formData.gifUrl || null,
          video_url: formData.videoUrl || null,
        };
        const { error } = await supabase.from("exercises").update(updateData).eq("id", exercise.id);
        if (error) throw error;
        toast.success("Exercício atualizado com sucesso");
      } else {
        const insertData = {
          name: formData.name,
          muscle_groups: muscleGroups,
          equipment: formData.equipment && formData.equipment !== "Nenhum" ? formData.equipment : null,
          difficulty: formData.difficulty && formData.difficulty !== "Nenhuma" ? formData.difficulty : null,
          description: formData.description || null,
          image_url: formData.gifUrl || null,
          video_url: formData.videoUrl || null,
          created_by: user?.id
        };
        const { error } = await supabase.from("exercises").insert(insertData);
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
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground">{isEditing ? "Editar Exercício" : "Novo Exercício"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nome */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Nome do Exercício <span className="text-destructive">*</span></label>
            <Input 
              value={formData.name} 
              onChange={(e) => { setFormData(prev => ({ ...prev, name: e.target.value })); setNameError(false); }} 
              placeholder="Ex: Supino Reto (barra)" 
              className={`bg-muted border-border h-11 ${nameError ? 'border-destructive' : ''}`} 
            />
            {nameError && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
          </div>
          
          {/* Categoria e Equipamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1.5">Equipamento</label>
              <Select value={formData.equipment} onValueChange={(value) => setFormData(prev => ({ ...prev, equipment: value }))}>
                <SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {equipmentOptions.map((eq) => (<SelectItem key={eq} value={eq}>{eq}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Área de Foco e Dificuldade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-foreground mb-1.5">Área de Foco</label>
              <Select value={formData.focusArea} onValueChange={(value) => setFormData(prev => ({ ...prev, focusArea: value }))}>
                <SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1.5">Dificuldade</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger className="bg-muted border-border h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border z-[60]">
                  {difficulties.map((diff) => (<SelectItem key={diff} value={diff}>{diff}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Músculo Principal */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Músculo Principal</label>
            <Input 
              value={formData.mainMuscle} 
              onChange={(e) => setFormData(prev => ({ ...prev, mainMuscle: e.target.value }))} 
              placeholder="Ex: Peitoral" 
              className="bg-muted border-border h-11" 
            />
          </div>
          
          {/* Descrição */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Descrição / Instruções</label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Descreva como executar o exercício..." 
              className="bg-muted border-border min-h-[100px] resize-none" 
            />
          </div>
          
          {/* URL do GIF com Drag & Drop */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Imagem / GIF do Exercício</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
                dragOverGif ? 'border-lime bg-lime/10' : 'border-border'
              }`}
              onDrop={(e) => handleDrop(e, 'gif')}
              onDragOver={(e) => handleDragOver(e, 'gif')}
              onDragLeave={(e) => handleDragLeave(e, 'gif')}
            >
              {formData.gifUrl ? (
                <div className="relative">
                  <img 
                    src={formData.gifUrl} 
                    alt="Preview" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, gifUrl: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {uploadingGif ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-lime animate-spin" />
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                    </div>
                  ) : (
                    <>
                      <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arraste uma imagem ou GIF aqui
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => gifInputRef.current?.click()}
                        className="border-border"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Arquivo
                      </Button>
                      <input
                        ref={gifInputRef}
                        type="file"
                        accept="image/gif,image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'gif');
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              <div className="mt-3">
                <Input 
                  value={formData.gifUrl} 
                  onChange={(e) => setFormData(prev => ({ ...prev, gifUrl: e.target.value }))} 
                  placeholder="Ou cole uma URL aqui..." 
                  className="bg-muted border-border h-10 text-sm" 
                />
              </div>
            </div>
          </div>
          
          {/* URL do Vídeo com Drag & Drop */}
          <div>
            <label className="block text-sm text-foreground mb-1.5">Vídeo do Exercício</label>
            <div 
              className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
                dragOverVideo ? 'border-lime bg-lime/10' : 'border-border'
              }`}
              onDrop={(e) => handleDrop(e, 'video')}
              onDragOver={(e) => handleDragOver(e, 'video')}
              onDragLeave={(e) => handleDragLeave(e, 'video')}
            >
              {formData.videoUrl ? (
                <div className="relative">
                  <video 
                    src={formData.videoUrl} 
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  {uploadingVideo ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 text-lime animate-spin" />
                      <p className="text-sm text-muted-foreground">Enviando...</p>
                    </div>
                  ) : (
                    <>
                      <FileVideo className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Arraste um vídeo aqui
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        className="border-border"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Escolher Arquivo
                      </Button>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'video');
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              <div className="mt-3">
                <Input 
                  value={formData.videoUrl} 
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))} 
                  placeholder="Ou cole uma URL aqui..." 
                  className="bg-muted border-border h-10 text-sm" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <Button 
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90" 
            onClick={handleSubmit} 
            disabled={loading || uploadingGif || uploadingVideo}
          >
            {loading ? "Salvando..." : isEditing ? "Atualizar Exercício" : "Salvar Exercício"}
          </Button>
        </div>
      </div>
    </div>
  );
}