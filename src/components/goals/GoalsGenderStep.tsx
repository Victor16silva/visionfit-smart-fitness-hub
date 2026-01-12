import { motion } from "framer-motion";

interface GoalsGenderStepProps {
  value: string;
  onChange: (value: string) => void;
}

const genderOptions = [
  { id: "male", label: "Masculino", symbol: "♂" },
  { id: "female", label: "Feminino", symbol: "♀" },
];

export function GoalsGenderStep({ value, onChange }: GoalsGenderStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div>
        <h1 className="text-2xl font-black text-foreground mb-2">
          Conte-nos sobre você!
        </h1>
        <p className="text-muted-foreground text-sm">
          Isso nos ajuda a criar uma experiência personalizada
        </p>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {genderOptions.map((option, index) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(option.id)}
            className={`w-32 h-32 rounded-full cursor-pointer transition-all flex flex-col items-center justify-center ${
              value === option.id
                ? "bg-primary scale-110 shadow-lg shadow-primary/30"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            <span className="text-4xl">{option.symbol}</span>
            <p className="text-sm font-semibold mt-2">{option.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
