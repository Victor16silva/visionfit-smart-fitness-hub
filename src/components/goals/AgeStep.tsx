import { motion } from "framer-motion";

interface AgeStepProps {
  value: number;
  onChange: (value: number) => void;
}

export function AgeStep({ value, onChange }: AgeStepProps) {
  const ages = Array.from({ length: 80 }, (_, i) => i + 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Qual é a sua idade?
        </h1>
        <p className="text-gray-500 text-sm">
          Selecione sua idade atual
        </p>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-orange-500 rounded-2xl pointer-events-none z-10" />
        
        <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-[calc(50%-2rem)]">
          {ages.map((age) => {
            const isSelected = value === age;
            
            return (
              <motion.div
                key={age}
                className={`h-16 flex items-center justify-center snap-center cursor-pointer relative z-20 ${
                  isSelected ? "text-white" : "text-gray-300"
                }`}
                onClick={() => onChange(age)}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`text-4xl font-black transition-all ${
                  isSelected ? "scale-110" : "scale-100"
                }`}>
                  {age}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-gray-400 text-sm mt-4">
        {value} anos
      </p>
    </motion.div>
  );
}
