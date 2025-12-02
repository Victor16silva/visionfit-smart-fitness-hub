import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import bodyEctomorph from "@/assets/body-ectomorph.png";
import bodyMesomorph from "@/assets/body-mesomorph.png";
import bodyEndomorph from "@/assets/body-endomorph.png";

interface BodyTypeStepProps {
  value: string;
  onChange: (value: string) => void;
}

const bodyTypes = [
  { id: "ectomorph", label: "Ectomorfo", description: "Magro, dificuldade em ganhar peso", image: bodyEctomorph },
  { id: "mesomorph", label: "Mesomorfo", description: "Atlético, facilidade em ganhar músculo", image: bodyMesomorph },
  { id: "endomorph", label: "Endomorfo", description: "Tendência a ganhar peso", image: bodyEndomorph },
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
                className={`p-4 cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "bg-purple/10 border-purple scale-[1.02]"
                    : "bg-card border-border hover:border-purple/50"
                }`}
                onClick={() => onChange(type.id)}
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden ${
                      isSelected ? "bg-purple/20" : "bg-muted"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src={type.image} 
                      alt={type.label} 
                      className="w-14 h-14 object-contain"
                    />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{type.label}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? "border-purple bg-purple" : "border-muted"
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
