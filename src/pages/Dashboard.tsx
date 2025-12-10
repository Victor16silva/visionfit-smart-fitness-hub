import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Search, Clock, Flame, ChevronLeft, ChevronRight, Heart, Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import SectionHeader from "@/components/SectionHeader";
import WeeklyChallengeCard from "@/components/WeeklyChallengeCard";
import BodyFocusItem from "@/components/BodyFocusItem";
import CurrentWorkoutCard from "@/components/CurrentWorkoutCard";
import PerformanceCalendar from "@/components/PerformanceCalendar";
import muscleShoulders from "@/assets/muscle-shoulders.jpg";
import muscleChest from "@/assets/muscle-chest.jpg";
import muscleAbs from "@/assets/muscle-abs.jpg";
import muscleLegs from "@/assets/muscle-legs.jpg";

interface WorkoutPlan {
  id: string;
  name: string;
  duration_minutes?: number;
  calories?: number;
  category?: string;
  cover_image_url?: string;
  muscle_groups: string[];
  is_recommended?: boolean;
  is_daily?: boolean;
  challenge_points?: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");

  const [recommendedWorkouts, setRecommendedWorkouts] = useState<WorkoutPlan[]>([]);
  const [warmupWorkouts, setWarmupWorkouts] = useState<WorkoutPlan[]>([]);
  const [currentRecommendedIndex, setCurrentRecommendedIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasWorkoutToday, setHasWorkoutToday] = useState(false);

  const muscleGroups = [
    { name: "Ombros", image: muscleShoulders, area: "ombros" },
    { name: "Peito", image: muscleChest, area: "peito" },
    { name: "Abdômen", image: muscleAbs, area: "abdomen" },
    { name: "Pernas", image: muscleLegs, area: "pernas" },
  ];

  useEffect(() => {
    loadWorkouts();
    loadUserRole();
    checkTodayWorkout();
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const role = roleData?.role || "";
      setUserRole(role);

      // Set display name based on role
      if (role === "master") {
        setDisplayName("Master");
      } else if (role === "admin") {
        setDisplayName("Admin");
      } else if (role === "personal") {
        setDisplayName("Personal");
      } else if (role === "nutritionist") {
        setDisplayName("Nutri");
      } else {
        // Use first name from profile for regular users
        const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';
        setDisplayName(firstName);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
      const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário';
      setDisplayName(firstName);
    }
  };

  const checkTodayWorkout = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('completed_at', today.toISOString())
        .limit(1);

      if (error) throw error;

      setHasWorkoutToday(logs && logs.length > 0);
    } catch (error) {
      console.error("Error checking today's workout:", error);
      setHasWorkoutToday(false);
    }
  };

  const loadWorkouts = async () => {
    try {
      // Load recommended workouts (visible to all users)
      const { data: recommended } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_recommended", true)
        .order("created_at", { ascending: false });

      setRecommendedWorkouts(recommended || []);

      // Load warmup/stretching workouts (category = alongamento, visible to all)
      const { data: warmups } = await supabase
        .from("workout_plans")
        .select("*")
        .eq("is_daily", true)
        .order("created_at", { ascending: false })
        .limit(3);

      setWarmupWorkouts(warmups || []);
    } catch (error) {
      console.error("Error loading workouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentRecommended = recommendedWorkouts[currentRecommendedIndex];

  const handlePrevRecommended = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRecommendedIndex((prev) => (prev === 0 ? recommendedWorkouts.length - 1 : prev - 1));
  };

  const handleNextRecommended = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentRecommendedIndex((prev) => (prev === recommendedWorkouts.length - 1 ? 0 : prev + 1));
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const getLevelFromCategory = (category?: string) => {
    if (category === "Hipertrofia") return "Intermediário";
    if (category === "Definição") return "Avançado";
    return "Iniciante";
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-lime tracking-tight">VISIONFIT</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/workouts")}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Search className="h-5 w-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-lime rounded-full border-2 border-background"></span>
            </button>
          </div>
        </div>
        
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Olá, {displayName}! 👋</h2>
          <p className="text-muted-foreground text-sm md:text-base">É hora de desafiar seus limites.</p>
        </div>

        {/* Current Workout */}
        <div className="mb-6">
          <CurrentWorkoutCard />
        </div>

        {/* Performance Calendar - Only show if there's a workout today */}
        {hasWorkoutToday && (
          <div className="mb-6">
            <SectionHeader
              title="Meu Desempenho"
              actionText="Ver Tudo"
              actionLink="/progress"
              showBar={false}
            />
            <div className="mt-3">
              <PerformanceCalendar />
            </div>
          </div>
        )}
      </div>

      {/* Recommended Workouts - Only show if there are workouts */}
      {recommendedWorkouts.length > 0 && currentRecommended && (
        <div className="px-4 mb-6">
          <SectionHeader 
            title="Recomendados" 
            actionText="Ver Todos"
            actionLink="/workouts"
          />
          <div className="mt-3">
            <div
              className="relative w-full h-48 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/workout-session/${currentRecommended.id}`)}
            >
              {currentRecommended.cover_image_url ? (
                <img
                  src={currentRecommended.cover_image_url}
                  alt={currentRecommended.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-lime/30 to-primary/20 flex items-center justify-center">
                  <Dumbbell className="h-16 w-16 text-lime/50" />
                </div>
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Points badge */}
              {currentRecommended.challenge_points && currentRecommended.challenge_points > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-lime/90 rounded-full">
                  <span className="text-xs font-bold text-black">🏆 +{currentRecommended.challenge_points} pts</span>
                </div>
              )}

              {/* Favorite button */}
              <button
                onClick={toggleFavorite}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <Heart 
                  className={`h-5 w-5 ${isFavorite ? 'fill-lime text-lime' : 'text-white'}`} 
                />
              </button>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-white font-bold text-lg mb-2">{currentRecommended.name}</h4>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{currentRecommended.duration_minutes || 40} min</span>
                    </div>
                    <div className="flex items-center gap-1 text-white/90 text-sm">
                      <Flame className="h-4 w-4" />
                      <span>{currentRecommended.calories || 200} kcal</span>
                    </div>
                  </div>

                  {/* Navigation arrows and level badge */}
                  <div className="flex items-center gap-2">
                    {recommendedWorkouts.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevRecommended}
                          className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 text-white" />
                        </button>
                        <button
                          onClick={handleNextRecommended}
                          className="w-8 h-8 rounded-full bg-lime flex items-center justify-center hover:bg-lime/90 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4 text-black" />
                        </button>
                      </>
                    )}
                    <span className="px-3 py-1 bg-lime text-black text-xs font-bold rounded-full ml-1">
                      {getLevelFromCategory(currentRecommended.category)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Carousel indicators */}
              {recommendedWorkouts.length > 1 && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {recommendedWorkouts.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentRecommendedIndex ? 'bg-lime w-4' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Muscle Focus Area */}
      <div className="px-4 mb-6">
        <SectionHeader 
          title="Área de Foco" 
          actionText="Ver Todos"
          actionLink="/body-focus"
        />
        <div className="flex gap-4 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:grid md:grid-cols-4 md:mx-0 md:px-0 md:overflow-visible">
          {muscleGroups.map((group, index) => (
            <BodyFocusItem
              key={index}
              name={group.name}
              imageUrl={group.image}
              area={group.area}
            />
          ))}
        </div>
      </div>

      {/* Warmup and Challenge Grid for larger screens */}
      <div className="px-4 pb-6 md:grid md:grid-cols-2 md:gap-6">
        {/* Warmup Section - Only show if there are warmups */}
        {warmupWorkouts.length > 0 && (
          <div className="mb-6 md:mb-0">
            <SectionHeader 
              title="Aquecimento" 
              actionText="Ver Mais"
              actionLink="/workouts"
            />
            <div className="mt-3">
              <div 
                className="relative rounded-2xl overflow-hidden cursor-pointer group h-32"
                onClick={() => navigate(`/workout-session/${warmupWorkouts[0].id}`)}
              >
                {warmupWorkouts[0].cover_image_url ? (
                  <img
                    src={warmupWorkouts[0].cover_image_url}
                    alt={warmupWorkouts[0].name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center">
                    <Dumbbell className="h-12 w-12 text-cyan-500/50" />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Points badge */}
                {warmupWorkouts[0].challenge_points && warmupWorkouts[0].challenge_points > 0 && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-lime/90 rounded-full">
                    <span className="text-xs font-bold text-black">+{warmupWorkouts[0].challenge_points} pts</span>
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="text-white font-bold text-base mb-0.5">{warmupWorkouts[0].name}</h4>
                  <p className="text-white/70 text-xs">{warmupWorkouts[0].duration_minutes || 10} min • Prepare seu corpo</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Challenge */}
        <div className={warmupWorkouts.length === 0 ? "col-span-full" : ""}>
          <SectionHeader 
            title="Desafio da Semana" 
            showBar={false}
          />
          <div className="mt-3">
            <WeeklyChallengeCard 
              title="Plank com Hip Twist"
              duration="7 dias"
              level="Intermediário"
              points={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
