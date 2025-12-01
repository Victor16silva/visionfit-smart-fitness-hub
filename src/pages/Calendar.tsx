import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Clock, Dumbbell, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/StatCard";
import BottomNav from "@/components/BottomNav";

interface WorkoutLog {
  date: string;
  workoutName: string;
  duration: number;
  calories: number;
  exercises: number;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, WorkoutLog>>({});

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  useEffect(() => {
    loadWorkoutLogs();
  }, [currentMonth, user]);

  const loadWorkoutLogs = async () => {
    // TODO: Fetch from database
    // Mock data
    const mockLogs: Record<string, WorkoutLog> = {};
    const today = new Date();
    
    // Add some mock workout days
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const key = date.toISOString().split("T")[0];
      mockLogs[key] = {
        date: key,
        workoutName: ["Treino de Peito", "Full Body", "HIIT", "Pernas"][Math.floor(Math.random() * 4)],
        duration: 30 + Math.floor(Math.random() * 30),
        calories: 200 + Math.floor(Math.random() * 200),
        exercises: 5 + Math.floor(Math.random() * 5),
      };
    }
    setWorkoutLogs(mockLogs);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    
    // Add padding for days before the first day of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  
  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasWorkout = (date: Date) => {
    return workoutLogs[date.toISOString().split("T")[0]];
  };

  const selectedLog = selectedDate 
    ? workoutLogs[selectedDate.toISOString().split("T")[0]] 
    : null;

  // Monthly stats
  const monthlyWorkouts = Object.keys(workoutLogs).filter((key) => {
    const date = new Date(key);
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  }).length;

  const totalMinutes = Object.values(workoutLogs).reduce((acc, log) => acc + log.duration, 0);
  const totalCalories = Object.values(workoutLogs).reduce((acc, log) => acc + log.calories, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black">Calendário</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Monthly Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Treinos"
            value={monthlyWorkouts}
            icon={Dumbbell}
            color="lime"
          />
          <StatCard
            title="Minutos"
            value={totalMinutes}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Calorias"
            value={totalCalories}
            icon={Flame}
            color="orange"
          />
        </div>

        {/* Calendar */}
        <Card className="p-4 bg-card border-border">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-bold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="aspect-square" />;
              }

              const workout = hasWorkout(date);
              const today = isToday(date);
              const selected = selectedDate?.toDateString() === date.toDateString();

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    selected
                      ? "bg-lime text-black"
                      : today
                        ? "bg-lime/20 text-lime"
                        : "hover:bg-muted"
                  }`}
                >
                  <span className={`font-medium ${selected ? "text-black" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                  {workout && !selected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-lime mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Details */}
        {selectedLog && (
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-lime" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedLog.workoutName}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedLog.date).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long"
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedLog.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {selectedLog.calories} kcal
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="w-4 h-4" />
                {selectedLog.exercises} exercícios
              </span>
            </div>
          </Card>
        )}

        {selectedDate && !selectedLog && (
          <Card className="p-6 bg-card border-border text-center">
            <p className="text-muted-foreground mb-3">
              Nenhum treino registrado neste dia
            </p>
            <Button
              className="bg-lime text-black hover:bg-lime/90"
              onClick={() => navigate("/workouts")}
            >
              Iniciar Treino
            </Button>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
