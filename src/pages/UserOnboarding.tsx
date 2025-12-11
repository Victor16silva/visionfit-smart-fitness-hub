import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

export default function UserOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<string>("");
  const [age, setAge] = useState<number>(35);
  const [weight, setWeight] = useState<number>(54);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Step 1: Gender */}
        {step === 1 && (
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">Tell us about yourself!</h1>
              <p className="text-muted-foreground text-sm">
                This will help us create a better experience tailored to your gender
              </p>
            </div>

            <RadioGroup value={gender} onValueChange={setGender} className="space-y-4">
              <div
                onClick={() => setGender("male")}
                className={`flex items-center justify-center h-32 w-32 mx-auto rounded-full cursor-pointer transition-all ${
                  gender === "male"
                    ? "bg-red-500 scale-110"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <div className="text-center">
                  <span className="text-4xl">♂</span>
                  <p className="text-sm font-semibold mt-2">Male</p>
                </div>
              </div>

              <div
                onClick={() => setGender("female")}
                className={`flex items-center justify-center h-32 w-32 mx-auto rounded-full cursor-pointer transition-all ${
                  gender === "female"
                    ? "bg-red-500 scale-110"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                <div className="text-center">
                  <span className="text-4xl">♀</span>
                  <p className="text-sm font-semibold mt-2">Female</p>
                </div>
              </div>
            </RadioGroup>

            <Button
              onClick={handleNext}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Step 2: Age */}
        {step === 2 && (
          <div className="text-center space-y-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(1)}
              className="absolute top-4 left-4 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold mb-2">How old are you?</h1>
              <p className="text-muted-foreground text-sm">
                This helps us craft the perfect plan
              </p>
            </div>

            <div className="relative h-64 flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-6xl font-bold text-muted-foreground opacity-30">
                  {age - 1}
                </div>
                <div className="text-6xl font-bold my-4">{age}</div>
                <div className="text-6xl font-bold text-muted-foreground opacity-30">
                  {age + 1}
                </div>
              </div>
              <input
                type="range"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="absolute w-full opacity-0 cursor-pointer"
              />
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              Next →
            </Button>
          </div>
        )}

        {/* Step 3: Weight */}
        {step === 3 && (
          <div className="text-center space-y-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setStep(2)}
              className="absolute top-4 left-4 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold mb-2">What's your weight?</h1>
              <p className="text-muted-foreground text-sm">
                You can always change this later
              </p>
            </div>

            <div className="relative h-64 flex items-center justify-center">
              <div className="text-6xl font-bold">
                {weight}
                <span className="text-2xl text-muted-foreground ml-2">kg</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-32">
                <div className="flex justify-center items-end h-full space-x-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 transition-all ${
                        i === 10 ? "h-16 bg-red-500" : "h-8 bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="40"
                max="150"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="absolute w-full opacity-0 cursor-pointer"
              />
            </div>

            <Button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white rounded-full"
            >
              {loading ? "Salvando..." : "Next →"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}