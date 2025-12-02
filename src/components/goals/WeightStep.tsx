import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";

interface WeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function WeightStep({ value, onChange }: WeightStepProps) {
  const minWeight = 30;
  const maxWeight = 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu peso atual?
        </h1>
        <p className="text-muted-foreground text-sm">
          Você pode alterar isso depois
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <motion.div 
          className="text-center mb-8"
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="text-7xl font-black text-lime">{value}</span>
          <span className="text-2xl text-muted-foreground ml-2">kg</span>
        </motion.div>

        {/* Weight slider */}
        <div className="w-full px-4">
          <Slider
            value={[value]}
            onValueChange={(vals) => onChange(vals[0])}
            min={minWeight}
            max={maxWeight}
            step={1}
            className="w-full"
          />
          
          {/* Scale markers */}
          <div className="flex justify-between mt-4 text-xs text-muted-foreground">
            <span>{minWeight}kg</span>
            <span>{Math.round((minWeight + maxWeight) / 2)}kg</span>
            <span>{maxWeight}kg</span>
          </div>
        </div>

        {/* Visual weight indicator */}
        <div className="mt-8 flex items-end gap-1 h-20">
          {Array.from({ length: 30 }, (_, i) => {
            const progress = (value - minWeight) / (maxWeight - minWeight);
            const barProgress = i / 29;
            const isActive = barProgress <= progress;
            const height = Math.abs(i - 15) < 5 ? 60 + (5 - Math.abs(i - 15)) * 8 : 60;
            
            return (
              <motion.div
                key={i}
                className={`w-1.5 rounded-full transition-colors ${
                  isActive ? "bg-lime" : "bg-muted"
                }`}
                initial={{ height: 20 }}
                animate={{ height }}
                transition={{ delay: i * 0.02 }}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
