import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, Plus, Send, Calendar, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

interface StudentDetailCardProps {
  student: {
    id: string;
    full_name: string;
    email?: string;
    goals?: StudentGoals;
    current_program_id?: string;
    current_program_name?: string;
  };
  onViewReport: (studentId: string) => void;
  onCreateProgram: (studentId: string) => void;
  onEditProgram: (studentId: string, programId: string) => void;
  onSendMessage: (studentId: string) => void;
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

export default function StudentDetailCard({ 
  student, 
  onViewReport,
  onCreateProgram,
  onEditProgram,
  onSendMessage
}: StudentDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const goals = student.goals;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime to-purple flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {student.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{student.full_name}</h3>
                <Badge variant="outline" className="bg-lime/10 text-lime border-lime text-xs">
                  Aluno
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Solicitou em: {formatDate(goals?.trainer_request_date)}
              </p>
              {student.current_program_name ? (
                <p className="text-xs text-lime font-medium">
                  Programa: {student.current_program_name}
                </p>
              ) : (
                <p className="text-xs text-orange font-medium">
                  Sem programa atribuído
                </p>
              )}
            </div>
          </div>
          <button className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>

        {/* Expanded content */}
        {isExpanded && goals && (
          <div className="px-4 pb-4 space-y-4 animate-fade-in">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Idade</p>
                <p className="font-bold text-foreground">{goals.age || "-"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-bold text-foreground">{goals.weight_kg ? `${goals.weight_kg}kg` : "-"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Altura</p>
                <p className="font-bold text-foreground">{goals.height_cm ? `${goals.height_cm}cm` : "-"}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Nível</p>
                <p className="font-bold text-foreground text-xs">{levelLabels[goals.training_level || ""] || "-"}</p>
              </div>
            </div>

            {/* Goals */}
            {goals.fitness_goals && goals.fitness_goals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Objetivos</p>
                <div className="flex flex-wrap gap-1">
                  {goals.fitness_goals.map((goal) => (
                    <Badge key={goal} variant="secondary" className="text-xs">
                      {goalLabels[goal] || goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Body Type */}
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Biotipo</p>
                <p className="text-sm font-medium text-foreground">
                  {bodyTypeLabels[goals.body_type || ""] || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gênero</p>
                <p className="text-sm font-medium text-foreground">
                  {goals.gender === "male" ? "Masculino" : goals.gender === "female" ? "Feminino" : "Não informado"}
                </p>
              </div>
            </div>

            {/* Photos Preview */}
            {(goals.photo_front_url || goals.photo_back_url || goals.photo_left_url || goals.photo_right_url) && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Fotos de Avaliação</p>
                <div className="grid grid-cols-4 gap-1">
                  {[goals.photo_front_url, goals.photo_back_url, goals.photo_left_url, goals.photo_right_url].map((url, i) => (
                    <div key={i} className="aspect-[3/4] bg-muted rounded overflow-hidden">
                      {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <Button 
                className="w-full bg-blue text-white font-bold hover:bg-blue/90 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReport(student.id);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </Button>
              
              {student.current_program_id ? (
                <Button 
                  className="w-full bg-purple text-white font-bold hover:bg-purple/90 h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProgram(student.id, student.current_program_id!);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Programa de Treino
                </Button>
              ) : (
                <Button 
                  className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateProgram(student.id);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Criar Programa de Treino
                </Button>
              )}
              
              <Button 
                variant="outline"
                className="w-full border-orange text-orange font-bold hover:bg-orange/10 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMessage(student.id);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
