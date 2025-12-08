import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Info, ArrowLeftRight, Plus, Check, ChevronRight, Play, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import RestModal from "@/components/RestModal";
import ExerciseDetailModal from "@/components/ExerciseDetailModal";
import SubstituteExerciseModal from "@/components/SubstituteExerciseModal";
import EditSetModal from "@/components/EditSetModal";

interface Exercise {
  id: string;
  exercise_id: string;
  order_index: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string;
  exercise: {
    id: string;
    name: string;
    image_url: string;
    video_url?: string;
    muscle_groups: string[];
    equipment: string;
    description?: string;
  };
}

interface WorkoutPlan {
  id: string;
  name: string;
  division_letter: string;
  muscle_groups: string[];
}

interface SetData {
  reps: number;
  weight: number;
  completed: boolean;
}

export default function WorkoutSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [setsData, setSetsData] = useState<{ [key: string]: SetData[] }>({});
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showRestModal, setShowRestModal] = useState(false);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // New modals
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [showSubstitute, setShowSubstitute] = useState(false);
  const [showEditSet, setShowEditSet] = useState(false);
  const [editingSetIndex, setEditingSetIndex] = useState<number>(0);

  // Elapsed time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWorkout();
  }, [id, user]);

  // Rest timer with modal
  useEffect(() => {
    if (restTimer === null) return;
    if (restTimer === 0) {
      setShowRestModal(false);
      setRestTimer(null);
      toast({ title: "Descanso terminado!", description: "Hora da próxima série!" });
      return;
    }
    const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [restTimer]);

  const loadWorkout = async () => {
    try {
      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_plans")
        .select("id, name, division_letter, muscle_groups")
        .eq("id", id)
        .single();

      if (workoutError) throw workoutError;
      setWorkout(workoutData);

      const { data: exercisesData, error: exercisesError } = await supabase
        .from("workout_exercises")
        .select(`
          *,
          exercise:exercises(id, name, image_url, video_url, muscle_groups, equipment, description)
        `)
        .eq("workout_plan_id", id)
        .order("order_index");

      if (exercisesError) throw exercisesError;
      setExercises(exercisesData || []);

      // Initialize sets data
      const initialSetsData: { [key: string]: SetData[] } = {};
      exercisesData?.forEach((ex) => {
        initialSetsData[ex.id] = Array.from({ length: ex.sets }, () => ({
          reps: ex.reps_min,
          weight: 0,
          completed: false,
        }));
      });
      setSetsData(initialSetsData);

      // Create workout log
      const { data: logData, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user?.id,
          workout_plan_id: id,
        })
        .select()
        .single();

      if (logError) throw logError;
      setWorkoutLogId(logData.id);
    } catch (error) {
      console.error("Error loading workout:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o treino",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSetComplete = (exerciseId: string, setIndex: number) => {
    const newSetsData = { ...setsData };
    newSetsData[exerciseId][setIndex].completed = !newSetsData[exerciseId][setIndex].completed;
    setSetsData(newSetsData);

    if (newSetsData[exerciseId][setIndex].completed) {
      const exercise = exercises.find((ex) => ex.id === exerciseId);
      if (exercise) {
        setRestTimer(exercise.rest_seconds);
        setShowRestModal(true);
      }
      if (setIndex < newSetsData[exerciseId].length - 1) {
        setCurrentSetIndex(setIndex + 1);
      }
    }
  };

  const handleSkipRest = () => {
    setShowRestModal(false);
    setRestTimer(null);
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setCurrentSetIndex(0);
    setShowExerciseList(false);
  };

  const handleOpenEditSet = (setIndex: number) => {
    setEditingSetIndex(setIndex);
    setShowEditSet(true);
  };

  const handleSaveSet = (reps: number, weight: number) => {
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx) return;
    
    const newSetsData = { ...setsData };
    newSetsData[currentEx.id][editingSetIndex].reps = reps;
    newSetsData[currentEx.id][editingSetIndex].weight = weight;
    setSetsData(newSetsData);
  };

  const handleSubstituteExercise = (newExercise: { id: string; name: string; image_url?: string; muscle_groups: string[]; equipment?: string }) => {
    const currentEx = exercises[currentExerciseIndex];
    if (!currentEx) return;

    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex] = {
      ...currentEx,
      exercise_id: newExercise.id,
      exercise: {
        id: newExercise.id,
        name: newExercise.name,
        image_url: newExercise.image_url || "",
        muscle_groups: newExercise.muscle_groups,
        equipment: newExercise.equipment || "",
      },
    };
    setExercises(updatedExercises);
    toast({ title: "Exercício substituído!" });
  };

  const handleFinishWorkout = async () => {
    try {
      const durationMinutes = Math.floor(elapsedTime / 60);
      
      await supabase
        .from("workout_logs")
        .update({ 
          completed_at: new Date().toISOString(),
          duration_minutes: durationMinutes
        })
        .eq("id", workoutLogId);

      for (const exercise of exercises) {
        const sets = setsData[exercise.id] || [];
        for (let i = 0; i < sets.length; i++) {
          if (sets[i].completed) {
            await supabase.from("exercise_logs").insert({
              workout_log_id: workoutLogId,
              exercise_id: exercise.exercise_id,
              set_number: i + 1,
              reps: sets[i].reps,
              weight_kg: sets[i].weight,
              completed: true,
            });
          }
        }
      }

      toast({
        title: "Treino concluído!",
        description: `Parabéns! Duração: ${durationMinutes} minutos`,
      });
      navigate("/workout-complete", {
        state: {
          duration: elapsedTime,
          calories: Math.floor(elapsedTime / 60) * 8,
          exercises: exercises.length,
          workoutName: workout?.name || "Treino",
          muscleGroups: workout?.muscle_groups || [],
        }
      });
    } catch (error) {
      console.error("Error finishing workout:", error);
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando treino...</p>
      </div>
    );
  }

  const currentExercise = exercises[currentExerciseIndex];
  const currentSets = currentExercise ? setsData[currentExercise.id] || [] : [];
  const completedSetsCount = exercises.reduce((acc, ex) => {
    return acc + (setsData[ex.id]?.filter(s => s.completed).length || 0);
  }, 0);
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/10 sticky top-0 bg-background z-20">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h1 className="text-lg font-bold uppercase tracking-wide">
          Treino {workout?.division_letter?.toUpperCase() || ""}
        </h1>

        <button 
          onClick={() => setShowExerciseList(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <Info className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {exercises.map((exercise, index) => {
          const isCurrentExercise = index === currentExerciseIndex;
          const exerciseSets = setsData[exercise.id] || [];
          const allSetsCompleted = exerciseSets.every(s => s.completed);
          const isCompleted = completedExercises.has(exercise.id) || allSetsCompleted;
          
          return (
            <div key={exercise.id} className="border-b border-border/10">
              {/* Exercise Row */}
              <button
                onClick={() => handleSelectExercise(index)}
                className={`w-full p-4 flex items-center gap-4 transition-all ${
                  isCurrentExercise ? "bg-muted/30" : ""
                }`}
              >
                {/* Checkbox */}
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? "bg-primary border-primary" : "border-border/30"
                }`}>
                  {isCompleted && <Check className="h-5 w-5 text-primary-foreground" />}
                </div>

                {/* Exercise Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {exercise.exercise.image_url ? (
                    <img
                      src={exercise.exercise.image_url}
                      alt={exercise.exercise.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card">
                      <span className="text-2xl font-bold text-primary">{index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Exercise Info */}
                <div className="flex-1 text-left min-w-0">
                  <h3 className={`font-semibold truncate ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {exercise.exercise.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {exercise.sets}× {exercise.reps_min} a {exercise.reps_max}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </button>

              {/* Expanded Exercise Detail (if current) */}
              {isCurrentExercise && (
                <div className="bg-muted/20">
                  {/* Rest Timer Row */}
                  <div className="px-4 py-3 flex items-center justify-between border-t border-border/5">
                    <span className="text-sm font-medium">{formatTime(exercise.rest_seconds)}</span>
                    <span className="text-sm text-muted-foreground">(Descanso entre séries)</span>
                    <button 
                      onClick={() => {
                        setRestTimer(exercise.rest_seconds);
                        setShowRestModal(true);
                      }}
                      className="text-blue-400"
                    >
                      <Play className="h-6 w-6 fill-current" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 bg-card text-foreground border-0 rounded-full"
                        onClick={() => setShowSubstitute(true)}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Substituir
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex-1 bg-card text-foreground border-0 rounded-full"
                        onClick={() => setShowExerciseDetail(true)}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>

                    {/* Sets Grid */}
                    <div className="space-y-3">
                      {currentSets.map((set, setIdx) => (
                        <div
                          key={setIdx}
                          className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                            setIdx === currentSetIndex && !set.completed
                              ? "bg-card ring-2 ring-orange"
                              : "bg-card"
                          }`}
                        >
                          <button
                            onClick={() => handleOpenEditSet(setIdx)}
                            className="flex items-center gap-6 flex-1"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-orange">{set.reps}</span>
                              <span className="text-muted-foreground">reps</span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-foreground">{set.weight}</span>
                              <span className="text-muted-foreground">kg</span>
                            </div>
                            <Edit2 className="h-4 w-4 text-muted-foreground ml-2" />
                          </button>
                          
                          <button
                            onClick={() => handleSetComplete(currentExercise.id, setIdx)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                              set.completed 
                                ? "bg-orange" 
                                : "bg-muted hover:bg-muted/70"
                            }`}
                          >
                            <Check className={`h-6 w-6 ${set.completed ? "text-primary-foreground" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background border-t border-border/10">
        <Button
          className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg"
          onClick={handleFinishWorkout}
        >
          Finalizar treino
        </Button>
      </div>

      {/* Rest Modal */}
      <RestModal 
        isOpen={showRestModal}
        restTime={restTimer || 0}
        onClose={() => setShowRestModal(false)}
        onSkip={handleSkipRest}
      />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        isOpen={showExerciseDetail}
        onClose={() => setShowExerciseDetail(false)}
        exercise={currentExercise?.exercise || null}
      />

      {/* Substitute Exercise Modal */}
      <SubstituteExerciseModal
        isOpen={showSubstitute}
        onClose={() => setShowSubstitute(false)}
        currentExercise={currentExercise ? {
          id: currentExercise.exercise_id,
          name: currentExercise.exercise.name,
          muscle_groups: currentExercise.exercise.muscle_groups,
        } : null}
        onSubstitute={handleSubstituteExercise}
      />

      {/* Edit Set Modal */}
      <EditSetModal
        isOpen={showEditSet}
        onClose={() => setShowEditSet(false)}
        reps={currentSets[editingSetIndex]?.reps || 8}
        weight={currentSets[editingSetIndex]?.weight || 0}
        onSave={handleSaveSet}
      />

      {/* Exercise List Sheet */}
      <Sheet open={showExerciseList} onOpenChange={setShowExerciseList}>
        <SheetContent side="bottom" className="h-[85vh] bg-card border-0 rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-foreground">Lista de exercícios</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 overflow-y-auto max-h-[calc(85vh-120px)] pb-8">
            {exercises.map((exercise, index) => {
              const isCompleted = completedExercises.has(exercise.id);
              const allSetsCompleted = setsData[exercise.id]?.every(s => s.completed);
              
              return (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(index)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    index === currentExerciseIndex 
                      ? "bg-orange/20 border border-orange" 
                      : "bg-muted"
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
                    {exercise.exercise.image_url ? (
                      <img
                        src={exercise.exercise.image_url}
                        alt={exercise.exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-card flex items-center justify-center">
                        <span className="text-xl font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-foreground">{exercise.exercise.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exercise.sets}x {exercise.reps_min}-{exercise.reps_max}
                    </p>
                  </div>
                  <Checkbox 
                    checked={allSetsCompleted || isCompleted}
                    className="w-6 h-6 border-2 data-[state=checked]:bg-orange data-[state=checked]:border-orange"
                  />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
