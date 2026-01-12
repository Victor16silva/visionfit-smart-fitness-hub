import { motion } from "framer-motion";

interface GoalsAgeStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function GoalsAgeStep({ value, onChange }: GoalsAgeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div>
        <h1 className="text-2xl font-black text-foreground mb-2">
          Quantos anos você tem?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar o plano perfeito
        </p>
      </div>

      <div className="relative h-64 flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            key={value - 1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="text-5xl font-bold text-muted-foreground"
          >
            {value - 1}
          </motion.div>
          <div className="my-4 relative">
            <motion.div
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-black text-primary"
            >
              {value}
            </motion.div>
            <div className="absolute -left-8 -right-8 top-1/2 -translate-y-1/2 h-20 border-2 border-primary/30 rounded-xl pointer-events-none" />
          </div>
          <motion.div
            key={value + 1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            className="text-5xl font-bold text-muted-foreground"
          >
            {value + 1}
          </motion.div>
        </div>
        <input
          type="range"
          min="14"
          max="80"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-64 opacity-0 cursor-pointer"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Arraste para cima ou para baixo para ajustar
      </p>
    </motion.div>
  );
}
