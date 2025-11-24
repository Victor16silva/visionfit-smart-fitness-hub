import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Flame, Heart, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkoutCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  workouts: {
    id: string;
    name: string;
    duration: string;
    calories: string;
    focus: string[];
  }[];
}

const categories: WorkoutCategory[] = [
  {
    id: "hipertrofia",
    title: "Hipertrofia",
    description: "Aumento de massa muscular",
    icon: Flame,
    color: "text-orange-500",
    workouts: [
      {
        id: "hipertrofia-membros-superiores",
        name: "Esforço Máximo Membros Superiores",
        duration: "30-40 min",
        calories: "224 kcal",
        focus: ["Peito", "Costas", "Bíceps", "Tríceps", "Ombros"],
      },
      {
        id: "hipertrofia-push",
        name: "Push - Empurrar",
        duration: "40-50 min",
        calories: "280 kcal",
        focus: ["Peito", "Ombros", "Tríceps"],
      },
    ],
  },
  {
    id: "treinos-femininos",
    title: "Treinos Femininos",
    description: "Programas específicos",
    icon: Heart,
    color: "text-pink-500",
    workouts: [
      {
        id: "feminino-inferior",
        name: "Foco na Região Inferior",
        duration: "35-45 min",
        calories: "200 kcal",
        focus: ["Glúteos", "Quadríceps", "Posteriores"],
      },
      {
        id: "feminino-pernas",
        name: "Pernas Esculpidas",
        duration: "40-50 min",
        calories: "220 kcal",
        focus: ["Pernas", "Glúteos"],
      },
    ],
  },
  {
    id: "perder-peso",
    title: "Perder Peso",
    description: "Queima de gordura",
    icon: TrendingUp,
    color: "text-green-500",
    workouts: [
      {
        id: "emagrecimento-saude",
        name: "Emagrecer com Saúde",
        duration: "30-40 min",
        calories: "300 kcal",
        focus: ["Cardio", "Funcional"],
      },
      {
        id: "intensidade-maxima",
        name: "Intensidade Máxima",
        duration: "25-35 min",
        calories: "350 kcal",
        focus: ["HIIT", "Full Body"],
      },
    ],
  },
  {
    id: "definicao",
    title: "Definição",
    description: "Definição muscular",
    icon: Sparkles,
    color: "text-blue-500",
    workouts: [
      {
        id: "definicao-muscular",
        name: "Definição Muscular",
        duration: "35-45 min",
        calories: "250 kcal",
        focus: ["Resistência", "Tonificação"],
      },
      {
        id: "intensidade-moderada",
        name: "Intensidade Moderada",
        duration: "30-40 min",
        calories: "230 kcal",
        focus: ["Definição", "Cardio"],
      },
    ],
  },
];

export default function PresetWorkouts() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleWorkoutSelect = (workoutId: string) => {
    // TODO: Implementar navegação para detalhes do treino pré-definido
    console.log("Selected workout:", workoutId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Encontre seu Treino</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gradient-primary">
            Escolha por Objetivo
          </h2>
          <p className="text-muted-foreground">
            Selecione a categoria que melhor se adapta ao seu objetivo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-smooth hover:shadow-lg ${
                  isSelected ? "border-primary shadow-primary/20" : ""
                }`}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className={`w-8 h-8 ${category.color}`} />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {selectedCategory && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {categories.find((c) => c.id === selectedCategory)?.title}
              <Badge variant="secondary">
                {categories.find((c) => c.id === selectedCategory)?.workouts.length} treinos
              </Badge>
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {categories
                .find((c) => c.id === selectedCategory)
                ?.workouts.map((workout) => (
                  <Card
                    key={workout.id}
                    className="cursor-pointer hover:border-primary transition-smooth shadow-card"
                    onClick={() => handleWorkoutSelect(workout.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-xl">{workout.name}</CardTitle>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>⏱️ {workout.duration}</span>
                        <span>🔥 {workout.calories}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Foco:</p>
                          <div className="flex flex-wrap gap-2">
                            {workout.focus.map((muscle, idx) => (
                              <Badge key={idx} variant="secondary">
                                {muscle}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button 
                          className="w-full gradient-primary text-primary-foreground font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWorkoutSelect(workout.id);
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {!selectedCategory && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Selecione uma categoria acima para ver os treinos disponíveis
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
