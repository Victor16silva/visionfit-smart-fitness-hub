import { motion } from "framer-motion";
import { Rocket, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReadyStepProps {
  onStart: () => void;
  loading: boolean;
}

export function ReadyStep({ onStart, loading }: ReadyStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col items-center justify-center text-center"
    >
      <motion.div
        className="w-24 h-24 rounded-full bg-lime flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
      >
        <Rocket className="w-12 h-12 text-black" />
      </motion.div>

      <motion.h1
        className="text-3xl font-black text-foreground mb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Tudo pronto!
      </motion.h1>

      <motion.p
        className="text-muted-foreground mb-8 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Seu perfil está completo. Vamos começar sua jornada de transformação!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-xs"
      >
        <Button
          className="w-full bg-lime text-black font-bold h-14 text-lg hover:bg-lime/90"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Começar Agora"
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
}
