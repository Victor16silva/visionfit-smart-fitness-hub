import { X } from "lucide-react";

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
  } | null;
}

export default function StudentReportModal({
  isOpen,
  onClose,
  student,
}: StudentReportModalProps) {
  if (!isOpen || !student) return null;

  const goals = student.goals;
  const bmi = goals?.weight_kg && goals?.height_cm
    ? (goals.weight_kg / Math.pow(goals.height_cm / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Relatório - {student.full_name}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Body metrics */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">
              Dados Corporais
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Idade</p>
                <p className="text-lg font-bold text-foreground">
                  {goals?.age || "-"} anos
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Peso</p>
                <p className="text-lg font-bold text-foreground">
                  {goals?.weight_kg || "-"} kg
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Altura</p>
                <p className="text-lg font-bold text-foreground">
                  {goals?.height_cm || "-"} cm
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">IMC</p>
                <p className="text-lg font-bold text-foreground">
                  {bmi || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">
              Informações Pessoais
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Gênero</span>
                <span className="text-sm font-medium text-foreground">
                  {goals?.gender === "male"
                    ? "Masculino"
                    : goals?.gender === "female"
                    ? "Feminino"
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Biotipo</span>
                <span className="text-sm font-medium text-foreground">
                  {goals?.body_type || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  Nível de Treino
                </span>
                <span className="text-sm font-medium text-foreground">
                  {goals?.training_level || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Fitness goals */}
          {goals?.fitness_goals && goals.fitness_goals.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                Objetivos
              </h3>
              <div className="flex flex-wrap gap-2">
                {goals.fitness_goals.map((goal, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-lime/20 text-lime rounded-full text-xs font-medium"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">
              Fotos de Referência
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {goals?.photo_front_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Frente</p>
                  <img
                    src={goals.photo_front_url}
                    alt="Frente"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                </div>
              )}
              {goals?.photo_back_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Costas</p>
                  <img
                    src={goals.photo_back_url}
                    alt="Costas"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                </div>
              )}
              {goals?.photo_left_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Lateral Esquerda
                  </p>
                  <img
                    src={goals.photo_left_url}
                    alt="Lateral Esquerda"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                </div>
              )}
              {goals?.photo_right_url && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Lateral Direita
                  </p>
                  <img
                    src={goals.photo_right_url}
                    alt="Lateral Direita"
                    className="w-full aspect-[3/4] object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            {!goals?.photo_front_url &&
              !goals?.photo_back_url &&
              !goals?.photo_left_url &&
              !goals?.photo_right_url && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma foto disponível
                </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
