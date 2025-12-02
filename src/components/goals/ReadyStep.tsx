import { motion } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadyStepProps {
  onStart: () => void;
  loading: boolean;
}

export function ReadyStep({ onStart, loading }: ReadyStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="w-24 h-24 bg-gradient-to-br from-lime to-lime/60 rounded-full flex items-center justify-center shadow-primary"
        >
          <Rocket className="w-12 h-12 text-black" />
        </motion.div>
        
        {/* Floating sparkles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (i - 1) * 40],
              y: [0, -30 - i * 10]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
            style={{ top: '20%', left: '50%' }}
          >
            <Sparkles className="w-4 h-4 text-lime" />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-black text-foreground">
          Está pronto para <span className="text-lime">evoluir</span>?
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Sua jornada de transformação começa agora! Nossos profissionais vão criar um treino personalizado para você.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-xs"
      >
        <Button
          className="w-full bg-lime text-black hover:bg-lime/90 font-bold h-14 text-lg shadow-primary"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
              Salvando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Iniciar Jornada
            </div>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
