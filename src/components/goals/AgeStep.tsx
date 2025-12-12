import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface AgeStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function AgeStep({ value, onChange }: AgeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é sua idade?
        </h1>
        <p className="text-muted-foreground text-sm">
          Vamos ajustar o treino para você
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <div className="relative">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 18)}
            className="text-center text-4xl font-black h-24 bg-card border-2 border-lime"
            min="13"
            max="100"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm">
            anos
          </p>
        </div>
      </div>
    </motion.div>
  );
}
