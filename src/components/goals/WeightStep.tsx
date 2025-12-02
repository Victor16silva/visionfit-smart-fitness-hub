import { motion } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";

interface WeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function WeightStep({ value, onChange }: WeightStepProps) {
  const minWeight = 30;
  const maxWeight = 150;
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const calculateValueFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return value;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(minWeight + percentage * (maxWeight - minWeight));
    return newValue;
  }, [value, minWeight, maxWeight]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    onChange(calculateValueFromPosition(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    onChange(calculateValueFromPosition(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const progress = (value - minWeight) / (maxWeight - minWeight);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 h-full flex flex-col"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu peso atual?
        </h1>
        <p className="text-muted-foreground text-sm">
          Arraste para ajustar
        </p>
      </div>

      {/* Weight Display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div 
          className="text-center mb-12"
          key={value}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <span className="text-7xl font-black text-lime">{value}</span>
          <span className="text-3xl text-lime ml-2">Kg</span>
        </motion.div>

        {/* Ruler Slider */}
        <div 
          ref={containerRef}
          className="w-full px-4 cursor-pointer touch-none select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div className="relative h-24">
            {/* Ruler marks */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-end">
              {Array.from({ length: 61 }, (_, i) => {
                const markValue = minWeight + Math.round(i * (maxWeight - minWeight) / 60);
                const isMajor = markValue % 10 === 0;
                const isMedium = markValue % 5 === 0 && !isMajor;
                const markProgress = i / 60;
                const isActive = markProgress <= progress;
                
                return (
                  <div
                    key={i}
                    className={`transition-all duration-150 rounded-full ${
                      isActive ? "bg-lime" : "bg-muted-foreground/30"
                    }`}
                    style={{
                      width: isMajor ? 3 : 2,
                      height: isMajor ? 48 : isMedium ? 32 : 20,
                    }}
                  />
                );
              })}
            </div>

            {/* Current position indicator */}
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2 w-1 h-16 bg-lime rounded-full shadow-lg shadow-lime/50"
              style={{ left: `${progress * 100}%`, transform: 'translate(-50%, -50%)' }}
              layoutId="weight-indicator"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-lime rounded-full" />
            </motion.div>
          </div>

          {/* Scale numbers */}
          <div className="flex justify-between mt-4 text-sm text-muted-foreground font-medium">
            <span>{minWeight}</span>
            <span>{Math.round((minWeight + maxWeight) / 4)}</span>
            <span>{Math.round((minWeight + maxWeight) / 2)}</span>
            <span>{Math.round((minWeight + maxWeight) * 3 / 4)}</span>
            <span>{maxWeight}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
