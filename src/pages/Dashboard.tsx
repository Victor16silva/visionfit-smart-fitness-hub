import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, User, Trophy, Clock, Flame } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import PerformanceCalendar from "@/components/PerformanceCalendar";
import workoutDaily from "@/assets/workout-daily.jpg";
import workoutFullbody from "@/assets/workout-fullbody.jpg";
import workoutHiit from "@/assets/workout-hiit.jpg";
import workoutStretching from "@/assets/workout-stretching.jpg";
import muscleShoulders from "@/assets/muscle-shoulders.jpg";
import muscleChest from "@/assets/muscle-chest.jpg";
import muscleAbs from "@/assets/muscle-abs.jpg";
import muscleLegs from "@/assets/muscle-legs.jpg";
import muscleBack from "@/assets/muscle-back.jpg";
import muscleArms from "@/assets/muscle-arms.jpg";
import mealSalad1 from "@/assets/meal-salad1.jpg";
import mealSalad2 from "@/assets/meal-salad2.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'victor';

  const recommendedWorkouts = [
    { title: "Treino Diário", duration: "16 min", calories: "150 kcal", level: "Iniciante", image: workoutDaily },
    { title: "Full Body", duration: "45 min", calories: "350 kcal", level: "Intermediário", image: workoutFullbody },
    { title: "HIIT Cardio", duration: "30 min", calories: "280 kcal", level: "Avançado", image: workoutHiit },
    { title: "Alongamentos", duration: "20 min", calories: "80 kcal", level: "Iniciante", image: workoutStretching },
  ];

  const muscleGroups = [
    { name: "Ombros", image: muscleShoulders },
    { name: "Peito", image: muscleChest },
    { name: "Abdômen", image: muscleAbs },
    { name: "Pernas", image: muscleLegs },
    { name: "Costas", image: muscleBack },
    { name: "Braços", image: muscleArms },
  ];

  const mealPlans = [
    { 
      title: "Salada Grega com alface, cebola roxa e azeitonas", 
      calories: "150 kcal", 
      image: mealSalad1,
      bg: "bg-pink-100"
    },
    { 
      title: "Salada de vegetais frescos com abacate", 
      calories: "270 kcal", 
      image: mealSalad2,
      bg: "bg-cyan-100"
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-lime">VISIONFIT</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <User className="h-5 w-5 text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors relative">
              <Bell className="h-5 w-5 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-lime rounded-full"></span>
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Olá, {userName}! 👋</h2>
          <p className="text-muted-foreground text-sm">É hora de desafiar seus limites.</p>
        </div>

        {/* Performance Calendar */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3">Meu Desempenho</h3>
          <PerformanceCalendar />
        </div>
      </div>

      {/* Recommended Workouts */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Recomendados</h3>
          <Button variant="link" className="text-lime p-0 h-auto hover:text-lime/80 text-sm">
            Ver Todos →
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {recommendedWorkouts.map((workout, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-64 h-40 rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => navigate("/workouts")}
            >
              <img
                src={workout.image}
                alt={workout.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-3 left-3 right-3">
                <h4 className="text-white font-bold text-base mb-1.5">{workout.title}</h4>
                <div className="flex items-center gap-2 text-white/90 text-xs mb-2">
                  <span>⏱ {workout.duration}</span>
                  <span>🔥 {workout.calories}</span>
                </div>
                <span className="inline-block px-2.5 py-0.5 bg-lime text-black text-xs font-semibold rounded-full">
                  {workout.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle Focus Area */}
      <div className="px-4 pb-6">
        <h3 className="text-lg font-bold mb-3">Área de Foco</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {muscleGroups.map((group, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
              onClick={() => navigate("/workouts")}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-lime transition-colors">
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs text-foreground font-medium">{group.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Desafio da Semana</h3>
        </div>
        <div 
          className="relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-r from-purple to-blue p-6"
          onClick={() => navigate("/challenges")}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-lime" />
                <span className="text-xs font-semibold text-lime">DESAFIO ATIVO</span>
              </div>
              <h4 className="text-white font-bold text-xl mb-2">100 Flexões em 7 Dias</h4>
              <p className="text-white/80 text-sm mb-3">Complete 100 flexões durante a semana</p>
              <div className="flex items-center gap-4 text-white/90 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  3 dias restantes
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  45/100 completas
                </span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Trophy className="h-10 w-10 text-lime" />
            </div>
          </div>
        </div>
      </div>

      {/* Nutrition Section */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">Planos de Refeição</h3>
          <Button variant="link" className="text-lime p-0 h-auto hover:text-lime/80 text-sm">
            Ver Todos →
          </Button>
        </div>
        <div className="space-y-3">
          {mealPlans.map((meal, index) => (
            <div
              key={index}
              className={`${meal.bg} rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-transform`}
              onClick={() => navigate("/settings")}
            >
              <div className="flex items-center gap-4">
                <img
                  src={meal.image}
                  alt={meal.title}
                  className="w-24 h-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1 text-gray-900">{meal.title}</h4>
                  <p className="text-xs text-gray-600">{meal.calories}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
