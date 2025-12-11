import { X, User, Calendar, Ruler, Weight, Target, Dumbbell, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    full_name: string;
    goals?: {
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
    };
    current_program_name?: string;
  } | null;
}

export default function StudentReportModal({ isOpen, onClose, student }: StudentReportModalProps) {
  if (!isOpen || !student) return null;

  const goals = student.goals || {};

  const getGoalLabel = (goalId: string) => {
    const labels: Record<string, string> = {
      lose_weight: "Perder Peso",
      build_muscle: "Ganhar Massa",
      get_fit: "Condicionamento",
      increase_strength: "Força",
      flexibility: "Flexibilidade",
    };
    return labels[goalId] || goalId;
  };

  const getLevelLabel = (level: string | undefined) => {
    if (!level) return "Não informado";
    const labels: Record<string, string> = {
      beginner: "Iniciante",
      intermediate: "Intermediário",
      advanced: "Avançado",
    };
    return labels[level] || level;
  };

  const getBodyTypeLabel = (type: string | undefined) => {
    if (!type) return "Não informado";
    const labels: Record<string, string> = {
      ectomorph: "Ectomorfo",
      mesomorph: "Mesomorfo",
      endomorph: "Endomorfo",
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-xl font-bold text-foreground">Relatório do Aluno</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-lime flex items-center justify-center">
              <span className="text-2xl font-bold text-black">
                {student.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{student.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.current_program_name || "Sem programa atribuído"}
              </p>
            </div>
          </div>

          {/* Photos */}
          {(goals.photo_front_url || goals.photo_back_url || goals.photo_left_url || goals.photo_right_url) && (
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-lime" />
                Fotos de Avaliação
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {goals.photo_front_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Frente</p>
                    <img src={goals.photo_front_url} alt="Frente" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                )}
                {goals.photo_back_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Costas</p>
                    <img src={goals.photo_back_url} alt="Costas" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                )}
                {goals.photo_left_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lateral Esq.</p>
                    <img src={goals.photo_left_url} alt="Esquerda" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                )}
                {goals.photo_right_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lateral Dir.</p>
                    <img src={goals.photo_right_url} alt="Direita" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-lime" />
              Informações Básicas
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Gênero</p>
                <p className="font-medium text-foreground">
                  {goals.gender === "male" ? "Masculino" : goals.gender === "female" ? "Feminino" : goals.gender || "Não informado"}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Idade</p>
                <p className="font-medium text-foreground">{goals.age ? `${goals.age} anos` : "Não informado"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-medium text-foreground">{goals.weight_kg ? `${goals.weight_kg} kg` : "Não informado"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Altura</p>
                <p className="font-medium text-foreground">{goals.height_cm ? `${goals.height_cm} cm` : "Não informado"}</p>
              </div>
            </div>
          </div>

          {/* Training Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-lime" />
              Informações de Treino
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Nível</p>
                <p className="font-medium text-foreground">{getLevelLabel(goals.training_level)}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Biotipo</p>
                <p className="font-medium text-foreground">{getBodyTypeLabel(goals.body_type)}</p>
              </div>
            </div>
          </div>

          {/* Goals */}
          {goals.fitness_goals && goals.fitness_goals.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-lime" />
                Objetivos
              </h4>
              <div className="flex flex-wrap gap-2">
                {goals.fitness_goals.map((goal) => (
                  <span key={goal} className="px-3 py-1.5 bg-lime/20 text-lime rounded-full text-sm font-medium">
                    {getGoalLabel(goal)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border sticky bottom-0 bg-card">
          <Button 
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
