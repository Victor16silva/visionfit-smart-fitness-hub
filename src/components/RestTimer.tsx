import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface RestTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({ 
  initialSeconds, 
  onComplete,
  autoStart = false 
}: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);

  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0 && isRunning) {
      setIsRunning(false);
      onComplete?.();
    }

    return () => clearInterval(interval);
  }, [isRunning, seconds, onComplete]);

  const reset = useCallback(() => {
    setSeconds(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds]);

  const adjustTime = (amount: number) => {
    const newTotal = Math.max(10, totalSeconds + amount);
    setTotalSeconds(newTotal);
    setSeconds(newTotal);
    setIsRunning(false);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">Tempo de Descanso</p>
        
        {/* Circular Progress */}
        <div className="relative w-40 h-40 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            {/* Progress Circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className="text-lime transition-all duration-300"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
            />
          </svg>
          
          {/* Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-foreground">
              {formatTime(seconds)}
            </span>
          </div>
        </div>
        
        {/* Time Adjustment */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustTime(-10)}
            disabled={totalSeconds <= 10}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px]">
            {formatTime(totalSeconds)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustTime(10)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={reset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            size="lg"
            className={`w-32 ${
              isRunning 
                ? "bg-orange hover:bg-orange/90" 
                : "bg-lime hover:bg-lime/90"
            } text-black font-bold`}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2 fill-current" />
                Iniciar
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
