import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Flame, Clock, Dumbbell, Lightbulb } from "lucide-react";

interface WorkoutDay {
  date: Date;
  calories: number;
  workout: string;
  duration: number;
  tip: string;
}

export default function PerformanceCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
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

  const selectedData = selectedDate ? workoutData[selectedDate.toDateString()] : null;

  return (
    <div>
      <Card className="p-4 bg-card border-border">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-lg"
          modifiers={{
            workout: Object.keys(workoutData).map(key => new Date(key))
          }}
          modifiersStyles={{
            workout: {
              fontWeight: "bold",
              color: "hsl(var(--lime))",
            }
          }}
        />
      </Card>

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
