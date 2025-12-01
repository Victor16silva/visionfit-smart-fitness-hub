import { useState, useEffect } from "react";
import { X, Search, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  image_url?: string;
}

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercises: (exercises: Exercise[]) => void;
  selectedCount: number;
}

const muscleGroups = [
  "Ombros",
  "Peitoral", 
  "Bíceps",
  "Abdômen",
  "Antebraços",
  "Quadríceps",
  "Tríceps",
  "Costas",
  "Glúteos",
  "Panturrilha"
];

export default function ExercisePickerModal({ 
  isOpen, 
  onClose, 
  onSelectExercises,
  selectedCount 
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [viewingMuscle, setViewingMuscle] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedMuscles, exercises, viewingMuscle]);

  const loadExercises = async () => {
    const { data } = await supabase
      .from("exercises")
      .select("id, name, muscle_groups, image_url")
      .order("name");
    
    setExercises(data || []);
  };

  const filterExercises = () => {
    let filtered = exercises;

    if (searchQuery) {
      filtered = filtered.filter(ex => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (viewingMuscle) {
      filtered = filtered.filter(ex =>
        ex.muscle_groups.some(mg => 
          mg.toLowerCase().includes(viewingMuscle.toLowerCase())
        )
      );
    } else if (selectedMuscles.length > 0) {
      filtered = filtered.filter(ex =>
        ex.muscle_groups.some(mg => 
          selectedMuscles.some(sm => mg.toLowerCase().includes(sm.toLowerCase()))
        )
      );
    }

    setFilteredExercises(filtered);
  };

  const toggleMuscle = (muscle: string) => {
    setSelectedMuscles(prev => 
      prev.includes(muscle) 
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  const toggleExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => 
      prev.some(e => e.id === exercise.id)
        ? prev.filter(e => e.id !== exercise.id)
        : [...prev, exercise]
    );
  };

  const handleConfirm = () => {
    onSelectExercises(selectedExercises);
    setSelectedExercises([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          {viewingMuscle ? (
            <button 
              onClick={() => setViewingMuscle(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <h2 className="text-lg font-bold text-foreground">
            {viewingMuscle || "Escolha um exercício"}
          </h2>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-muted border-border rounded-xl"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {!viewingMuscle ? (
            <>
              {/* Muscle group filters */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                {muscleGroups.map((muscle) => (
                  <label
                    key={muscle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedMuscles.includes(muscle)
                        ? 'bg-lime/20 border border-lime'
                        : 'bg-muted border border-transparent'
                    }`}
                    onClick={() => setViewingMuscle(muscle)}
                  >
                    <Checkbox 
                      checked={selectedMuscles.includes(muscle)}
                      onCheckedChange={() => toggleMuscle(muscle)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-sm text-foreground">{muscle}</span>
                  </label>
                ))}
              </div>

              {/* Exercise grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredExercises.slice(0, 6).map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => toggleExercise(exercise)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer group ${
                      selectedExercises.some(e => e.id === exercise.id)
                        ? 'ring-2 ring-lime'
                        : ''
                    }`}
                  >
                    <div className="aspect-video bg-muted">
                      {exercise.image_url && (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 flex items-end">
                      <p className="p-2 text-sm font-medium text-white">{exercise.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Exercises for specific muscle */
            <div className="grid grid-cols-2 gap-3">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => toggleExercise(exercise)}
                  className={`relative rounded-xl overflow-hidden cursor-pointer ${
                    selectedExercises.some(e => e.id === exercise.id)
                      ? 'ring-2 ring-lime'
                      : ''
                  }`}
                >
                  <div className="aspect-video bg-muted">
                    {exercise.image_url && (
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 flex items-end">
                    <p className="p-2 text-sm font-medium text-white">{exercise.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedCount + selectedExercises.length} exercício(s) no treino
          </span>
          <Button
            className="bg-lime text-black font-bold hover:bg-lime/90"
            onClick={handleConfirm}
            disabled={selectedExercises.length === 0}
          >
            Voltar ao Treino
          </Button>
        </div>
      </div>
    </div>
  );
}
