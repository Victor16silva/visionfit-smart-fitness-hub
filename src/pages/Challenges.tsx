import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Trophy, Flame } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import workoutFullbody from "@/assets/workout-fullbody.jpg";

const categories = ["Todos", "Força", "Cardio", "Flexibilidade"];

interface Challenge {
  id: string;
  title: string;
  duration: number;
  points: number;
  level: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  const featuredChallenge: Challenge = {
    id: "featured",
    title: "Desafio 30 Dias",
    duration: 30,
    points: 500,
    level: "Intermediário",
    imageUrl: workoutFullbody,
    isFeatured: true
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">Desafios</h1>
        <p className="text-muted-foreground">Supere seus limites e ganhe recompensas</p>
      </div>

      {/* Featured Challenge */}
      <div className="px-4 mb-6">
        <Card className="relative overflow-hidden rounded-2xl border-0">
          <div className="relative h-[200px]">
            <img 
              src={featuredChallenge.imageUrl} 
              alt={featuredChallenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            {/* Featured Badge */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                <Flame className="h-3.5 w-3.5 mr-1" />
                EM DESTAQUE
              </Badge>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-2xl font-black text-white mb-3">{featuredChallenge.title}</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{featuredChallenge.duration} dias</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90 text-sm">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{featuredChallenge.points} pts</span>
                </div>
                <Badge className="bg-card-hover text-foreground border-0 font-medium">
                  {featuredChallenge.level}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Filters */}
      <div className="px-4 mb-6">
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:border-primary/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* All Challenges */}
      <div className="px-4">
        <SectionHeader title="Todos os Desafios" />
        
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 mt-4">
          <div className="w-20 h-20 rounded-full bg-card-hover flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhum desafio disponível</p>
        </div>
      </div>
    </div>
  );
}
