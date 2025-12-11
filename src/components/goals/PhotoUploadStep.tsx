import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const photoTypes = [
  { id: "front", label: "Frente" },
  { id: "back", label: "Costas" },
  { id: "left", label: "Lateral Esq." },
  { id: "right", label: "Lateral Dir." },
];

export function PhotoUploadStep({ userId, photos, onChange, onSkip }: PhotoUploadStepProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (type: string, file: File) => {
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-photos')
        .getPublicUrl(filePath);

      onChange({
        ...photos,
        [type]: publicUrl,
      });

      toast.success("Foto enviada!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = (type: string) => {
    onChange({
      ...photos,
      [type]: "",
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
          Opcional: envie fotos para acompanhar sua evolução
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photoTypes.map((type) => {
          const photoUrl = photos[type.id as keyof typeof photos];
          const isUploading = uploading === type.id;

          return (
            <div
              key={type.id}
              className="relative aspect-[3/4] rounded-xl overflow-hidden bg-muted border border-border"
            >
              {photoUrl ? (
                <>
                  <img
                    src={photoUrl}
                    alt={type.label}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemove(type.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : (
                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-lime animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">{type.label}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(type.id, file);
                    }}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={onSkip}
      >
        Pular esta etapa
      </Button>
    </motion.div>
  );
}
