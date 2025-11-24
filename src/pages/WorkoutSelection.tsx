import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkoutSelection() {
  const navigate = useNavigate();

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
            <h1 className="text-xl font-bold">Monte seu Treino</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2 text-gradient-primary">
            Como você quer começar?
          </h2>
          <p className="text-muted-foreground">
            Escolha a melhor opção para você
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Treino Personalizado */}
          <Card 
            className="cursor-pointer hover:border-primary transition-smooth shadow-card hover:shadow-primary/20 group"
            onClick={() => navigate("/create-workout")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto rounded-full gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Dumbbell className="w-10 h-10 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Treino Personalizado</CardTitle>
              <CardDescription className="text-base">
                Monte seu treino do zero
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>✓ Escolha seus próprios exercícios</li>
                <li>✓ Defina séries, repetições e descanso</li>
                <li>✓ Adicione observações personalizadas</li>
                <li>✓ Visualize imagens de cada exercício</li>
              </ul>
              <Button 
                className="w-full gradient-primary text-primary-foreground font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/create-workout");
                }}
              >
                Criar do Zero
              </Button>
            </CardContent>
          </Card>

          {/* Treinos Prontos Mensais */}
          <Card 
            className="cursor-pointer hover:border-accent transition-smooth shadow-card hover:shadow-accent/20 group"
            onClick={() => navigate("/preset-workouts")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto rounded-full gradient-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth">
                <Search className="w-10 h-10 text-accent-foreground" />
              </div>
              <CardTitle className="text-2xl">Treinos Prontos Mensais</CardTitle>
              <CardDescription className="text-base">
                Treinos já montados para você
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>✓ Treinos completos já montados</li>
                <li>✓ Diversos objetivos disponíveis</li>
                <li>✓ Apenas escolha e comece</li>
                <li>✓ Adicione aos seus treinos</li>
              </ul>
              <Button 
                className="w-full gradient-accent text-accent-foreground font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/preset-workouts");
                }}
              >
                Ver Treinos Prontos
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
