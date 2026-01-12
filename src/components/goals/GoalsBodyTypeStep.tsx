import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface GoalsBodyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const bodyTypes = [
  { 
    id: "ectomorph", 
    label: "Ectomorfo", 
    emoji: "🏃", 
    description: "Magro, dificuldade em ganhar peso" 
  },
  { 
    id: "mesomorph", 
    label: "Mesomorfo", 
    emoji: "💪", 
    description: "Atlético, facilidade em ganhar músculo" 
  },
  { 
    id: "endomorph", 
    label: "Endomorfo", 
    emoji: "🐻", 
    description: "Tendência a ganhar peso" 
  },
];

export function GoalsBodyTypeStep({ value, onChange }: GoalsBodyTypeStepProps) {
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
          Isso nos ajuda a personalizar seu plano
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
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
                onClick={() => onChange(type.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className="text-4xl"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {type.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
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
