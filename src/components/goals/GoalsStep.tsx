import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, Dumbbell, Scale, Heart, Zap } from "lucide-react";

interface GoalsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const fitnessGoals = [
  { id: "lose_weight", label: "Perder Peso", icon: Scale, description: "Queimar gordura e emagrecer" },
  { id: "build_muscle", label: "Ganhar Massa", icon: Dumbbell, description: "Hipertrofia muscular" },
  { id: "get_fit", label: "Condicionamento", icon: Heart, description: "Melhorar saúde geral" },
  { id: "increase_strength", label: "Força", icon: Zap, description: "Aumentar força máxima" },
  { id: "flexibility", label: "Flexibilidade", icon: Target, description: "Melhorar mobilidade" },
];

export function GoalsStep({ value, onChange }: GoalsStepProps) {
  const toggleGoal = (goalId: string) => {
    if (value.includes(goalId)) {
      onChange(value.filter((g) => g !== goalId));
    } else {
      onChange([...value, goalId]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é seu objetivo?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar seu plano personalizado
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {fitnessGoals.map((goal, index) => {
          const Icon = goal.icon;
          const isSelected = value.includes(goal.id);
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all duration-300 h-full ${
                  isSelected
                    ? "bg-lime/10 border-lime scale-[1.02]"
                    : "bg-card border-border hover:border-lime/50"
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <motion.div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? "bg-lime text-black" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{goal.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {value.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-lime"
        >
          {value.length} objetivo(s) selecionado(s)
        </motion.p>
      )}
    </motion.div>
  );
}
