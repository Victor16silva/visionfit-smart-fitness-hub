import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipForward, X, Clock, Flame, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import RestTimer from "@/components/RestTimer";
import ExerciseItem from "@/components/ExerciseItem";

// Import images
import workoutDaily from "@/assets/workout-daily.jpg";
import muscleChest from "@/assets/muscle-chest.jpg";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  muscleGroup: string;
  imageUrl?: string;
  instructions?: string[];
}

interface WorkoutState {
  currentExerciseIndex: number;
  currentSet: number;
  completedExercises: string[];
  isResting: boolean;
  elapsedTime: number;
  isPlaying: boolean;
}

export default function WorkoutPlayer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [workout, setWorkout] = useState({
    id: "1",
    name: "Treino de Peito",
    duration: 45,
    calories: 380,
    imageUrl: workoutDaily,
  });

  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: "1",
      name: "Supino Reto com Barra",
      sets: 4,
      reps: "8-12",
      restSeconds: 90,
      muscleGroup: "Peito",
      imageUrl: muscleChest,
      instructions: [
        "Deite no banco com os pés firmes no chão",
        "Segure a barra com pegada média",
        "Desça a barra até tocar o peito",
        "Empurre a barra de volta até a extensão total"
      ]
    },
    {
      id: "2",
      name: "Supino Inclinado com Halteres",
      sets: 3,
      reps: "10-12",
      restSeconds: 60,
      muscleGroup: "Peito Superior",
      imageUrl: muscleChest,
    },
    {
      id: "3",
      name: "Crucifixo na Máquina",
      sets: 3,
      reps: "12-15",
      restSeconds: 60,
      muscleGroup: "Peito",
      imageUrl: muscleChest,
    },
    {
      id: "4",
      name: "Flexão de Braço",
      sets: 3,
      reps: "15-20",
      restSeconds: 45,
      muscleGroup: "Peito",
      imageUrl: muscleChest,
    },
  ]);

  const [state, setState] = useState<WorkoutState>({
    currentExerciseIndex: 0,
    currentSet: 1,
    completedExercises: [],
    isResting: false,
    elapsedTime: 0,
    isPlaying: false,
  });

  const [showExerciseList, setShowExerciseList] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Timer for elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state.isPlaying && !state.isResting) {
      interval = setInterval(() => {
        setState((prev) => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying, state.isResting]);

  const currentExercise = exercises[state.currentExerciseIndex];
  const progress = ((state.currentExerciseIndex + (state.currentSet - 1) / currentExercise.sets) / exercises.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const completeSet = () => {
    if (state.currentSet < currentExercise.sets) {
      // More sets remaining - start rest timer
      setState((prev) => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        isResting: true,
      }));
    } else {
      // Exercise complete
      const completedExercises = [...state.completedExercises, currentExercise.id];
      
      if (state.currentExerciseIndex < exercises.length - 1) {
        // Move to next exercise
        setState((prev) => ({
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1,
          currentSet: 1,
          completedExercises,
          isResting: true,
        }));
      } else {
        // Workout complete!
        navigate(`/workout/${id}/complete`, {
          state: {
            duration: state.elapsedTime,
            calories: workout.calories,
            exercises: exercises.length,
          }
        });
      }
    }
  };

  const skipRest = () => {
    setState((prev) => ({ ...prev, isResting: false }));
  };

  const togglePlay = () => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const exitWorkout = () => {
    if (confirm("Tem certeza que deseja sair do treino?")) {
      navigate(-1);
    }
  };

  if (state.isResting) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={exitWorkout}>
            <X className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {formatTime(state.elapsedTime)}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-xl font-bold text-foreground mb-2">Descanso</h2>
          <p className="text-muted-foreground mb-6">
            Próximo: {exercises[Math.min(state.currentExerciseIndex + 1, exercises.length - 1)]?.name || currentExercise.name}
          </p>
          
          <RestTimer
            initialSeconds={currentExercise.restSeconds}
            onComplete={skipRest}
            autoStart
          />
          
          <Button
            variant="outline"
            className="mt-6"
            onClick={skipRest}
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Pular Descanso
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${currentExercise.imageUrl || workout.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm" onClick={exitWorkout}>
            <X className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-full px-3 py-1">
            <Clock className="w-4 h-4 text-lime" />
            <span className="text-sm font-medium">{formatTime(state.elapsedTime)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="absolute bottom-0 left-0 right-0">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      </div>

      {/* Exercise Info */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-lime font-medium">
            Exercício {state.currentExerciseIndex + 1} de {exercises.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {currentExercise.muscleGroup}
          </span>
        </div>

        <h1 className="text-2xl font-black text-foreground mb-4">
          {currentExercise.name}
        </h1>

        {/* Sets and Reps */}
        <Card className="p-4 bg-card border-border mb-4">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-3xl font-black text-lime">{state.currentSet}</p>
              <p className="text-sm text-muted-foreground">de {currentExercise.sets} séries</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{currentExercise.reps}</p>
              <p className="text-sm text-muted-foreground">repetições</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-black text-foreground">{currentExercise.restSeconds}s</p>
              <p className="text-sm text-muted-foreground">descanso</p>
            </div>
          </div>
        </Card>

        {/* Instructions Toggle */}
        {currentExercise.instructions && (
          <Button
            variant="ghost"
            className="w-full justify-between mb-4"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>Ver instruções</span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}

        {showDetails && currentExercise.instructions && (
          <Card className="p-4 bg-card border-border mb-4">
            <ol className="space-y-2">
              {currentExercise.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime/20 text-lime text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{instruction}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Exercise List Toggle */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowExerciseList(true)}
        >
          <Dumbbell className="w-4 h-4 mr-2" />
          Ver todos os exercícios
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14"
            onClick={togglePlay}
          >
            {state.isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </Button>
          
          <Button
            className="flex-1 h-14 bg-lime text-black hover:bg-lime/90 font-bold text-lg"
            onClick={completeSet}
          >
            Completar Série
          </Button>
        </div>
      </div>

      {/* Exercise List Sheet */}
      <Sheet open={showExerciseList} onOpenChange={setShowExerciseList}>
        <SheetContent className="bg-background border-border">
          <SheetHeader>
            <SheetTitle>Exercícios do Treino</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseItem
                key={exercise.id}
                name={exercise.name}
                sets={exercise.sets}
                reps={exercise.reps}
                restSeconds={exercise.restSeconds}
                muscleGroup={exercise.muscleGroup}
                imageUrl={exercise.imageUrl}
                isActive={index === state.currentExerciseIndex}
                isCompleted={state.completedExercises.includes(exercise.id)}
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    currentExerciseIndex: index,
                    currentSet: 1,
                  }));
                  setShowExerciseList(false);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
