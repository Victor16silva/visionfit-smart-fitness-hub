import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Star, Trophy, Flame } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { supabase } from "@/integrations/supabase/client";
import workoutFullbody from "@/assets/workout-fullbody.jpg";

const categories = ["Todos", "Força", "Cardio", "Flexibilidade"];

interface Challenge {
  id: string;
  title: string;
  duration: number;
  points: number;
  level: string;
  imageUrl: string;
  category: string;
  isFeatured?: boolean;
}

const categoryAliases: Record<string, string> = {
  força: "Força",
  forca: "Força",
  strength: "Força",
  cardio: "Cardio",
  flexibilidade: "Flexibilidade",
  stretching: "Flexibilidade",
};

function mapCategory(raw?: string | null): string {
  if (!raw) return "Força";
  return categoryAliases[raw.toLowerCase()] || raw;
}

export default function Challenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadChallenges();
  }, [user, navigate]);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from("workout_plans")
        .select("id, name, duration_minutes, challenge_points, category, cover_image_url, is_challenge")
        .eq("is_challenge", true)
        .eq("is_active", true)
        .order("challenge_points", { ascending: false });

      if (error) throw error;

      setChallenges(
        (data || []).map((plan, index) => ({
          id: plan.id,
          title: plan.name,
          duration: plan.duration_minutes || 30,
          points: plan.challenge_points || 0,
          level: plan.category || "Intermediário",
          imageUrl: plan.cover_image_url || workoutFullbody,
          category: mapCategory(plan.category),
          isFeatured: index === 0,
        }))
      );
    } catch (error) {
      console.error("Error loading challenges:", error);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const featuredChallenge = challenges.find((item) => item.isFeatured) || challenges[0];
  const filteredChallenges = challenges.filter((item) => {
    if (featuredChallenge && item.id === featuredChallenge.id) return false;
    if (selectedCategory === "Todos") return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black text-foreground mb-2">Desafios</h1>
        <p className="text-muted-foreground">Supere seus limites e ganhe recompensas</p>
      </div>

      {featuredChallenge && (
        <div className="px-4 mb-6">
          <Card
            className="relative overflow-hidden rounded-2xl border-0 cursor-pointer"
            onClick={() => navigate(`/workout/${featuredChallenge.id}`)}
          >
            <div className="relative h-[200px]">
              <img
                src={featuredChallenge.imageUrl}
                alt={featuredChallenge.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="absolute top-4 left-4">
                <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                  <Flame className="h-3.5 w-3.5 mr-1" />
                  EM DESTAQUE
                </Badge>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-2xl font-black text-white mb-3">{featuredChallenge.title}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-white/90 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{featuredChallenge.duration} min</span>
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
      )}

      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
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

      <div className="px-4">
        <SectionHeader title="Todos os Desafios" />

        {loading ? (
          <div className="space-y-3 mt-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 mt-4">
            <div className="w-20 h-20 rounded-full bg-card-hover flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum desafio disponível</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filteredChallenges.map((challenge) => (
              <Card
                key={challenge.id}
                className="overflow-hidden border-border cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => navigate(`/workout/${challenge.id}`)}
              >
                <div className="flex">
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="w-24 h-24 object-cover"
                  />
                  <div className="p-3 flex-1">
                    <h3 className="font-bold text-foreground">{challenge.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {challenge.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400" />
                        {challenge.points} pts
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
