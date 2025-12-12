import { useState } from "react";
import { ChevronDown, ChevronUp, User, MessageCircle, FileText, Plus, Edit, Calendar } from "lucide-react";
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
  onViewReport: (studentId: string) => void;
  onCreateProgram: (studentId: string) => void;
  onEditProgram: (studentId: string, programId: string) => void;
  onSendMessage: (studentId: string) => void;
}

export default function StudentDetailCard({
  student,
  onViewReport,
  onCreateProgram,
  onEditProgram,
  onSendMessage
}: StudentDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "Não informado"}</p>
    </div>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não informado";
    return new Date(dateString).toLocaleDateString('pt-BR');
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
            <div className="w-11 h-11 rounded-full bg-lime/20 flex items-center justify-center">
              <span className="text-lg font-bold text-lime">
                {student.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{student.full_name}</h3>
                {student.current_program_id && (
                  <Badge className="bg-lime/20 text-lime text-xs">Programa Ativo</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{student.email || "Sem email"}</p>
              {student.goals?.trainer_request_date && (
                <p className="text-xs text-muted-foreground">
                  Solicitou em: {formatDate(student.goals.trainer_request_date)}
                </p>
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
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <InfoItem label="Gênero" value={student.goals?.gender} />
              <InfoItem label="Idade" value={student.goals?.age} />
              <InfoItem label="Peso" value={student.goals?.weight_kg ? `${student.goals.weight_kg} kg` : undefined} />
              <InfoItem label="Altura" value={student.goals?.height_cm ? `${student.goals.height_cm} cm` : undefined} />
              <InfoItem label="Biotipo" value={student.goals?.body_type} />
              <InfoItem label="Nível" value={student.goals?.training_level} />
            </div>

            {/* Fitness Goals */}
            {student.goals?.fitness_goals && student.goals.fitness_goals.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Objetivos de Fitness</p>
                <div className="flex flex-wrap gap-2">
                  {student.goals.fitness_goals.map((goal, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Current Program */}
            {student.current_program_id && student.current_program_name && (
              <div className="bg-lime/10 rounded-lg p-3 border border-lime/30">
                <p className="text-xs text-muted-foreground mb-1">Programa Atual</p>
                <p className="text-sm font-medium text-foreground">{student.current_program_name}</p>
              </div>
            )}

            {/* Photos */}
            {(student.goals?.photo_front_url || student.goals?.photo_back_url ||
              student.goals?.photo_left_url || student.goals?.photo_right_url) && (
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Fotos do Perfil</p>
                <div className="grid grid-cols-4 gap-2">
                  {student.goals.photo_front_url && (
                    <img
                      src={student.goals.photo_front_url}
                      alt="Frente"
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                  {student.goals.photo_back_url && (
                    <img
                      src={student.goals.photo_back_url}
                      alt="Costas"
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                  {student.goals.photo_left_url && (
                    <img
                      src={student.goals.photo_left_url}
                      alt="Esquerda"
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                  {student.goals.photo_right_url && (
                    <img
                      src={student.goals.photo_right_url}
                      alt="Direita"
                      className="w-full h-20 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendMessage(student.id);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>

              {student.current_program_id ? (
                <Button
                  variant="outline"
                  className="w-full border-lime/50 text-lime hover:bg-lime/10 h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProgram(student.id, student.current_program_id!);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Programa
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-purple/50 text-purple hover:bg-purple/10 h-11"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateProgram(student.id);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Programa
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReport(student.id);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
