import { motion } from "framer-motion";
import { Sparkles, Dumbbell, TrendingUp } from "lucide-react";

export function ReadyStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="space-y-8 text-center py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-32 h-32 mx-auto bg-gradient-to-br from-lime to-lime/50 rounded-full flex items-center justify-center"
      >
        <Sparkles className="h-16 w-16 text-black" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-3xl font-black text-foreground mb-3">
          Tudo Pronto!
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Seu perfil está completo. Agora você pode começar sua jornada fitness
          personalizada!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-3 gap-4 max-w-md mx-auto"
      >
        <div className="bg-card rounded-xl p-4 border border-border">
          <Dumbbell className="h-8 w-8 text-lime mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Treinos Personalizados</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <TrendingUp className="h-8 w-8 text-lime mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Acompanhamento</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <Sparkles className="h-8 w-8 text-lime mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Resultados</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
