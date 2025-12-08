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
  const [weight, setWeight] = useState<number>(54);
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
    const newWeight = Math.max(40, Math.min(150, dragStartValue + Math.floor(deltaY / 5)));
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

            <div className="relative h-80 flex flex-col items-center justify-center">
              {/* Display do peso */}
              <motion.div
                key={`weight-${weight}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-12"
              >
                <div className="text-8xl font-bold text-primary/80">
                  {weight}
                  <span className="text-3xl text-muted-foreground ml-3">Kg</span>
                </div>
              </motion.div>

              {/* Visualização de barras animadas */}
              <div
                className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-1 px-4 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleWeightDragStart}
                onMouseMove={handleWeightDragMove}
                onMouseUp={handleWeightDragEnd}
                onMouseLeave={handleWeightDragEnd}
                onTouchStart={handleWeightDragStart}
                onTouchMove={handleWeightDragMove}
                onTouchEnd={handleWeightDragEnd}
              >
                {Array.from({ length: 40 }).map((_, i) => {
                  const centerIndex = 20;
                  const distance = Math.abs(i - centerIndex);
                  const isCenter = i === centerIndex;
                  const maxHeight = isCenter ? 80 : Math.max(20, 60 - distance * 3);

                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 20 }}
                      animate={{
                        height: maxHeight,
                        backgroundColor: isCenter
                          ? "hsl(var(--primary) / 0.8)"
                          : distance < 5
                          ? "hsl(var(--muted-foreground) / 0.3)"
                          : "hsl(var(--muted-foreground) / 0.15)",
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="w-1 rounded-full pointer-events-none"
                      style={{
                        minHeight: "20px",
                      }}
                    />
                  );
                })}
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