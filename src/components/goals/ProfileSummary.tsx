import { motion } from "framer-motion";
import { User, Scale, Ruler, Target, Dumbbell, MessageCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileSummaryProps {
  data: {
    gender: string;
    age: number;
    weight_kg: number;
    height_cm: number;
    fitness_goals: string[];
    body_type: string;
    training_level: string;
    photo_front_url?: string;
    photo_back_url?: string;
    photo_left_url?: string;
    photo_right_url?: string;
  };
  onRequestTrainer: () => void;
  trainerRequested: boolean;
  loading: boolean;
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

export function ProfileSummary({ data, onRequestTrainer, trainerRequested, loading }: ProfileSummaryProps) {
  const hasPhotos = data.photo_front_url || data.photo_back_url || data.photo_left_url || data.photo_right_url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      {/* Header */}
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-lime to-lime/60 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <User className="w-10 h-10 text-black" />
        </motion.div>
        <h1 className="text-2xl font-black text-foreground">Sua Ficha Técnica</h1>
        <p className="text-muted-foreground text-sm">Resumo do seu perfil fitness</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 bg-blue/10 border-blue">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gênero</p>
                <p className="font-bold text-foreground">
                  {data.gender === "male" ? "Masculino" : "Feminino"}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 bg-purple/10 border-purple">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{data.age}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Idade</p>
                <p className="font-bold text-foreground">{data.age} anos</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 bg-lime/10 border-lime">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peso</p>
                <p className="font-bold text-foreground">{data.weight_kg} kg</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4 bg-orange/10 border-orange">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange rounded-lg flex items-center justify-center">
                <Ruler className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Altura</p>
                <p className="font-bold text-foreground">{data.height_cm} cm</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-lime" />
            <h3 className="font-bold text-foreground">Objetivos</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.fitness_goals.map((goal) => (
              <span
                key={goal}
                className="px-3 py-1 bg-lime/20 text-lime text-sm rounded-full font-medium"
              >
                {goalLabels[goal] || goal}
              </span>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Body Type & Level */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Biotipo</p>
            <p className="font-bold text-foreground">
              {bodyTypeLabels[data.body_type] || data.body_type}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Nível</p>
            <p className="font-bold text-foreground">
              {levelLabels[data.training_level] || data.training_level}
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Photos */}
      {hasPhotos && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="p-4">
            <h3 className="font-bold text-foreground mb-3">Fotos de Avaliação</h3>
            <div className="grid grid-cols-4 gap-2">
              {[
                { url: data.photo_front_url, label: "Frente" },
                { url: data.photo_back_url, label: "Costas" },
                { url: data.photo_left_url, label: "Esq." },
                { url: data.photo_right_url, label: "Dir." },
              ].map((photo, i) => (
                <div key={i} className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      {photo.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Trainer Request */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-lime/10 to-purple/10 border-lime/50">
          {trainerRequested ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-lime/20 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-lime" />
              </div>
              <h3 className="font-bold text-foreground">Aguardando Profissional</h3>
              <p className="text-sm text-muted-foreground">
                Nossos profissionais irão entrar em contato com você aqui com o seu treino personalizado mensal.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Dumbbell className="w-12 h-12 text-lime mx-auto" />
              <div>
                <h3 className="font-bold text-foreground">Pronto para começar?</h3>
                <p className="text-sm text-muted-foreground">
                  Chame um profissional para criar seu treino personalizado
                </p>
              </div>
              <Button
                className="w-full bg-lime text-black hover:bg-lime/90 font-bold h-12"
                onClick={onRequestTrainer}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chamar Professor
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
