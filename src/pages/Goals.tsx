import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Step components
import { GenderStep } from "@/components/goals/GenderStep";
import { AgeStep } from "@/components/goals/AgeStep";
import { WeightStep } from "@/components/goals/WeightStep";
import { HeightStep } from "@/components/goals/HeightStep";
import { GoalsStep } from "@/components/goals/GoalsStep";
import { BodyTypeStep } from "@/components/goals/BodyTypeStep";
import { TrainingLevelStep } from "@/components/goals/TrainingLevelStep";
import { PhotoUploadStep } from "@/components/goals/PhotoUploadStep";
import { ReadyStep } from "@/components/goals/ReadyStep";
import { ProfileSummary } from "@/components/goals/ProfileSummary";

const TOTAL_STEPS = 9;

interface GoalsData {
  gender: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  fitness_goals: string[];
  body_type: string;
  training_level: string;
  photo_front_url: string;
  photo_back_url: string;
  photo_left_url: string;
  photo_right_url: string;
  onboarding_completed: boolean;
  trainer_requested: boolean;
}

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [requestingTrainer, setRequestingTrainer] = useState(false);
  
  const [data, setData] = useState<GoalsData>({
    gender: "",
    age: 25,
    weight_kg: 70,
    height_cm: 170,
    fitness_goals: [],
    body_type: "",
    training_level: "",
    photo_front_url: "",
    photo_back_url: "",
    photo_left_url: "",
    photo_right_url: "",
    onboarding_completed: false,
    trainer_requested: false,
  });

  useEffect(() => {
    const loadExistingGoals = async () => {
      if (!user) {
        setLoadingGoals(false);
        return;
      }

      try {
        const { data: goalsData, error } = await supabase
          .from("user_goals")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (goalsData) {
          setData({
            gender: goalsData.gender || "",
            age: goalsData.age || 25,
            weight_kg: goalsData.weight_kg || 70,
            height_cm: goalsData.height_cm || 170,
            fitness_goals: goalsData.fitness_goals || [],
            body_type: goalsData.body_type || "",
            training_level: goalsData.training_level || "",
            photo_front_url: goalsData.photo_front_url || "",
            photo_back_url: goalsData.photo_back_url || "",
            photo_left_url: goalsData.photo_left_url || "",
            photo_right_url: goalsData.photo_right_url || "",
            onboarding_completed: goalsData.onboarding_completed || false,
            trainer_requested: goalsData.trainer_requested || false,
          });
          
          if (goalsData.onboarding_completed) {
            setStep(TOTAL_STEPS + 1);
          }
        }
      } catch (error) {
        console.error("Error loading goals:", error);
      } finally {
        setLoadingGoals(false);
      }
    };

    loadExistingGoals();
  }, [user]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.gender;
      case 2: return data.age > 0;
      case 3: return data.weight_kg > 0;
      case 4: return data.height_cm > 0;
      case 5: return data.fitness_goals.length > 0;
      case 6: return !!data.body_type;
      case 7: return !!data.training_level;
      case 8: return true;
      case 9: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) {
      toast({ title: "Preencha este campo para continuar", variant: "destructive" });
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({ title: "Você precisa estar logado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_goals")
        .upsert({
          user_id: user.id,
          gender: data.gender,
          age: data.age,
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          fitness_goals: data.fitness_goals,
          body_type: data.body_type,
          training_level: data.training_level,
          photo_front_url: data.photo_front_url,
          photo_back_url: data.photo_back_url,
          photo_left_url: data.photo_left_url,
          photo_right_url: data.photo_right_url,
          onboarding_completed: true,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setData(prev => ({ ...prev, onboarding_completed: true }));
      setStep(TOTAL_STEPS + 1);
      toast({ title: "Perfil salvo com sucesso!" });
    } catch (error: any) {
      console.error("Error saving goals:", error);
      toast({ title: "Erro ao salvar perfil", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTrainer = async () => {
    if (!user) return;

    setRequestingTrainer(true);
    try {
      const { error: requestError } = await supabase
        .from("trainer_chat_requests")
        .insert({
          user_id: user.id,
          status: "pending",
        });

      if (requestError) throw requestError;

      const { error: updateError } = await supabase
        .from("user_goals")
        .update({
          trainer_requested: true,
          trainer_request_date: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setData(prev => ({ ...prev, trainer_requested: true }));
      toast({ title: "Solicitação enviada! Um profissional entrará em contato." });
    } catch (error) {
      console.error("Error requesting trainer:", error);
      toast({ title: "Erro ao enviar solicitação", variant: "destructive" });
    } finally {
      setRequestingTrainer(false);
    }
  };

  if (loadingGoals) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-lime" />
      </div>
    );
  }

  if (step > TOTAL_STEPS) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="px-4">
          <ProfileSummary
            data={data}
            onRequestTrainer={handleRequestTrainer}
            trainerRequested={data.trainer_requested}
            loading={requestingTrainer}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center gap-4">
        {step < TOTAL_STEPS && (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="flex-1">
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <motion.div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? "bg-lime" : "bg-muted"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right mt-1">
            {step} de {TOTAL_STEPS}
          </p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <GenderStep
              key="gender"
              value={data.gender}
              onChange={(v) => setData(prev => ({ ...prev, gender: v }))}
            />
          )}
          {step === 2 && (
            <AgeStep
              key="age"
              value={data.age}
              onChange={(v) => setData(prev => ({ ...prev, age: v }))}
            />
          )}
          {step === 3 && (
            <WeightStep
              key="weight"
              value={data.weight_kg}
              onChange={(v) => setData(prev => ({ ...prev, weight_kg: v }))}
            />
          )}
          {step === 4 && (
            <HeightStep
              key="height"
              value={data.height_cm}
              onChange={(v) => setData(prev => ({ ...prev, height_cm: v }))}
            />
          )}
          {step === 5 && (
            <GoalsStep
              key="goals"
              value={data.fitness_goals}
              onChange={(v) => setData(prev => ({ ...prev, fitness_goals: v }))}
            />
          )}
          {step === 6 && (
            <BodyTypeStep
              key="bodytype"
              value={data.body_type}
              onChange={(v) => setData(prev => ({ ...prev, body_type: v }))}
            />
          )}
          {step === 7 && (
            <TrainingLevelStep
              key="level"
              value={data.training_level}
              onChange={(v) => setData(prev => ({ ...prev, training_level: v }))}
            />
          )}
          {step === 8 && user && (
            <PhotoUploadStep
              key="photos"
              userId={user.id}
              photos={{
                front: data.photo_front_url,
                back: data.photo_back_url,
                left: data.photo_left_url,
                right: data.photo_right_url,
              }}
              onChange={(photos) => setData(prev => ({
                ...prev,
                photo_front_url: photos.front,
                photo_back_url: photos.back,
                photo_left_url: photos.left,
                photo_right_url: photos.right,
              }))}
              onSkip={() => setStep(9)}
            />
          )}
          {step === 9 && (
            <ReadyStep
              key="ready"
              onStart={handleComplete}
              loading={loading}
            />
          )}
        </AnimatePresence>
      </div>

      {step < TOTAL_STEPS && (
        <div className="p-4">
          <Button
            className="w-full bg-lime text-black hover:bg-lime/90 font-bold h-14"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
