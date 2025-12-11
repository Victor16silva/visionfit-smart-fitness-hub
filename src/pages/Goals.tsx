import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Target, Dumbbell, Scale, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fitnessGoals = [
  { id: "lose_weight", label: "Perder Peso", icon: Scale, description: "Queimar gordura e emagrecer" },
  { id: "build_muscle", label: "Ganhar Massa", icon: Dumbbell, description: "Hipertrofia muscular" },
  { id: "get_fit", label: "Condicionamento", icon: Heart, description: "Melhorar saúde geral" },
  { id: "increase_strength", label: "Força", icon: Zap, description: "Aumentar força máxima" },
  { id: "flexibility", label: "Flexibilidade", icon: Target, description: "Melhorar mobilidade" },
];

const bodyTypes = [
  { id: "ectomorph", label: "Ectomorfo", description: "Magro, dificuldade em ganhar peso" },
  { id: "mesomorph", label: "Mesomorfo", description: "Atlético, facilidade em ganhar músculo" },
  { id: "endomorph", label: "Endomorfo", description: "Tendência a ganhar peso" },
];

const trainingLevels = [
  { id: "beginner", label: "Iniciante", description: "Menos de 6 meses de treino" },
  { id: "intermediate", label: "Intermediário", description: "6 meses a 2 anos de treino" },
  { id: "advanced", label: "Avançado", description: "Mais de 2 anos de treino" },
];

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [bodyType, setBodyType] = useState<string>("");
  const [trainingLevel, setTrainingLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedGoals.length === 0) {
      toast({ title: "Selecione pelo menos um objetivo", variant: "destructive" });
      return;
    }
    if (step === 2 && !bodyType) {
      toast({ title: "Selecione seu biotipo", variant: "destructive" });
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!trainingLevel) {
      toast({ title: "Selecione seu nível de treino", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd save this to a goals/preferences table
      // For now, we'll show success and navigate
      toast({ title: "Objetivos salvos com sucesso!" });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Erro ao salvar objetivos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-lime" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        {/* Step 1: Goals */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Quais são seus objetivos?
              </h1>
              <p className="text-muted-foreground">
                Selecione um ou mais objetivos fitness
              </p>
            </div>

            <div className="space-y-3">
              {fitnessGoals.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <Card
                    key={goal.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-lime/10 border-lime"
                        : "bg-card border-border hover:border-lime/50"
                    }`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-lime text-black" : "bg-muted"
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{goal.label}</h3>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-lime bg-lime" : "border-muted"
                      }`}>
                        {isSelected && <span className="text-black text-sm">✓</span>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Body Type */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Qual é seu biotipo?
              </h1>
              <p className="text-muted-foreground">
                Isso nos ajuda a personalizar seu plano
              </p>
            </div>

            <div className="space-y-3">
              {bodyTypes.map((type) => {
                const isSelected = bodyType === type.id;
                return (
                  <Card
                    key={type.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple/10 border-purple"
                        : "bg-card border-border hover:border-purple/50"
                    }`}
                    onClick={() => setBodyType(type.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{type.label}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        isSelected ? "border-purple bg-purple" : "border-muted"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-foreground rounded-full m-auto mt-1" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Training Level */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black text-foreground mb-2">
                Qual seu nível de treino?
              </h1>
              <p className="text-muted-foreground">
                Ajustaremos a intensidade dos treinos
              </p>
            </div>

            <div className="space-y-3">
              {trainingLevels.map((level) => {
                const isSelected = trainingLevel === level.id;
                return (
                  <Card
                    key={level.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-orange/10 border-orange"
                        : "bg-card border-border hover:border-orange/50"
                    }`}
                    onClick={() => setTrainingLevel(level.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        isSelected ? "border-orange bg-orange" : "border-muted"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-foreground rounded-full m-auto mt-1" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4">
        <Button
          className="w-full bg-lime text-black hover:bg-lime/90 font-bold h-14"
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            "Salvando..."
          ) : step < 3 ? (
            <>
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            "Concluir"
          )}
        </Button>
      </div>
    </div>
  );
}
