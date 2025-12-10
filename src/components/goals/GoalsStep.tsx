import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface GoalsStepProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const fitnessGoals = [
  { id: "lose_weight", label: "Perder Peso", emoji: "🔥", description: "Queimar gordura e emagrecer" },
  { id: "build_muscle", label: "Ganhar Massa", emoji: "💪", description: "Hipertrofia muscular" },
  { id: "get_fit", label: "Condicionamento", emoji: "❤️", description: "Melhorar saúde geral" },
  { id: "increase_strength", label: "Força", emoji: "🏋️", description: "Aumentar força máxima" },
  { id: "flexibility", label: "Flexibilidade", emoji: "🤸", description: "Melhorar mobilidade" },
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
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                      isSelected ? "bg-lime" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {goal.emoji}
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
