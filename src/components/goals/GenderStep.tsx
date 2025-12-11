import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface GenderStepProps {
  value: string;
  onChange: (value: string) => void;
}

const genderOptions = [
  { id: "male", label: "Masculino", emoji: "👨" },
  { id: "female", label: "Feminino", emoji: "👩" },
];

export function GenderStep({ value, onChange }: GenderStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Qual é o seu gênero?
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a personalizar seu plano
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {genderOptions.map((option, index) => {
          const isSelected = value === option.id;
          
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "bg-lime/10 border-lime scale-[1.02]"
                    : "bg-card border-border hover:border-lime/50"
                }`}
                onClick={() => onChange(option.id)}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <motion.div 
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${
                      isSelected ? "bg-lime" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.emoji}
                  </motion.div>
                  <h3 className="font-bold text-foreground">{option.label}</h3>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
