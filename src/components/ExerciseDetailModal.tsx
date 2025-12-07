import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ExerciseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    name: string;
    image_url?: string;
    muscle_groups?: string[];
    equipment?: string;
    description?: string;
  } | null;
}

export default function ExerciseDetailModal({ isOpen, onClose, exercise }: ExerciseDetailModalProps) {
  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{exercise.name}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Exercise Image */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            {exercise.image_url ? (
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

          {/* Instructions */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Como Executar</h4>
            <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm text-foreground">
              <p>1. Posicione-se corretamente no equipamento</p>
              <p>2. Mantenha a postura alinhada durante todo o movimento</p>
              <p>3. Execute o movimento de forma controlada</p>
              <p>4. Respire corretamente: expire na fase de esforço</p>
              <p>5. Complete todas as repetições com amplitude total</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
