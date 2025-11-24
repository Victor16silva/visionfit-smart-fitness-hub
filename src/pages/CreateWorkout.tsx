import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Exercise {
  id: string;
  name: string;
  equipment: string;
  muscle_groups: string[];
}

interface SelectedExercise {
  exercise_id: string;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string;
}

export default function CreateWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [divisionLetter, setDivisionLetter] = useState("");
  const [description, setDescription] = useState("");
  const [muscleGroups, setMuscleGroups] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadExercises();
  }, [user]);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const addExercise = () => {
    setSelectedExercises([
      ...selectedExercises,
      {
        exercise_id: "",
        sets: 3,
        reps_min: 8,
        reps_max: 12,
        rest_seconds: 60,
        notes: "",
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof SelectedExercise, value: any) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!name || !divisionLetter || selectedExercises.length === 0) {
        throw new Error("Preencha todos os campos obrigatórios");
      }

      const muscleGroupsArray = muscleGroups.split(",").map((g) => g.trim());

      const { data: workoutData, error: workoutError } = await supabase
        .from("workout_plans")
        .insert({
          user_id: user?.id,
          name,
          division_letter: divisionLetter,
          muscle_groups: muscleGroupsArray,
          description,
          created_by: user?.id,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const exercisesToInsert = selectedExercises.map((ex, index) => ({
        workout_plan_id: workoutData.id,
        exercise_id: ex.exercise_id,
        order_index: index,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
      }));

      const { error: exercisesError } = await supabase
        .from("workout_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) throw exercisesError;

      toast({
        title: "Treino criado!",
        description: "Seu novo treino foi salvo com sucesso.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Criar Novo Treino</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Treino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="divisionLetter">Divisão *</Label>
                  <Input
                    id="divisionLetter"
                    placeholder="A"
                    value={divisionLetter}
                    onChange={(e) => setDivisionLetter(e.target.value.toUpperCase())}
                    maxLength={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Treino *</Label>
                  <Input
                    id="name"
                    placeholder="Treino A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="muscleGroups">Grupos Musculares *</Label>
                <Input
                  id="muscleGroups"
                  placeholder="Peito, Tríceps, Ombros"
                  value={muscleGroups}
                  onChange={(e) => setMuscleGroups(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Separe por vírgula
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do treino..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Exercícios</h3>
              <Button type="button" onClick={addExercise} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {selectedExercises.map((selectedEx, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <Label>Exercício {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <Select
                    value={selectedEx.exercise_id}
                    onValueChange={(value) =>
                      updateExercise(index, "exercise_id", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((ex) => (
                        <SelectItem key={ex.id} value={ex.id}>
                          {ex.name} - {ex.equipment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Séries</Label>
                      <Input
                        type="number"
                        min="1"
                        value={selectedEx.sets}
                        onChange={(e) =>
                          updateExercise(index, "sets", parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descanso (s)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={selectedEx.rest_seconds}
                        onChange={(e) =>
                          updateExercise(
                            index,
                            "rest_seconds",
                            parseInt(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reps Mín</Label>
                      <Input
                        type="number"
                        min="1"
                        value={selectedEx.reps_min}
                        onChange={(e) =>
                          updateExercise(index, "reps_min", parseInt(e.target.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reps Máx</Label>
                      <Input
                        type="number"
                        min="1"
                        value={selectedEx.reps_max}
                        onChange={(e) =>
                          updateExercise(index, "reps_max", parseInt(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Dicas de execução..."
                      value={selectedEx.notes}
                      onChange={(e) => updateExercise(index, "notes", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Treino"}
          </Button>
        </form>
      </main>
    </div>
  );
}
