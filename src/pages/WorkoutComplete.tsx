import { useNavigate, useLocation } from "react-router-dom";
import { Check, Clock, Flame, Dumbbell, Share2, Home, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import heroGym from "@/assets/hero-gym.jpg";

export default function WorkoutComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  
  const stats = location.state || {
    duration: 2700,
    calories: 380,
    exercises: 8,
    workoutName: "Treino",
    muscleGroups: ["Membros Superiores"],
  };

  // Update program progress when workout is completed
  useEffect(() => {
    const updateProgress = async () => {
      if (!user) return;
      
      try {
        // Get current program
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_program_id")
          .eq("id", user.id)
          .single();
        
        if (profile?.current_program_id) {
          // Get current progress
          const { data: program } = await supabase
            .from("workout_programs")
            .select("progress_percent")
            .eq("id", profile.current_program_id)
            .single();
          
          if (program) {
            // Increment progress (30 days = ~3.33% per workout, max 4 workouts per week = ~3% per workout)
            const newProgress = Math.min((program.progress_percent || 0) + 3, 100);
            
            await supabase
              .from("workout_programs")
              .update({ progress_percent: newProgress })
              .eq("id", profile.current_program_id);
          }
        }
      } catch (error) {
        console.error("Error updating progress:", error);
      }
    };

    updateProgress();
  }, [user]);

  useEffect(() => {
    // Initial celebration - green background phase
    const timer = setTimeout(() => {
      setShowDetails(true);
    }, 2000);

    // Fire confetti
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
        colors: ['#c8ff00', '#8b5cf6', '#f97316', '#3b82f6', '#ef4444', '#fbbf24'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#c8ff00', '#8b5cf6', '#f97316', '#3b82f6', '#ef4444', '#fbbf24'],
      });
    }, 250);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const caption = `Resultados vêm para quem trabalha duro, sem desculpas. #DeterminaçãoTotal #TreinoFocado #Fitness`;

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    toast({ title: "Legenda copiada!" });
  };

  // Initial celebration screen
  if (!showDetails) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated check icon */}
        <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-6 animate-pulse">
          <div className="w-16 h-16 rounded-full border-4 border-primary-foreground flex items-center justify-center">
            <Check className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-primary-foreground text-center">
          Treino concluído
        </h1>
      </div>
    );
  }

  // Detailed stats screen
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <button 
          onClick={() => navigate("/dashboard")}
          className="w-10 h-10 flex items-center justify-center"
        >
          <X className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold">Treino concluído 🎉</h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Share Card - Like the reference image */}
        <div className="relative rounded-2xl overflow-hidden bg-card">
          {/* Background Image */}
          <div className="relative aspect-[4/5]">
            <img 
              src={heroGym}
              alt="Gym"
              className="w-full h-full object-cover grayscale"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <button className="w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1.5 rounded-full">
                <span className="text-orange font-bold">💪</span>
                <span className="text-sm font-semibold text-foreground">VisionFit</span>
              </div>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-xl font-bold text-foreground mb-1">
                {stats.workoutName || "esforço máximo"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {stats.muscleGroups?.join(", ") || "membros superiores"}
              </p>
              
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                  <p className="text-lg font-bold text-foreground">{formatTime(stats.duration)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exercícios</p>
                  <p className="text-lg font-bold text-foreground">{stats.exercises}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kcal</p>
                  <p className="text-lg font-bold text-foreground">{stats.calories}</p>
                </div>
                
                {/* Body illustration placeholder */}
                <div className="ml-auto">
                  <div className="w-16 h-20 bg-orange/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏋️</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Caption Suggestion */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Sugestão de Legenda</h3>
            <span className="px-2 py-0.5 bg-purple/20 text-purple text-xs rounded-full font-medium">
              IA ✨
            </span>
          </div>
          
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-foreground mb-3">{caption}</p>
            <button 
              onClick={copyCaption}
              className="flex items-center gap-2 text-orange text-sm font-medium ml-auto"
            >
              Copiar legenda <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 pb-8 grid grid-cols-4 gap-2">
        <button className="flex flex-col items-center gap-1 py-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-lg">🖼️</span>
          </div>
          <span className="text-xs text-muted-foreground">Alterar foto</span>
        </button>
        <button className="flex flex-col items-center gap-1 py-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-lg">📝</span>
          </div>
          <span className="text-xs text-muted-foreground">Adicionar Texto</span>
        </button>
        <button className="flex flex-col items-center gap-1 py-3">
          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <span className="text-lg">🎨</span>
          </div>
          <span className="text-xs text-muted-foreground">Aplicar filtro</span>
        </button>
        <Button 
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "VisionFit - Treino Completo!",
                text: caption,
              });
            } else {
              toast({ title: "Compartilhamento não disponível" });
            }
          }}
          className="flex flex-col items-center gap-1 py-3 h-auto bg-orange hover:bg-orange/90 text-orange-foreground rounded-xl"
        >
          <Share2 className="h-5 w-5" />
          <span className="text-xs">Compartilhar</span>
        </Button>
      </div>
    </div>
  );
}
