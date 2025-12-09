import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function UserOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<number>(35);
  const [weight, setWeight] = useState<number>(65);
  const [loading, setLoading] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragStartValue, setDragStartValue] = useState<number>(0);

  const handleNext = () => {
    if (step === 1 && !gender) {
      toast({
        title: "Selecione seu gênero",
        variant: "destructive",
      });
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          gender,
          age,
          weight_kg: weight,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil configurado!",
        description: "Bem-vindo ao VisionFit",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar suas informações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Drag handlers for age
  const handleAgeDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartValue(age);
  };

  const handleAgeDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY;
    const newAge = Math.max(18, Math.min(80, dragStartValue + Math.floor(deltaY / 10)));
    setAge(newAge);
  };

  const handleAgeDragEnd = () => {
    setDragStartY(null);
  };

  // Drag handlers for weight
  const handleWeightDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartValue(weight);
  };

  const handleWeightDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartY === null) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragStartY - clientY;
    const newWeight = Math.max(15, Math.min(200, dragStartValue + Math.floor(deltaY / 3)));
    setWeight(newWeight);
  };

  const handleWeightDragEnd = () => {
    setDragStartY(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Step 1: Gender */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2">Conte-nos sobre você!</h1>
              <p className="text-muted-foreground text-sm">
                Isso nos ajudará a criar uma experiência melhor adaptada ao seu gênero
              </p>
            </div>

            <RadioGroup value={gender} onValueChange={setGender} className="space-y-6">
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setGender("male")}
                className={`flex items-center justify-center h-40 w-40 mx-auto rounded-full cursor-pointer transition-all duration-300 ${
                  gender === "male"
                    ? "bg-primary/80 scale-110 shadow-lg shadow-primary/30"
                    : "bg-card border-2 border-border hover:border-primary/50"
                }`}
              >
                <div className="text-center">
                  <span className="text-5xl">♂</span>
                  <p className="text-base font-semibold mt-2">Masculino</p>
                </div>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setGender("female")}
                className={`flex items-center justify-center h-40 w-40 mx-auto rounded-full cursor-pointer transition-all duration-300 ${
                  gender === "female"
                    ? "bg-purple-400 scale-110 shadow-lg shadow-purple-400/30"
                    : "bg-card border-2 border-border hover:border-purple-400/50"
                }`}
              >
                <div className="text-center">
                  <span className="text-5xl">♀</span>
                  <p className="text-base font-semibold mt-2">Feminino</p>
                </div>
              </motion.div>
            </RadioGroup>

            <Button
              onClick={handleNext}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-base font-semibold"
            >
              Próximo →
            </Button>
          </motion.div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-8"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(1)}
              className="absolute top-4 left-4 rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold mb-2">Quantos anos você tem?</h1>
              <p className="text-muted-foreground text-sm">
                Isso nos ajuda a criar o plano perfeito
              </p>
            </div>

            <div
              className="relative h-64 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleAgeDragStart}
              onMouseMove={handleAgeDragMove}
              onMouseUp={handleAgeDragEnd}
              onMouseLeave={handleAgeDragEnd}
              onTouchStart={handleAgeDragStart}
              onTouchMove={handleAgeDragMove}
              onTouchEnd={handleAgeDragEnd}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  key={`age-prev-${age}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.3, y: 0 }}
                  className="text-5xl font-bold text-muted-foreground"
                >
                  {age - 1}
                </motion.div>
                <motion.div
                  key={`age-current-${age}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-7xl font-bold my-4 text-primary/80"
                >
                  {age}
                </motion.div>
                <motion.div
                  key={`age-next-${age}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.3, y: 0 }}
                  className="text-5xl font-bold text-muted-foreground"
                >
                  {age + 1}
                </motion.div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-base font-semibold"
            >
              Próximo →
            </Button>
          </motion.div>
        )}

        {/* Step 3: Weight */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-8"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(2)}
              className="absolute top-4 left-4 rounded-full hover:bg-muted"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold mb-2">Qual é o seu peso atual?</h1>
              <p className="text-muted-foreground text-sm">
                Você pode sempre alterar isso depois
              </p>
            </div>

            <div className="relative h-96 flex flex-col items-center justify-center">
              {/* Círculo animado com gradiente */}
              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* Círculo de fundo */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="144"
                    cy="144"
                    r="120"
                    fill="none"
                    stroke="hsl(var(--muted-foreground) / 0.1)"
                    strokeWidth="12"
                  />
                  {/* Arco de progresso animado */}
                  <motion.circle
                    cx="144"
                    cy="144"
                    r="120"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 120 * (1 - ((weight - 15) / 185))
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Display do peso no centro */}
                <div
                  className="relative z-10 cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleWeightDragStart}
                  onMouseMove={handleWeightDragMove}
                  onMouseUp={handleWeightDragEnd}
                  onMouseLeave={handleWeightDragEnd}
                  onTouchStart={handleWeightDragStart}
                  onTouchMove={handleWeightDragMove}
                  onTouchEnd={handleWeightDragEnd}
                >
                  <motion.div
                    key={`weight-${weight}`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20
                    }}
                    className="text-center"
                  >
                    <motion.div
                      className="text-7xl font-black text-primary"
                      animate={{
                        textShadow: [
                          "0 0 20px hsl(var(--primary) / 0.3)",
                          "0 0 40px hsl(var(--primary) / 0.5)",
                          "0 0 20px hsl(var(--primary) / 0.3)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {weight}
                    </motion.div>
                    <div className="text-2xl text-muted-foreground font-semibold mt-2">Kg</div>
                    <div className="text-sm text-muted-foreground mt-1">Arraste para ajustar</div>
                  </motion.div>
                </div>

                {/* Indicador de posição */}
                <motion.div
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2"
                  animate={{
                    y: [0, -8, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50" />
                </motion.div>
              </div>

              {/* Range info */}
              <div className="flex justify-between w-72 mt-6 text-xs text-muted-foreground font-medium">
                <span>15 kg</span>
                <span>200 kg</span>
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-12 text-base font-semibold"
            >
              {loading ? "Salvando..." : "Continuar →"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}