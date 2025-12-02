import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface GenderStepProps {
  value: string;
  onChange: (value: string) => void;
}

const genderOptions = [
  { id: "male", label: "Masculino", icon: "♂", color: "bg-blue/20 border-blue" },
  { id: "female", label: "Feminino", icon: "♀", color: "bg-pink-500/20 border-pink-500" },
];

export function GenderStep({ value, onChange }: GenderStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          Conte-nos sobre você!
        </h1>
        <p className="text-muted-foreground text-sm">
          Para criar uma experiência melhor, precisamos saber seu gênero
        </p>
      </div>

      <div className="space-y-4">
        {genderOptions.map((option, index) => {
          const isSelected = value === option.id;
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`p-6 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? `${option.color} scale-[1.02]`
                    : "bg-card border-border hover:border-muted-foreground/50"
                }`}
                onClick={() => onChange(option.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                      isSelected
                        ? option.id === "male" ? "bg-blue text-white" : "bg-pink-500 text-white"
                        : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {option.icon}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">{option.label}</h3>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? option.id === "male" ? "border-blue bg-blue" : "border-pink-500 bg-pink-500"
                      : "border-muted"
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
