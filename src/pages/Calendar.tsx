import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as amplitude from "@amplitude/unified";
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Clock, Dumbbell, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDailyPerformance } from "@/hooks/use-daily-performance";
import {
  WEEKDAY_LABELS,
  endOfMonth,
  parseLocalDateKey,
  startOfMonth,
  toLocalDateKey,
} from "@/lib/dates";
import StatCard from "@/components/StatCard";
import BottomNav from "@/components/BottomNav";

export default function Calendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");

  const initialDate = dateParam ? parseLocalDateKey(dateParam) : new Date();
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  const monthRange = useMemo(
    () => ({
      from: startOfMonth(currentMonth),
      to: endOfMonth(currentMonth),
    }),
    [currentMonth],
  );
  const { byDate, loading } = useDailyPerformance(monthRange.from, monthRange.to);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  useEffect(() => {
    amplitude.track("Performance Calendar Opened", {
      source: searchParams.get("source") || "direct",
      date: searchParams.get("date") || toLocalDateKey(new Date()),
    });
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    const startPadding = firstDay.getDay();

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

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

  const handleSelectDate = (date: Date) => {
    const key = toLocalDateKey(date);
    setSelectedDate(date);
    amplitude.track("Performance Day Selected", {
      date: key,
      weekday: WEEKDAY_LABELS[date.getDay()],
      has_workout: Boolean(byDate[key]),
      source: "calendar",
    });
  };

  const selectedKey = selectedDate ? toLocalDateKey(selectedDate) : null;
  const selectedLog = selectedKey ? byDate[selectedKey] : null;

  const monthlyWorkouts = Object.values(byDate).reduce(
    (acc, log) => acc + log.workoutCount,
    0,
  );
  const totalMinutes = Object.values(byDate).reduce(
    (acc, log) => acc + log.durationMinutes,
    0,
  );
  const totalCalories = Object.values(byDate).reduce(
    (acc, log) => acc + log.calories,
    0,
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-black">Calendário</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            title="Treinos"
            value={loading ? "—" : monthlyWorkouts}
            icon={Dumbbell}
            color="lime"
          />
          <StatCard
            title="Minutos"
            value={loading ? "—" : totalMinutes}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Calorias"
            value={loading ? "—" : totalCalories}
            icon={Flame}
            color="orange"
          />
        </div>

        <Card className="p-4 bg-card border-border">
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

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_LABELS.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`pad-${index}`} className="aspect-square" />;
              }

              const key = toLocalDateKey(date);
              const workout = byDate[key];
              const today = isToday(date);
              const selected = selectedDate?.toDateString() === date.toDateString();

              let dayClass = "hover:bg-muted";
              if (selected) {
                dayClass = "bg-lime text-black";
              } else if (today) {
                dayClass = "bg-lime/20 text-lime";
              }

              return (
                <button
                  key={key}
                  onClick={() => handleSelectDate(date)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${dayClass}`}
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

        {selectedLog && (
          <Card className="p-4 bg-card border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-lime" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedLog.workoutName}</h3>
                <p className="text-sm text-muted-foreground">
                  {parseLocalDateKey(selectedLog.dateKey).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedLog.durationMinutes} min
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

        {selectedDate && !selectedLog && !loading && (
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
