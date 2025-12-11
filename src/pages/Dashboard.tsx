import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import SectionHeader from "@/components/SectionHeader";
import RecommendedWorkoutCard from "@/components/RecommendedWorkoutCard";
import WeeklyChallengeCard from "@/components/WeeklyChallengeCard";
import WarmupCard from "@/components/WarmupCard";
import BodyFocusItem from "@/components/BodyFocusItem";
import CurrentWorkoutCard from "@/components/CurrentWorkoutCard";
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

  const weekDays = [
    { day: "Seg", date: 1, active: true },
    { day: "Ter", date: 2, active: false },
    { day: "Qua", date: 3, active: false },
    { day: "Qui", date: 4, active: false },
    { day: "Sex", date: 5, active: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-lime tracking-tight">VISIONFIT</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/workouts")}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-hover transition-colors"
            >
              <Search className="h-5 w-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-hover transition-colors relative">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-lime rounded-full border-2 border-background"></span>
            </button>
          </div>
        </div>
        
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Olá, {userName}! 👋</h2>
          <p className="text-muted-foreground text-sm">É hora de desafiar seus limites.</p>
        </div>

        {/* Current Workout - NEW SECTION */}
        <div className="mb-6">
          <CurrentWorkoutCard />
        </div>

        {/* Performance - Week Days */}
        <div className="mb-6">
          <SectionHeader 
            title="Meu Desempenho" 
            actionText="Ver Tudo"
            actionLink="/progress"
            showBar={false}
          />
          <div className="flex gap-2 mt-3">
            {weekDays.map((item, index) => (
              <button
                key={index}
                className={`flex-1 py-3 rounded-xl text-center transition-all ${
                  item.active 
                    ? 'bg-lime text-black' 
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                <div className="text-xs opacity-70 mb-0.5">{item.day}</div>
                <div className="text-xl font-bold">{item.date}</div>
              </button>
            ))}
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
        <div className="flex gap-4 mt-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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

      {/* Warmup Section */}
      <div className="px-4 mb-6">
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
      <div className="px-4 pb-6">
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
  );
}
