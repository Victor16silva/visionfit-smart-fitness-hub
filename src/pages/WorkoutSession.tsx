import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { X, Info, ArrowLeftRight, Plus, Check, ChevronLeft, Pause, Play, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

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
    muscle_groups: string[];
    equipment: string;
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
  const [isRestPaused, setIsRestPaused] = useState(false);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // Rest timer
  useEffect(() => {
    if (restTimer === null || isRestPaused) return;
    if (restTimer === 0) {
      setRestTimer(null);
      toast({ title: "Descanso terminado!", description: "Hora da próxima série!" });
      return;
    }
    const timer = setTimeout(() => setRestTimer(restTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [restTimer, isRestPaused]);

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
          exercise:exercises(id, name, image_url, muscle_groups, equipment)
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
        setIsRestPaused(false);
      }
      // Move to next set
      if (setIndex < newSetsData[exerciseId].length - 1) {
        setCurrentSetIndex(setIndex + 1);
      }
    }
  };

  const handleUpdateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    const newSetsData = { ...setsData };
    newSetsData[exerciseId][setIndex][field] = value;
    setSetsData(newSetsData);
  };

  const handleNextExercise = () => {
    const currentEx = exercises[currentExerciseIndex];
    if (currentEx) {
      // Check if all sets are completed
      const allSetsCompleted = setsData[currentEx.id]?.every(s => s.completed);
      if (allSetsCompleted) {
        setCompletedExercises(prev => new Set([...prev, currentEx.id]));
      }
    }

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      setRestTimer(null);
    } else {
      setShowReport(true);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setCurrentSetIndex(0);
    }
  };

  const handleSelectExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setCurrentSetIndex(0);
    setShowExerciseList(false);
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

      // Save exercise logs
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
        }
      });
    } catch (error) {
      console.error("Error finishing workout:", error);
      navigate("/dashboard");
    }
  };

  const calculateMuscleFatigue = () => {
    const fatigue: { [key: string]: number } = {};
    exercises.forEach(ex => {
      const isCompleted = completedExercises.has(ex.id);
      ex.exercise.muscle_groups?.forEach(muscle => {
        if (!fatigue[muscle]) fatigue[muscle] = 0;
        if (isCompleted) fatigue[muscle] += 30;
      });
    });
    return fatigue;
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
  const progress = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/20">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="bg-[#2a2a2a] text-white border-0 rounded-full px-4"
            onClick={() => setShowReport(true)}
          >
            Estatísticas
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-[#2a2a2a] text-white border-0 rounded-full px-4"
            onClick={() => setShowExerciseList(true)}
          >
            Lista de exercícios
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {currentExercise && (
          <div className="p-4">
            {/* Exercise Counter */}
            <p className="text-muted-foreground text-sm mb-3">
              Exercício {currentExerciseIndex + 1}/{exercises.length}
            </p>

            {/* Exercise Card */}
            <div className="flex gap-4 mb-4">
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-white flex-shrink-0">
                {currentExercise.exercise.image_url ? (
                  <img
                    src={currentExercise.exercise.image_url}
                    alt={currentExercise.exercise.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {currentExerciseIndex + 1}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">
                      {currentExercise.exercise.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {currentExercise.exercise.muscle_groups?.join(", ")}
                    </p>
                  </div>
                  <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="secondary"
                className="flex-1 bg-[#2a2a2a] text-white border-0 rounded-full"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Substituir
              </Button>
              <Button
                variant="secondary"
                className="flex-1 bg-[#2a2a2a] text-white border-0 rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nota
              </Button>
            </div>

            {/* Sets List */}
            <div className="space-y-3">
              {currentSets.map((set, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSetIndex(index);
                    if (!set.completed) {
                      handleSetComplete(currentExercise.id, index);
                    }
                  }}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                    index === currentSetIndex && !set.completed
                      ? "bg-[#2a2a2a] border-2 border-orange"
                      : set.completed
                      ? "bg-[#2a2a2a] border border-transparent"
                      : "bg-[#2a2a2a] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{set.reps}</span>
                      <span className="text-muted-foreground">reps</span>
                    </div>
                    <span className="text-muted-foreground">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{set.weight}</span>
                      <span className="text-muted-foreground">kg</span>
                    </div>
                  </div>
                  {set.completed && (
                    <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Notes */}
            {currentExercise.notes && (
              <div className="mt-4 p-4 bg-[#2a2a2a] rounded-xl">
                <p className="text-sm text-muted-foreground">
                  💡 {currentExercise.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#3d2a1a] to-[#2a1f15] p-4 pb-8">
        {restTimer !== null ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <button 
                className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center"
                onClick={() => setRestTimer(15)}
              >
                <Timer className="h-5 w-5" />
              </button>
              <div className="text-center">
                <p className="text-5xl font-bold">{restTimer}</p>
                <p className="text-muted-foreground">Prepare-se!</p>
              </div>
              <button 
                className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center"
                onClick={() => setIsRestPaused(!isRestPaused)}
              >
                {isRestPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold">Vamos lá!</p>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Timer className="h-4 w-4" />
              {formatTime(elapsedTime)}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {currentExerciseIndex > 0 && (
            <Button
              variant="outline"
              className="w-14 h-14 rounded-full border-orange text-orange p-0"
              onClick={handlePreviousExercise}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <Button
            className="flex-1 h-14 rounded-full bg-orange hover:bg-orange/90 text-white font-bold text-lg"
            onClick={handleNextExercise}
          >
            Próximo
          </Button>
        </div>
      </div>

      {/* Exercise List Sheet */}
      <Sheet open={showExerciseList} onOpenChange={setShowExerciseList}>
        <SheetContent side="bottom" className="h-[85vh] bg-[#1a1a1a] border-0 rounded-t-3xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-white">Lista de exercícios</SheetTitle>
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
                      : "bg-[#2a2a2a]"
                  }`}
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    {exercise.exercise.image_url ? (
                      <img
                        src={exercise.exercise.image_url}
                        alt={exercise.exercise.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-xl font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-white">{exercise.exercise.name}</h4>
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

      {/* Report/Stats Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="bg-[#1a1a1a] border-0 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Relatório</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Exercises */}
            <div>
              <h3 className="font-semibold mb-3">Exercícios executados</h3>
              <div className="bg-[#2a2a2a] rounded-xl p-3 space-y-3">
                {exercises.map((exercise, index) => {
                  const allSetsCompleted = setsData[exercise.id]?.every(s => s.completed);
                  return (
                    <div key={exercise.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                        {exercise.exercise.image_url ? (
                          <img
                            src={exercise.exercise.image_url}
                            alt={exercise.exercise.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="font-bold">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <span className="flex-1 text-sm">{exercise.exercise.name}</span>
                      <Checkbox 
                        checked={allSetsCompleted}
                        className="w-6 h-6 border-2 data-[state=checked]:bg-orange data-[state=checked]:border-orange"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle Fatigue */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Fadiga Muscular</h3>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {Object.entries(calculateMuscleFatigue()).map(([muscle, value]) => (
                  <div key={muscle}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{muscle}</span>
                      <span>{value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange to-yellow-500 rounded-full"
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-full bg-orange hover:bg-orange/90 text-white font-bold"
              onClick={handleFinishWorkout}
            >
              Finalizar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
