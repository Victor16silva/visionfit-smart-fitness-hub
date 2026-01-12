import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence } from "framer-motion";

import { GoalsGenderStep } from "@/components/goals/GoalsGenderStep";
import { GoalsAgeStep } from "@/components/goals/GoalsAgeStep";
import { GoalsWeightStep } from "@/components/goals/GoalsWeightStep";
import { GoalsHeightStep } from "@/components/goals/GoalsHeightStep";
import { GoalsBodyTypeStep } from "@/components/goals/GoalsBodyTypeStep";
import { GoalsTrainingLevelStep } from "@/components/goals/GoalsTrainingLevelStep";
import { GoalsFitnessStep } from "@/components/goals/GoalsFitnessStep";
import { GoalsPhotoStep } from "@/components/goals/GoalsPhotoStep";
import { GoalsSendStep } from "@/components/goals/GoalsSendStep";
import TrainerChat from "@/components/chat/TrainerChat";

const TOTAL_STEPS = 9;

export default function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [existingGoals, setExistingGoals] = useState<any>(null);
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [gender, setGender] = useState("");
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [bodyType, setBodyType] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>([]);
  const [photos, setPhotos] = useState({
    front: "",
    back: "",
    left: "",
    right: "",
  });
  const [trainerMessage, setTrainerMessage] = useState("");

  // Load existing goals
  useEffect(() => {
    if (user) {
      loadExistingGoals();
      checkChatRequest();
    }
  }, [user]);

  const loadExistingGoals = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setExistingGoals(data);
      setGender(data.gender || "");
      setAge(data.age || 25);
      setWeight(data.weight_kg || 70);
      setHeight(data.height_cm || 170);
      setBodyType(data.body_type || "");
      setTrainingLevel(data.training_level || "");
      setFitnessGoals(data.fitness_goals || []);
      setPhotos({
        front: data.photo_front_url || "",
        back: data.photo_back_url || "",
        left: data.photo_left_url || "",
        right: data.photo_right_url || "",
      });
      
      if (data.trainer_requested) {
        setSent(true);
      }
      // Always start from step 1 to allow editing
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setSent(false);
    setStep(1);
  };

  const checkChatRequest = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("trainer_chat_requests")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setChatRequestId(data.id);
    }
  };

  const handleNext = () => {
    if (step === 1 && !gender) {
      toast({ title: "Selecione seu gênero", variant: "destructive" });
      return;
    }
    if (step === 5 && !bodyType) {
      toast({ title: "Selecione seu biotipo", variant: "destructive" });
      return;
    }
    if (step === 6 && !trainingLevel) {
      toast({ title: "Selecione seu nível de treino", variant: "destructive" });
      return;
    }
    if (step === 7 && fitnessGoals.length === 0) {
      toast({ title: "Selecione pelo menos um objetivo", variant: "destructive" });
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

  const handleSendToTrainer = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save/update user goals
      const goalsData = {
        user_id: user.id,
        gender,
        age,
        weight_kg: weight,
        height_cm: height,
        body_type: bodyType,
        training_level: trainingLevel,
        fitness_goals: fitnessGoals,
        photo_front_url: photos.front || null,
        photo_back_url: photos.back || null,
        photo_left_url: photos.left || null,
        photo_right_url: photos.right || null,
        trainer_requested: true,
        trainer_request_date: new Date().toISOString(),
        onboarding_completed: true,
      };

      if (existingGoals) {
        await supabase
          .from("user_goals")
          .update(goalsData)
          .eq("user_id", user.id);
      } else {
        await supabase.from("user_goals").insert(goalsData);
      }

      // Create or update trainer chat request
      let reqId = chatRequestId;
      
      if (!reqId) {
        const { data: newRequest, error: requestError } = await supabase
          .from("trainer_chat_requests")
          .insert({
            user_id: user.id,
            status: "pending",
            notes: `Novo aluno solicitou treino personalizado.
            
Dados do aluno:
- Gênero: ${gender === "male" ? "Masculino" : "Feminino"}
- Idade: ${age} anos
- Peso: ${weight} kg
- Altura: ${height} cm
- Biotipo: ${bodyType}
- Nível: ${trainingLevel}
- Objetivos: ${fitnessGoals.join(", ")}

Mensagem do aluno: ${trainerMessage || "Nenhuma mensagem adicional"}`,
          })
          .select("id")
          .single();

        if (requestError) throw requestError;
        reqId = newRequest?.id;
        setChatRequestId(reqId);
      }

      // Send initial message if provided
      if (trainerMessage && reqId) {
        await supabase.from("trainer_messages").insert({
          request_id: reqId,
          sender_id: user.id,
          message: trainerMessage,
        });
      }

      setSent(true);
      toast({ title: "Informações enviadas com sucesso!" });
    } catch (error) {
      console.error("Error sending to trainer:", error);
      toast({ title: "Erro ao enviar informações", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1: return !!gender;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return !!bodyType;
      case 6: return !!trainingLevel;
      case 7: return fitnessGoals.length > 0;
      case 8: return true;
      default: return true;
    }
  };

  // Show summary screen if already sent and not editing
  if (sent && !isEditing && step === 1) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold flex-1">Meus Objetivos</h1>
          {chatRequestId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowChat(true)}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Summary Content */}
        <div className="flex-1 p-4 space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-lime/20 rounded-full flex items-center justify-center mb-3">
              <span className="text-3xl">✅</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Dados Enviados</h2>
            <p className="text-sm text-muted-foreground">
              Seu personal está analisando suas informações
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-2xl mb-1">{gender === "male" ? "♂" : "♀"}</p>
              <p className="text-xs text-muted-foreground">Gênero</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{age}</p>
              <p className="text-xs text-muted-foreground">Anos</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{weight}kg</p>
              <p className="text-xs text-muted-foreground">Peso</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{height}cm</p>
              <p className="text-xs text-muted-foreground">Altura</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Objetivos</p>
            <div className="flex flex-wrap gap-2">
              {fitnessGoals.map((goal) => (
                <span key={goal} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 space-y-2">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-14"
            onClick={() => setShowChat(true)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Abrir Chat com Personal
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleStartEditing}
          >
            ✏️ Editar Meus Dados
          </Button>
          <Button
            variant="ghost"
            className="w-full h-10"
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Trainer Chat Modal */}
        {user && (
          <TrainerChat
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            trainerId=""
            trainerName="Personal Trainer"
            userId={user.id}
            requestId={chatRequestId || undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Passo {step} de {TOTAL_STEPS}
          </p>
        </div>
        {chatRequestId && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowChat(true)}
            className="relative"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <GoalsGenderStep value={gender} onChange={setGender} />
          )}
          {step === 2 && (
            <GoalsAgeStep value={age} onChange={setAge} />
          )}
          {step === 3 && (
            <GoalsWeightStep value={weight} onChange={setWeight} />
          )}
          {step === 4 && (
            <GoalsHeightStep value={height} onChange={setHeight} />
          )}
          {step === 5 && (
            <GoalsBodyTypeStep value={bodyType} onChange={setBodyType} />
          )}
          {step === 6 && (
            <GoalsTrainingLevelStep value={trainingLevel} onChange={setTrainingLevel} />
          )}
          {step === 7 && (
            <GoalsFitnessStep value={fitnessGoals} onChange={setFitnessGoals} />
          )}
          {step === 8 && (
            <GoalsPhotoStep photos={photos} onChange={setPhotos} />
          )}
          {step === 9 && (
            <GoalsSendStep
              message={trainerMessage}
              onMessageChange={setTrainerMessage}
              onSend={handleSendToTrainer}
              loading={loading}
              sent={sent}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {step < TOTAL_STEPS && !sent && (
        <div className="p-4">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-14"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            Continuar
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}

      {/* Footer for step 9 after sending while editing */}
      {sent && step === 9 && (
        <div className="p-4 space-y-2">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-14"
            onClick={() => setShowChat(true)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Abrir Chat com Personal
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao Dashboard
          </Button>
        </div>
      )}

      {/* Trainer Chat Modal */}
      {user && (
        <TrainerChat
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          trainerId=""
          trainerName="Personal Trainer"
          userId={user.id}
          requestId={chatRequestId || undefined}
        />
      )}
    </div>
  );
}
