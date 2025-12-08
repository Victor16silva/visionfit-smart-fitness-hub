import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Exercise {
  id: string;
  name: string;
  image_url?: string;
  muscle_groups: string[];
  equipment?: string;
}

interface SubstituteExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: {
    id: string;
    name: string;
    muscle_groups: string[];
  } | null;
  onSubstitute: (newExercise: Exercise) => void;
}

export default function SubstituteExerciseModal({ 
  isOpen, 
  onClose, 
  currentExercise,
  onSubstitute 
}: SubstituteExerciseModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadSimilarExercises = useCallback(async () => {
    if (!currentExercise || hasLoaded) return;
    
    setLoading(true);
    try {
      // Get exercises from the same muscle group
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .neq("id", currentExercise.id)
        .overlaps("muscle_groups", currentExercise.muscle_groups);

      if (error) throw error;
      setExercises(data || []);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error loading exercises:", error);
    } finally {
      setLoading(false);
    }
  }, [currentExercise, hasLoaded]);

  useEffect(() => {
    if (isOpen && currentExercise && !hasLoaded) {
      loadSimilarExercises();
    }
  }, [isOpen, currentExercise, hasLoaded, loadSimilarExercises]);

  // Reset when exercise changes
  useEffect(() => {
    if (!isOpen) {
      setHasLoaded(false);
      setSearchQuery("");
    }
  }, [isOpen]);

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (exercise: Exercise) => {
    onSubstitute(exercise);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] bg-card border-0 rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-foreground">
            Substituir: {currentExercise?.name}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Exercícios para: {currentExercise?.muscle_groups?.join(", ")}
          </p>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-0"
          />
        </div>

        {/* Exercise List */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(85vh-180px)] pb-8">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando exercícios...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum exercício encontrado</p>
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                className="w-full flex items-center gap-4 p-3 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
              >
                {/* Exercise Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
                  {exercise.image_url ? (
                    <img
                      src={exercise.image_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl">💪</span>
                    </div>
                  )}
                </div>
                
                {/* Exercise Info */}
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-foreground">{exercise.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exercise.muscle_groups?.join(", ")}
                  </p>
                  {exercise.equipment && (
                    <p className="text-xs text-primary">{exercise.equipment}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
