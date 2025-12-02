import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface TrainingLevelStepProps {
  value: string;
  onChange: (value: string) => void;
}

const trainingLevels = [
  { id: "beginner", label: "Iniciante", description: "Menos de 6 meses de treino", level: 1 },
  { id: "intermediate", label: "Intermediário", description: "6 meses a 2 anos de treino", level: 2 },
  { id: "advanced", label: "Avançado", description: "Mais de 2 anos de treino", level: 3 },
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
          Qual seu nível de atividade física?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="space-y-3">
        {trainingLevels.map((level, index) => {
          const isSelected = value === level.id;
          
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "bg-orange/10 border-orange scale-[1.02]"
                    : "bg-card border-border hover:border-orange/50"
                }`}
                onClick={() => onChange(level.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{level.label}</h3>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((l) => (
                          <motion.div
                            key={l}
                            className={`w-2 h-2 rounded-full ${
                              l <= level.level
                                ? isSelected ? "bg-orange" : "bg-muted-foreground"
                                : "bg-muted"
                            }`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + l * 0.05 }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "border-orange bg-orange" : "border-muted"
                  }`}>
                    {isSelected && <span className="text-white text-sm">✓</span>}
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
