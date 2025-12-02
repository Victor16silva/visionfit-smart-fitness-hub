import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Scale, Ruler, Target, Calendar, Dumbbell } from "lucide-react";

interface StudentGoals {
  gender?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  fitness_goals?: string[];
  body_type?: string;
  training_level?: string;
  photo_front_url?: string;
  photo_back_url?: string;
  photo_left_url?: string;
  photo_right_url?: string;
  trainer_request_date?: string;
  created_at?: string;
}

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    full_name: string;
    goals?: StudentGoals;
  } | null;
}

const goalLabels: Record<string, string> = {
  lose_weight: "Perder Peso",
  build_muscle: "Ganhar Massa",
  get_fit: "Condicionamento",
  increase_strength: "Força",
  flexibility: "Flexibilidade",
};

const bodyTypeLabels: Record<string, string> = {
  ectomorph: "Ectomorfo",
  mesomorph: "Mesomorfo",
  endomorph: "Endomorfo",
};

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export default function StudentReportModal({ isOpen, onClose, student }: StudentReportModalProps) {
  if (!student) return null;

  const goals = student.goals;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  // Calculate BMI
  const bmi = goals?.weight_kg && goals?.height_cm 
    ? (goals.weight_kg / Math.pow(goals.height_cm / 100, 2)).toFixed(1)
    : null;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-blue" };
    if (bmi < 25) return { label: "Peso normal", color: "text-lime" };
    if (bmi < 30) return { label: "Sobrepeso", color: "text-orange" };
    return { label: "Obesidade", color: "text-red-500" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime to-purple flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {student.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Relatório do Aluno
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Registration Info */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Data de Solicitação</span>
            </div>
            <p className="font-bold text-foreground">{formatDate(goals?.trainer_request_date)}</p>
          </Card>

          {/* Physical Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-blue/10 border-blue">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-blue" />
                <span className="text-xs text-muted-foreground">Gênero</span>
              </div>
              <p className="font-bold text-foreground">
                {goals?.gender === "male" ? "Masculino" : goals?.gender === "female" ? "Feminino" : "N/A"}
              </p>
            </Card>

            <Card className="p-4 bg-purple/10 border-purple">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple font-bold text-sm">{goals?.age || "-"}</span>
                <span className="text-xs text-muted-foreground">Idade</span>
              </div>
              <p className="font-bold text-foreground">{goals?.age || "-"} anos</p>
            </Card>

            <Card className="p-4 bg-lime/10 border-lime">
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-lime" />
                <span className="text-xs text-muted-foreground">Peso</span>
              </div>
              <p className="font-bold text-foreground">{goals?.weight_kg || "-"} kg</p>
            </Card>

            <Card className="p-4 bg-orange/10 border-orange">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-orange" />
                <span className="text-xs text-muted-foreground">Altura</span>
              </div>
              <p className="font-bold text-foreground">{goals?.height_cm || "-"} cm</p>
            </Card>
          </div>

          {/* BMI */}
          {bmi && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">IMC (Índice de Massa Corporal)</p>
                  <p className="text-2xl font-black text-foreground">{bmi}</p>
                </div>
                <Badge className={`${getBmiCategory(parseFloat(bmi)).color} bg-transparent border`}>
                  {getBmiCategory(parseFloat(bmi)).label}
                </Badge>
              </div>
            </Card>
          )}

          {/* Training Info */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Nível de Treino</p>
              <p className="font-bold text-foreground">
                {levelLabels[goals?.training_level || ""] || "Não informado"}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Biotipo</p>
              <p className="font-bold text-foreground">
                {bodyTypeLabels[goals?.body_type || ""] || "Não informado"}
              </p>
            </Card>
          </div>

          {/* Goals */}
          {goals?.fitness_goals && goals.fitness_goals.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-lime" />
                <h3 className="font-bold text-foreground">Objetivos do Aluno</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {goals.fitness_goals.map((goal) => (
                  <Badge
                    key={goal}
                    className="bg-lime/20 text-lime border-lime"
                  >
                    {goalLabels[goal] || goal}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Photos */}
          {(goals?.photo_front_url || goals?.photo_back_url || goals?.photo_left_url || goals?.photo_right_url) && (
            <Card className="p-4">
              <h3 className="font-bold text-foreground mb-3">Fotos de Avaliação</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { url: goals?.photo_front_url, label: "Frente" },
                  { url: goals?.photo_back_url, label: "Costas" },
                  { url: goals?.photo_left_url, label: "Esquerda" },
                  { url: goals?.photo_right_url, label: "Direita" },
                ].map((photo, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                      {photo.url ? (
                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{photo.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          <Card className="p-4 bg-gradient-to-br from-lime/10 to-purple/10">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-5 h-5 text-lime" />
              <h3 className="font-bold text-foreground">Recomendações</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {goals?.training_level === "beginner" && (
                <li>• Iniciar com treinos de baixa intensidade, 3x por semana</li>
              )}
              {goals?.training_level === "intermediate" && (
                <li>• Treinos de intensidade moderada, 4-5x por semana</li>
              )}
              {goals?.training_level === "advanced" && (
                <li>• Treinos de alta intensidade, 5-6x por semana</li>
              )}
              {goals?.fitness_goals?.includes("lose_weight") && (
                <li>• Incluir exercícios cardiovasculares e déficit calórico</li>
              )}
              {goals?.fitness_goals?.includes("build_muscle") && (
                <li>• Foco em treino de força com progressão de carga</li>
              )}
              {goals?.body_type === "ectomorph" && (
                <li>• Aumentar ingestão calórica e focar em compostos</li>
              )}
              {goals?.body_type === "endomorph" && (
                <li>• Incluir mais HIIT e controlar carboidratos</li>
              )}
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
