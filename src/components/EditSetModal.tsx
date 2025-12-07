import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface EditSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  reps: number;
  weight: number;
  onSave: (reps: number, weight: number) => void;
}

export default function EditSetModal({ isOpen, onClose, reps, weight, onSave }: EditSetModalProps) {
  const [editReps, setEditReps] = useState(reps);
  const [editWeight, setEditWeight] = useState(weight);

  const handleSave = () => {
    onSave(editReps, editWeight);
    onClose();
  };

  const adjustValue = (current: number, increment: number, min: number = 0) => {
    return Math.max(min, current + increment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Editar Série</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Reps */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground text-center block">
              Repetições
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setEditReps(adjustValue(editReps, -1, 1))}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                <Minus className="h-6 w-6" />
              </button>
              <div className="w-24 text-center">
                <span className="text-5xl font-black text-orange">{editReps}</span>
              </div>
              <button
                onClick={() => setEditReps(adjustValue(editReps, 1))}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground text-center block">
              Peso (kg)
            </label>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setEditWeight(adjustValue(editWeight, -2.5))}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                <Minus className="h-6 w-6" />
              </button>
              <div className="w-24 text-center">
                <span className="text-5xl font-black text-foreground">{editWeight}</span>
              </div>
              <button
                onClick={() => setEditWeight(adjustValue(editWeight, 2.5))}
                className="w-14 h-14 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleSave}
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
