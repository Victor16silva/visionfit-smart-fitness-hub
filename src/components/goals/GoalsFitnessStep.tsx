import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, Dumbbell, Scale, Heart, Zap } from "lucide-react";

interface GoalsFitnessStepProps {
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

export function GoalsFitnessStep({ value, onChange }: GoalsFitnessStepProps) {
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
          Quais são seus objetivos?
        </h1>
        <p className="text-muted-foreground text-sm">
          Selecione um ou mais objetivos fitness
        </p>
      </div>

      <div className="space-y-3">
        {fitnessGoals.map((goal, index) => {
          const Icon = goal.icon;
          const isSelected = value.includes(goal.id);
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-lime/10 border-lime"
                    : "bg-card border-border hover:border-lime/50"
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected ? "bg-lime text-black" : "bg-muted"
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{goal.label}</h3>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "border-lime bg-lime" : "border-muted"
                  }`}>
                    {isSelected && <span className="text-black text-sm">✓</span>}
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
