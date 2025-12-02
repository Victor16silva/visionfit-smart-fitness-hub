import { motion } from "framer-motion";
import { Camera, Upload, X, SkipForward } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PhotoUploadStepProps {
  userId: string;
  photos: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  onChange: (photos: { front: string; back: string; left: string; right: string }) => void;
  onSkip: () => void;
}

const photoPositions = [
  { id: "front", label: "Frente", icon: "👤" },
  { id: "back", label: "Costas", icon: "🔙" },
  { id: "left", label: "Lado Esquerdo", icon: "👈" },
  { id: "right", label: "Lado Direito", icon: "👉" },
];

export function PhotoUploadStep({ userId, photos, onChange, onSkip }: PhotoUploadStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = async (position: string, file: File) => {
    if (!file) return;

    setUploading(position);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${position}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName);

      onChange({
        ...photos,
        [position]: publicUrl,
      });

      toast({ title: "Foto enviada com sucesso!" });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = (position: string) => {
    onChange({
      ...photos,
      [position]: "",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Fotos de Avaliação
        </h1>
        <p className="text-muted-foreground text-sm">
          Tire fotos para acompanhar sua evolução (opcional)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photoPositions.map((pos, index) => {
          const photoUrl = photos[pos.id as keyof typeof photos];
          const isUploading = uploading === pos.id;
          
          return (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative aspect-[3/4] cursor-pointer transition-all overflow-hidden ${
                  photoUrl
                    ? "border-lime"
                    : "bg-card border-border border-dashed hover:border-lime/50"
                }`}
                onClick={() => !photoUrl && fileInputRefs.current[pos.id]?.click()}
              >
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt={pos.label}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(pos.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs font-medium text-center">{pos.label}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4">
                    {isUploading ? (
                      <div className="animate-spin w-8 h-8 border-2 border-lime border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <div className="text-3xl mb-2">{pos.icon}</div>
                        <Camera className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground text-center">{pos.label}</p>
                      </>
                    )}
                  </div>
                )}
                
                <input
                  ref={(el) => (fileInputRefs.current[pos.id] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(pos.id, file);
                  }}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onSkip}
        >
          <SkipForward className="w-4 h-4 mr-2" />
          Pular esta etapa
        </Button>
      </motion.div>
    </motion.div>
  );
}
