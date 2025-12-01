import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExerciseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: {
    id: string;
    name: string;
    muscle_groups: string[];
    image_url?: string;
  } | null;
  onConfirm: (config: ExerciseConfig) => void;
}

interface ExerciseConfig {
  exerciseId: string;
  sets: number;
  reps: number;
  restSeconds: number;
  setsDetail: { reps: number }[];
}

export default function ExerciseConfigModal({ 
  isOpen, 
  onClose, 
  exercise,
  onConfirm 
}: ExerciseConfigModalProps) {
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [restSeconds, setRestSeconds] = useState(60);
  const [setsDetail, setSetsDetail] = useState<{ reps: number }[]>([
    { reps: 10 },
    { reps: 10 },
    { reps: 10 }
  ]);

  const handleSetsChange = (newSets: number) => {
    setSets(newSets);
    // Update sets detail array
    if (newSets > setsDetail.length) {
      const newDetails = [...setsDetail];
      for (let i = setsDetail.length; i < newSets; i++) {
        newDetails.push({ reps: reps });
      }
      setSetsDetail(newDetails);
    } else {
      setSetsDetail(setsDetail.slice(0, newSets));
    }
  };

  const handleRepsChange = (newReps: number) => {
    setReps(newReps);
    // Update all sets with new reps value
    setSetsDetail(setsDetail.map(() => ({ reps: newReps })));
  };

  const handleSetDetailChange = (index: number, newReps: number) => {
    const newDetails = [...setsDetail];
    newDetails[index] = { reps: newReps };
    setSetsDetail(newDetails);
  };

  const addSet = () => {
    handleSetsChange(sets + 1);
  };

  const removeSet = (index: number) => {
    if (sets > 1) {
      const newDetails = setsDetail.filter((_, i) => i !== index);
      setSetsDetail(newDetails);
      setSets(sets - 1);
    }
  };

  const handleConfirm = () => {
    if (!exercise) return;
    
    onConfirm({
      exerciseId: exercise.id,
      sets,
      reps,
      restSeconds,
      setsDetail
    });
    onClose();
  };

  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-foreground">Configurar exercício</h2>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Exercise info */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-muted/50 rounded-xl">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {exercise.image_url ? (
                <img 
                  src={exercise.image_url} 
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-lime/20 to-purple/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-muted-foreground/50">
                    {exercise.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-foreground">{exercise.name}</h3>
              <p className="text-sm text-muted-foreground">
                {exercise.muscle_groups?.[0] || "Geral"}
              </p>
            </div>
          </div>

          {/* Config inputs */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Séries</label>
              <Input
                type="number"
                value={sets}
                onChange={(e) => handleSetsChange(parseInt(e.target.value) || 1)}
                min={1}
                max={10}
                className="bg-muted border-border h-11 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Reps</label>
              <Input
                type="number"
                value={reps}
                onChange={(e) => handleRepsChange(parseInt(e.target.value) || 1)}
                min={1}
                max={100}
                className="bg-muted border-border h-11 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Descanso (s)</label>
              <Input
                type="number"
                value={restSeconds}
                onChange={(e) => setRestSeconds(parseInt(e.target.value) || 30)}
                min={0}
                max={300}
                className="bg-muted border-border h-11 text-center font-bold"
              />
            </div>
          </div>

          {/* Sets detail */}
          <div className="space-y-2 mb-4">
            {setsDetail.map((detail, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
              >
                <span className="text-sm text-muted-foreground">{index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">{detail.reps}</span>
                  <span className="text-sm text-muted-foreground">reps</span>
                </div>
                <button 
                  onClick={() => removeSet(index)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-50 hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add set button */}
          <button
            onClick={addSet}
            className="flex items-center gap-2 text-lime text-sm font-medium hover:text-lime/80 transition-colors mb-6"
          >
            <Plus className="h-4 w-4" />
            Adicionar série
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={handleConfirm}
          >
            Adicionar ao Treino
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-border"
            onClick={onClose}
          >
            Voltar ao Treino
          </Button>
        </div>
      </div>
    </div>
  );
}
