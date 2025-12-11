import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function HeightStep({ value, onChange }: HeightStepProps) {
  const increment = () => onChange(Math.min(250, value + 1));
  const decrement = () => onChange(Math.max(100, value - 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é a sua altura?
        </h1>
        <p className="text-muted-foreground text-sm">
          Informe sua altura em centímetros
        </p>
      </div>

      <div className="flex items-center justify-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-border"
          onClick={decrement}
        >
          <Minus className="h-6 w-6" />
        </Button>

        <motion.div 
          className="text-center"
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="text-6xl font-black text-lime">{value}</span>
          <span className="text-2xl text-muted-foreground ml-2">cm</span>
        </motion.div>

        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-border"
          onClick={increment}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex justify-center">
        <input
          type="range"
          min="100"
          max="250"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full max-w-xs accent-lime"
        />
      </div>
    </motion.div>
  );
}
