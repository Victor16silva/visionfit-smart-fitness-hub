import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface BodyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const bodyTypes = [
  { id: "ectomorph", label: "Ectomorfo", emoji: "🏃", description: "Magro, metabolismo rápido" },
  { id: "mesomorph", label: "Mesomorfo", emoji: "💪", description: "Atlético, ganha músculo fácil" },
  { id: "endomorph", label: "Endomorfo", emoji: "🧍", description: "Estrutura maior, ganha peso fácil" },
];

export function BodyTypeStep({ value, onChange }: BodyTypeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu biotipo?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a ajustar seu plano de treino
        </p>
      </div>

      <div className="space-y-3">
        {bodyTypes.map((type, index) => {
          const isSelected = value === type.id;

          return (
            <motion.div
              key={type.id}
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
                onClick={() => onChange(type.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${
                      isSelected ? "bg-lime" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {type.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{type.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
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
