import { motion } from "framer-motion";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface GoalsPhotoStepProps {
  photos: {
    front: string;
    back: string;
    left: string;
    right: string;
  };
  onChange: (photos: { front: string; back: string; left: string; right: string }) => void;
}

export function GoalsPhotoStep({ photos, onChange }: GoalsPhotoStepProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);

  const uploadPhoto = async (file: File, position: string) => {
    if (!user) return;

    setUploading(position);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/goals_${position}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(fileName);

      onChange({ ...photos, [position]: publicUrl });
      toast({ title: "Foto enviada com sucesso!" });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({ title: "Erro ao enviar foto", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, position: string) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file, position);
    }
  };

  const photoPositions = [
    { id: "front", label: "Frente", emoji: "👤" },
    { id: "back", label: "Costas", emoji: "🔙" },
    { id: "left", label: "Lado Esquerdo", emoji: "👈" },
    { id: "right", label: "Lado Direito", emoji: "👉" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          📸 Fotos de Evolução
        </h1>
        <p className="text-muted-foreground text-sm">
          Tire 4 fotos para o personal analisar seu progresso
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {photoPositions.map((position, index) => {
          const photoUrl = photos[position.id as keyof typeof photos];
          const isUploading = uploading === position.id;

          return (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, position.id)}
                  disabled={isUploading}
                />
                <div
                  className={`aspect-[3/4] rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-primary ${
                    photoUrl ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                  }`}
                >
                  {photoUrl ? (
                    <div className="relative h-full">
                      <img
                        src={photoUrl}
                        alt={position.label}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded-lg px-2 py-1">
                        <p className="text-xs text-center text-white font-medium">
                          {position.label}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-2 p-4">
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <div className="text-4xl">{position.emoji}</div>
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xs text-center text-muted-foreground font-medium">
                            {position.label}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Opcional: Você pode pular e adicionar fotos depois
      </p>
    </motion.div>
  );
}
