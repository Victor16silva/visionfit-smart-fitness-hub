import { Trophy, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WeeklyChallengeProps {
  title: string;
  duration: string;
  level: string;
  points: number;
}

export default function WeeklyChallengeCard({ 
  title, 
  duration, 
  level, 
  points 
}: WeeklyChallengeProps) {
  const navigate = useNavigate();

  return (
    <div 
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      onClick={() => navigate("/challenges")}
      style={{
        background: 'linear-gradient(135deg, hsl(280 70% 50%) 0%, hsl(320 80% 60%) 50%, hsl(280 70% 50%) 100%)'
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-lime" />
              </div>
              <span className="text-xs font-medium text-white/80">Desafio Semanal</span>
            </div>

            {/* Title */}
            <h4 className="text-white font-bold text-lg mb-3">{title}</h4>

            {/* Info badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full">
                <Clock className="h-3.5 w-3.5 text-white" />
                <span className="text-xs text-white">{duration}</span>
              </div>
              <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs text-white">
                {level}
              </span>
              <span className="px-2.5 py-1 bg-lime text-black text-xs font-bold rounded-full">
                +{points} pts
              </span>
            </div>
          </div>

          {/* Arrow button */}
          <button className="w-10 h-10 rounded-full bg-lime flex items-center justify-center group-hover:scale-110 transition-transform">
            <ChevronRight className="h-5 w-5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
