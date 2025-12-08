import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Image, X } from "lucide-react";

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    name: string;
    image_url?: string;
    video_url?: string;
    muscle_groups?: string[];
    equipment?: string;
    description?: string;
  } | null;
}

export default function ExerciseDetailModal({ isOpen, onClose, exercise }: ExerciseDetailModalProps) {
  const [viewMode, setViewMode] = useState<"image" | "video">("image");
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!exercise) return null;

  const hasVideo = !!exercise.video_url;
  const hasImage = !!exercise.image_url;

  // Check if the image is a GIF
  const isGif = exercise.image_url?.toLowerCase().includes('.gif');

  return (
    <>
      {/* Fullscreen Image/Video Viewer */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button 
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          {viewMode === "video" && hasVideo ? (
            <video 
              src={exercise.video_url}
              autoPlay
              loop
              controls
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
      )}

      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] bg-card border-0 rounded-t-3xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-xl font-bold text-foreground">{exercise.name}</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-5">
            {/* Media Toggle Buttons */}
            {(hasVideo || isGif) && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "image" ? "default" : "secondary"}
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={() => setViewMode("image")}
                >
                  <Image className="h-4 w-4 mr-2" />
                  {isGif ? "Animado" : "Imagem"}
                </Button>
                {hasVideo && (
                  <Button
                    variant={viewMode === "video" ? "default" : "secondary"}
                    size="sm"
                    className="flex-1 rounded-full"
                    onClick={() => setViewMode("video")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Vídeo Real
                  </Button>
                )}
              </div>
            )}

            {/* Exercise Media */}
            <div 
              className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer relative group"
              onClick={() => setIsFullscreen(true)}
            >
              {viewMode === "video" && hasVideo ? (
                <video 
                  src={exercise.video_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain bg-background"
                />
              ) : exercise.image_url ? (
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="w-full h-full object-contain bg-background"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">💪</span>
                </div>
              )}
              
              {/* Overlay hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded-full">
                  Toque para ampliar
                </span>
              </div>
            </div>

            {/* Muscle Groups */}
            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Grupos Musculares</h4>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscle_groups.map((muscle, idx) => (
                    <Badge key={idx} className="bg-primary/20 text-primary border-0">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {exercise.equipment && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Equipamento</h4>
                <Badge variant="outline" className="border-border">
                  {exercise.equipment}
                </Badge>
              </div>
            )}

            {/* Description */}
            {exercise.description && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Descrição</h4>
                <p className="text-sm text-foreground bg-muted/50 rounded-xl p-4">
                  {exercise.description}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Como Executar</h4>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3 text-sm text-foreground">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <p>Posicione-se corretamente no equipamento</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <p>Mantenha a postura alinhada durante todo o movimento</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <p>Execute o movimento de forma controlada</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <p>Respire corretamente: expire na fase de esforço</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
                  <p>Complete todas as repetições com amplitude total</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}