import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Clock, Dumbbell, Lightbulb } from "lucide-react";

interface WorkoutDay {
  date: Date;
  calories: number;
  workout: string;
  duration: number;
  tip: string;
}

export default function PerformanceCalendar() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Generate last 5 days
  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (4 - i));
    return date;
  });

  // Mock data - in real app, fetch from database
  const workoutData: Record<string, WorkoutDay> = {
    [new Date(2025, 10, 26).toDateString()]: {
      date: new Date(2025, 10, 26),
      calories: 320,
      workout: "Full Body",
      duration: 45,
      tip: "Mantenha-se hidratado durante o treino!"
    },
    [new Date(2025, 10, 25).toDateString()]: {
      date: new Date(2025, 10, 25),
      calories: 280,
      workout: "HIIT Cardio",
      duration: 30,
      tip: "Alongue-se antes e depois do treino."
    },
    [new Date(2025, 10, 24).toDateString()]: {
      date: new Date(2025, 10, 24),
      calories: 150,
      workout: "Treino Diário",
      duration: 16,
      tip: "Descanse bem entre as séries."
    },
  };

  const selectedDate = last5Days[selectedIndex];
  const selectedData = workoutData[selectedDate.toDateString()];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div>
      {/* Horizontal 5-day calendar */}
      <div className="flex gap-2 mb-4">
        {last5Days.map((date, index) => {
          const hasWorkout = !!workoutData[date.toDateString()];
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 p-3 rounded-xl transition-all ${
                isSelected 
                  ? 'bg-lime text-black' 
                  : 'bg-card border border-border text-foreground'
              }`}
            >
              <div className="text-xs opacity-80 mb-1">
                {dayNames[date.getDay()]}
              </div>
              <div className="text-xl font-bold mb-1">
                {date.getDate()}
              </div>
              {hasWorkout && (
                <div className={`w-1.5 h-1.5 rounded-full mx-auto ${
                  isSelected ? 'bg-black' : 'bg-lime'
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {selectedData && (
        <Card className="mt-4 p-4 bg-card border-border">
          <h4 className="font-bold text-foreground mb-4">
            Desempenho - {selectedData.date.toLocaleDateString('pt-BR')}
          </h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calorias Queimadas</p>
                <p className="font-semibold text-foreground">{selectedData.calories} kcal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lime/20 flex items-center justify-center">
                <Dumbbell className="h-5 w-5 text-lime" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Treino Realizado</p>
                <p className="font-semibold text-foreground">{selectedData.workout}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo de Treino</p>
                <p className="font-semibold text-foreground">{selectedData.duration} minutos</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dica do Dia</p>
                <p className="text-sm text-foreground">{selectedData.tip}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
