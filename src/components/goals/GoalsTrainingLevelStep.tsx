import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface GoalsTrainingLevelStepProps {
  value: string;
  onChange: (value: string) => void;
}

const levels = [
  { 
    id: "beginner", 
    label: "Iniciante", 
    emoji: "🌱", 
    description: "Menos de 6 meses de treino" 
  },
  { 
    id: "intermediate", 
    label: "Intermediário", 
    emoji: "🌿", 
    description: "6 meses a 2 anos de treino" 
  },
  { 
    id: "advanced", 
    label: "Avançado", 
    emoji: "🌳", 
    description: "Mais de 2 anos de treino" 
  },
];

export function GoalsTrainingLevelStep({ value, onChange }: GoalsTrainingLevelStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual seu nível de treino?
        </h1>
        <p className="text-muted-foreground text-sm">
          Ajustaremos a intensidade dos treinos
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
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
                onClick={() => onChange(level.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-4xl"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {level.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{level.label}</h3>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-primary bg-primary" : "border-muted"
                    }`}
                  >
                    {isSelected && <span className="text-primary-foreground text-sm">✓</span>}
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
