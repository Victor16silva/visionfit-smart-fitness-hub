import { motion } from "framer-motion";

interface GoalsWeightStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function GoalsWeightStep({ value, onChange }: GoalsWeightStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div>
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual seu peso?
        </h1>
        <p className="text-muted-foreground text-sm">
          Você pode alterar isso depois
        </p>
      </div>

      <div className="relative h-48 flex flex-col items-center justify-center">
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-black text-primary"
        >
          {value}
          <span className="text-2xl text-muted-foreground ml-2">kg</span>
        </motion.div>

        <div className="mt-8 w-full max-w-xs">
          <div className="relative h-16">
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end gap-0.5">
              {Array.from({ length: 41 }).map((_, i) => {
                const markValue = value - 20 + i;
                const isCenter = i === 20;
                const distance = Math.abs(i - 20);
                const opacity = Math.max(0.1, 1 - distance * 0.05);
                const height = isCenter ? 40 : 16 + (20 - distance) * 0.5;
                
                return (
                  <div
                    key={i}
                    className={`w-0.5 transition-all rounded-full ${
                      isCenter ? "bg-primary" : "bg-muted-foreground"
                    }`}
                    style={{
                      height: `${height}px`,
                      opacity: opacity,
                    }}
                  />
                );
              })}
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-12 bg-primary" />
          </div>
        </div>

        <input
          type="range"
          min="30"
          max="200"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Arraste para ajustar o peso
      </p>
    </motion.div>
  );
}
