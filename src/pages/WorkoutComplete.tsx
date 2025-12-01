import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Clock, Flame, Dumbbell, Share2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export default function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const stats = location.state || {
    duration: 2700, // 45 minutes in seconds
    calories: 380,
    exercises: 8,
  };

  const pointsEarned = Math.floor(stats.duration / 60) * 2 + stats.exercises * 10;

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#c8ff00', '#8b5cf6', '#f97316'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#c8ff00', '#8b5cf6', '#f97316'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Trophy Icon */}
      <div className="w-24 h-24 rounded-full bg-lime/20 flex items-center justify-center mb-6 glow-lime">
        <Trophy className="w-12 h-12 text-lime" />
      </div>

      {/* Congrats Text */}
      <h1 className="text-3xl font-black text-foreground text-center mb-2">
        Parabéns! 🎉
      </h1>
      <p className="text-muted-foreground text-center mb-8">
        Você completou o treino com sucesso!
      </p>

      {/* Points Earned */}
      <Card className="w-full max-w-sm p-6 bg-gradient-to-br from-lime/20 to-lime/5 border-lime/30 mb-6 text-center">
        <p className="text-sm text-muted-foreground mb-1">Pontos Ganhos</p>
        <p className="text-5xl font-black text-lime">+{pointsEarned}</p>
      </Card>

      {/* Stats */}
      <Card className="w-full max-w-sm p-4 bg-card border-border mb-8">
        <h3 className="font-bold text-foreground text-center mb-4">Resumo do Treino</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-purple" />
            </div>
            <p className="text-lg font-bold text-foreground">{formatTime(stats.duration)}</p>
            <p className="text-xs text-muted-foreground">Duração</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-orange/20 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-orange" />
            </div>
            <p className="text-lg font-bold text-foreground">{stats.calories}</p>
            <p className="text-xs text-muted-foreground">Calorias</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center mx-auto mb-2">
              <Dumbbell className="w-5 h-5 text-lime" />
            </div>
            <p className="text-lg font-bold text-foreground">{stats.exercises}</p>
            <p className="text-xs text-muted-foreground">Exercícios</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          className="w-full h-14 bg-lime text-black hover:bg-lime/90 font-bold"
          onClick={() => navigate("/dashboard")}
        >
          <Home className="w-5 h-5 mr-2" />
          Voltar ao Início
        </Button>
        
        <Button
          variant="outline"
          className="w-full h-14"
          onClick={() => {
            // Share functionality
            if (navigator.share) {
              navigator.share({
                title: "VisionFit - Treino Completo!",
                text: `Acabei de completar um treino de ${formatTime(stats.duration)} e queimei ${stats.calories} calorias! 💪`,
              });
            }
          }}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Compartilhar
        </Button>
      </div>
    </div>
  );
}
