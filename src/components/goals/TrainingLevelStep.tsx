import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface TrainingLevelStepProps {
  value: string;
  onChange: (value: string) => void;
}

const levels = [
  { id: "beginner", label: "Iniciante", emoji: "🌱", description: "Novo no mundo fitness" },
  { id: "intermediate", label: "Intermediário", emoji: "💪", description: "Já treina há alguns meses" },
  { id: "advanced", label: "Avançado", emoji: "🔥", description: "Treina há anos, experiente" },
];

export function TrainingLevelStep({ value, onChange }: TrainingLevelStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu nível de treino?
        </h1>
        <p className="text-muted-foreground text-sm">
          Vamos ajustar a intensidade para você
        </p>
      </div>

      <div className="space-y-3">
        {levels.map((level, index) => {
          const isSelected = value === level.id;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "bg-lime/10 border-lime scale-[1.02]"
                    : "bg-card border-border hover:border-lime/50"
                }`}
                onClick={() => onChange(level.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                      isSelected ? "bg-lime" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {level.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{level.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
