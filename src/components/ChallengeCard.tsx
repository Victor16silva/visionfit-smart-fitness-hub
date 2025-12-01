import { Trophy, Users, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  participants?: number;
  daysLeft: number;
  progress?: number;
  rewardPoints: number;
  imageUrl?: string;
  isActive?: boolean;
}

export default function ChallengeCard({
  id,
  title,
  description,
  participants = 0,
  daysLeft,
  progress = 0,
  rewardPoints,
  imageUrl,
  isActive = false
}: ChallengeCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange/20 to-orange/5 border-orange/30 cursor-pointer group"
      onClick={() => navigate(`/challenges/${id}`)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-orange transition-colors" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          {participants > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participants}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{daysLeft} dias restantes</span>
          </div>
          <div className="flex items-center gap-1 text-orange">
            <Trophy className="w-4 h-4" />
            <span>{rewardPoints} pts</span>
          </div>
        </div>
        
        {/* Progress */}
        {isActive && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-orange font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-muted" />
          </div>
        )}
        
        {/* CTA */}
        {!isActive && (
          <Button 
            className="w-full mt-3 bg-orange hover:bg-orange/90 text-black font-medium"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/challenges/${id}/join`);
            }}
          >
            Participar do Desafio
          </Button>
        )}
      </div>
    </Card>
  );
}
