import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import SectionHeader from "@/components/SectionHeader";
import RecommendedWorkoutCard from "@/components/RecommendedWorkoutCard";
import WeeklyChallengeCard from "@/components/WeeklyChallengeCard";
import WarmupCard from "@/components/WarmupCard";
import BodyFocusItem from "@/components/BodyFocusItem";
import CurrentWorkoutCard from "@/components/CurrentWorkoutCard";
import PerformanceCalendar from "@/components/PerformanceCalendar";
import workoutDaily from "@/assets/workout-daily.jpg";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import workoutHiit from "@/assets/workout-hiit.jpg";
import workoutStretching from "@/assets/workout-stretching.jpg";
import muscleShoulders from "@/assets/muscle-shoulders.jpg";
import muscleChest from "@/assets/muscle-chest.jpg";
import muscleAbs from "@/assets/muscle-abs.jpg";
import muscleLegs from "@/assets/muscle-legs.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Victor';

  const recommendedWorkouts = [
    { id: "1", title: "Superior Peito Avançado", duration: "40 min", calories: "233", level: "Avançado", image: workoutFullbody, points: 50 },
    { id: "2", title: "Treino Diário", duration: "16 min", calories: "150", level: "Iniciante", image: workoutDaily, points: 20 },
    { id: "3", title: "HIIT Cardio", duration: "30 min", calories: "280", level: "Intermediário", image: workoutHiit, points: 35 },
  ];

  const muscleGroups = [
    { name: "Ombros", image: muscleShoulders, area: "ombros" },
    { name: "Peito", image: muscleChest, area: "peito" },
    { name: "Abdômen", image: muscleAbs, area: "abdomen" },
    { name: "Pernas", image: muscleLegs, area: "pernas" },
  ];

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
          <h2 className="text-2xl md:text-3xl font-bold mb-1">Olá, {userName}! 👋</h2>
          <p className="text-muted-foreground text-sm md:text-base">É hora de desafiar seus limites.</p>
        </div>

        {/* Current Workout */}
        <div className="mb-6">
          <CurrentWorkoutCard />
        </div>

        {/* Performance Calendar - Real-time */}
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
      </div>

      {/* Recommended Workouts */}
      <div className="px-4 mb-6">
        <SectionHeader 
          title="Recomendados" 
          actionText="Ver Todos"
          actionLink="/workouts"
        />
        <div className="mt-3">
          <RecommendedWorkoutCard workouts={recommendedWorkouts} />
        </div>
      </div>

      {/* Muscle Focus Area */}
      <div className="px-4 mb-6">
        <SectionHeader 
          title="Área de Foco" 
          actionText="Ver Todos"
          actionLink="/workouts"
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
        {/* Warmup Section */}
        <div className="mb-6 md:mb-0">
          <SectionHeader 
            title="Aquecimento" 
            actionText="Ver Mais"
            actionLink="/workouts/category/alongamento"
          />
          <div className="mt-3">
            <WarmupCard 
              title="Alongamento Pré-Treino"
              subtitle="10 min • Prepare seu corpo"
              image={workoutStretching}
              points={15}
            />
          </div>
        </div>

        {/* Weekly Challenge */}
        <div>
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
