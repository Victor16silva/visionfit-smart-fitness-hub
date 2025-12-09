import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserDetailCardProps {
  user: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    role?: string;
    workouts_count?: number;
    gender?: string;
    age?: number;
    weight_kg?: number;
    height?: number;
    level?: string;
    biotype?: string;
    is_active?: boolean;
  };
  onAssignWorkout: (userId: string) => void;
  onCreateWorkout: (userId: string) => void;
  onMakeAdmin: (userId: string) => void;
  onMakeTrainer?: (userId: string) => void;
  onMakeMaster?: (userId: string) => void;
  onToggleActive?: (userId: string, isActive: boolean) => void;
}

export default function UserDetailCard({
  user,
  onAssignWorkout,
  onCreateWorkout,
  onMakeAdmin,
  onMakeTrainer,
  onMakeMaster,
  onToggleActive
}: UserDetailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      master: "bg-purple text-white",
      admin: "bg-orange text-white",
      personal: "bg-blue text-white",
      user: "bg-muted text-foreground"
    };
    return variants[role] || variants.user;
  };

  const InfoItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="bg-muted/50 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "Não informado"}</p>
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
            <div className="w-11 h-11 rounded-full bg-purple flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {user.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">{user.full_name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadge(user.role || "user")}`}>
                  {(user.role || "user").charAt(0).toUpperCase() + (user.role || "user").slice(1)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${user.is_active !== false ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                  {user.is_active !== false ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">{user.workouts_count || 0} treinos atribuídos</p>
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
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Telefone" value={user.phone} />
              <InfoItem label="Gênero" value={user.gender} />
              <InfoItem label="Idade" value={user.age} />
              <InfoItem label="Peso" value={user.weight_kg ? `${user.weight_kg} kg` : undefined} />
              <InfoItem label="Altura" value={user.height ? `${user.height} cm` : undefined} />
              <InfoItem label="Nível" value={user.level} />
              <InfoItem label="Biotipo" value={user.biotype} />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssignWorkout(user.id);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Atribuir Treino Existente
              </Button>
              <Button
                className="w-full bg-purple text-white font-bold hover:bg-purple/90 h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateWorkout(user.id);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Treino Personalizado
              </Button>
              {/* Role Assignment Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-500 text-orange-500 font-bold hover:bg-orange-500/10 h-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMakeAdmin(user.id);
                  }}
                >
                  Admin
                </Button>
                {onMakeTrainer && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-500 font-bold hover:bg-blue-500/10 h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMakeTrainer(user.id);
                    }}
                  >
                    Trainer
                  </Button>
                )}
                {onMakeMaster && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple text-purple font-bold hover:bg-purple/10 h-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMakeMaster(user.id);
                    }}
                  >
                    Master
                  </Button>
                )}
              </div>

              {/* Active/Inactive Toggle */}
              {onToggleActive && (
                <Button
                  variant="outline"
                  className={`w-full font-bold h-11 ${
                    user.is_active !== false
                      ? "border-red-500 text-red-500 hover:bg-red-500/10"
                      : "border-green-500 text-green-500 hover:bg-green-500/10"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleActive(user.id, user.is_active !== false);
                  }}
                >
                  {user.is_active !== false ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Desativar Usuário
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Ativar Usuário
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
