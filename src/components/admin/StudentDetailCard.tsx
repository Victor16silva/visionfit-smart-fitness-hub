import { useState } from "react";
import { ChevronDown, ChevronUp, User, Calendar, Ruler, Weight, Target, Dumbbell, MessageCircle, FileText, Plus, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface StudentDetailCardProps {
  student: {
    id: string;
    full_name: string;
    email?: string;
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
      trainer_request_date?: string;
    };
    current_program_id?: string;
    current_program_name?: string;
  };
  onViewReport: (student: any) => void;
  onCreateProgram: (studentId: string) => void;
  onEditProgram?: (studentId: string) => void;
  onSendMessage: (student: any) => void;
}

export default function StudentDetailCard({ 
  student, 
  onViewReport, 
  onCreateProgram,
  onEditProgram,
  onSendMessage 
}: StudentDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | undefined }) => (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
      <Icon className="h-4 w-4 text-lime" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "Não informado"}</p>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-lime flex items-center justify-center">
              <span className="text-lg font-bold text-black">
                {student.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-foreground">{student.full_name}</h3>
              {student.current_program_name ? (
                <p className="text-xs text-lime">{student.current_program_name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Sem programa atribuído</p>
              )}
              {goals.trainer_request_date && (
                <Badge className="mt-1 bg-orange/20 text-orange text-xs">Aguardando atendimento</Badge>
              )}
            </div>
          </div>
          <button className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 animate-fade-in">
            {/* Photos */}
            {(goals.photo_front_url || goals.photo_back_url || goals.photo_left_url || goals.photo_right_url) && (
              <div className="grid grid-cols-4 gap-2">
                {goals.photo_front_url && (
                  <img src={goals.photo_front_url} alt="Frente" className="rounded-lg aspect-square object-cover" />
                )}
                {goals.photo_back_url && (
                  <img src={goals.photo_back_url} alt="Costas" className="rounded-lg aspect-square object-cover" />
                )}
                {goals.photo_left_url && (
                  <img src={goals.photo_left_url} alt="Esquerda" className="rounded-lg aspect-square object-cover" />
                )}
                {goals.photo_right_url && (
                  <img src={goals.photo_right_url} alt="Direita" className="rounded-lg aspect-square object-cover" />
                )}
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoItem icon={User} label="Gênero" value={goals.gender === "male" ? "Masculino" : goals.gender === "female" ? "Feminino" : goals.gender} />
              <InfoItem icon={Calendar} label="Idade" value={goals.age ? `${goals.age} anos` : undefined} />
              <InfoItem icon={Weight} label="Peso" value={goals.weight_kg ? `${goals.weight_kg} kg` : undefined} />
              <InfoItem icon={Ruler} label="Altura" value={goals.height_cm ? `${goals.height_cm} cm` : undefined} />
              <InfoItem icon={Target} label="Nível" value={getLevelLabel(goals.training_level)} />
              <InfoItem icon={Dumbbell} label="Biotipo" value={getBodyTypeLabel(goals.body_type)} />
            </div>

            {/* Fitness Goals */}
            {goals.fitness_goals && goals.fitness_goals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Objetivos</p>
                <div className="flex flex-wrap gap-1">
                  {goals.fitness_goals.map((goal) => (
                    <Badge key={goal} variant="secondary" className="text-xs">
                      {getGoalLabel(goal)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  if (student.current_program_id && onEditProgram) {
                    onEditProgram(student.id);
                  } else {
                    onCreateProgram(student.id);
                  }
                }}
              >
                {student.current_program_id ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Programa
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Programa
                  </>
                )}
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewReport(student);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Relatório
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 border-border text-foreground hover:bg-muted h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendMessage(student);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mensagem
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
