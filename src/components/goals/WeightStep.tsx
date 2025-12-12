import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface WeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function WeightStep({ value, onChange }: WeightStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu peso?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a calcular suas necessidades
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <div className="relative">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 70)}
            className="text-center text-4xl font-black h-24 bg-card border-2 border-lime"
            min="30"
            max="300"
            step="0.1"
          />
          <p className="text-center text-muted-foreground mt-2 text-sm">
            kg
          </p>
        </div>
      </div>
    </motion.div>
  );
}
