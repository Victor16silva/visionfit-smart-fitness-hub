import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Flame, Clock, Dumbbell, Lightbulb, Trophy } from "lucide-react";
import { useDailyPerformance } from "@/hooks/use-daily-performance";
import { WEEKDAY_LABELS, startOfLocalDay, toLocalDateKey } from "@/lib/dates";

const tips = [
  "Mantenha-se hidratado durante o treino!",
  "Alongue-se antes e depois do treino.",
  "Descanse bem entre as séries.",
  "A consistência é a chave do sucesso!",
  "Aumente a intensidade gradualmente.",
  "Durma bem para melhor recuperação.",
  "Alimente-se adequadamente antes do treino.",
  "Não pule o aquecimento!",
];

export default function PerformanceCalendar() {
  const [selectedIndex, setSelectedIndex] = useState(4);

  const last5Days = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const date = startOfLocalDay(new Date());
        date.setDate(date.getDate() - (4 - i));
        return date;
      }),
    [],
  );

  const { byDate, loading } = useDailyPerformance(last5Days[0], last5Days[4]);
  const selectedDate = last5Days[selectedIndex];
  const selectedKey = toLocalDateKey(selectedDate);
  const selectedData = byDate[selectedKey];
  const tip = tips[selectedDate.getDate() % tips.length];

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {last5Days.map((date, index) => {
          const key = toLocalDateKey(date);
          const hasWorkout = !!byDate[key];
          const isSelected = index === selectedIndex;
          const todayDate = isToday(date);

          return (
            <button
              key={key}
              onClick={() => setSelectedIndex(index)}
              className={`flex-1 p-3 rounded-xl transition-all relative ${
                isSelected
                  ? "bg-lime text-black"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {todayDate && (
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    isSelected ? "bg-black" : "bg-lime"
                  }`}
                />
              )}
              <div className="text-xs opacity-80 mb-1">{WEEKDAY_LABELS[date.getDay()]}</div>
              <div className="text-xl font-bold mb-1">{date.getDate()}</div>
              {hasWorkout && (
                <div
                  className={`w-1.5 h-1.5 rounded-full mx-auto ${
                    isSelected ? "bg-black" : "bg-lime"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="mt-4 p-4 bg-card border-border">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </Card>
      ) : selectedData ? (
        <Card className="mt-4 p-4 bg-card border-border">
          <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-lime" />
            Desempenho - {selectedDate.toLocaleDateString("pt-BR")}
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
                <p className="font-semibold text-foreground">{selectedData.workoutName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo de Treino</p>
                <p className="font-semibold text-foreground">
                  {selectedData.durationMinutes} minutos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Dica do Dia</p>
                <p className="text-sm text-foreground">{tip}</p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 p-4 bg-card border-border text-center">
          <div className="py-6">
            <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum treino registrado em {selectedDate.toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Complete um treino para ver seu desempenho aqui!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
