import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Dumbbell, TrendingUp, Apple, Users, Search, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import heroGym from "@/assets/hero-gym.jpg";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'victor';

  const quickActions = [
    { icon: Dumbbell, label: "Treino", color: "bg-lime hover:bg-lime/90", route: "/workouts" },
    { icon: TrendingUp, label: "Progresso", color: "bg-purple hover:bg-purple/90", route: "/progress" },
    { icon: Apple, label: "Nutrição", color: "bg-orange hover:bg-orange/90", route: "/settings" },
    { icon: Users, label: "Comunidade", color: "bg-blue hover:bg-blue/90", route: "/challenges" },
  ];

  const recommendedWorkouts = [
    { title: "Treino Diário", duration: "16 min", calories: "150 kcal", level: "Iniciante", image: heroGym },
    { title: "Full Body", duration: "45 min", calories: "350 kcal", level: "Intermediário", image: heroGym },
    { title: "HIIT Cardio", duration: "30 min", calories: "280 kcal", level: "Avançado", image: heroGym },
  ];

  const muscleGroups = [
    { name: "Ombros", image: heroGym },
    { name: "Peito", image: heroGym },
    { name: "Abdômen", image: heroGym },
    { name: "Pernas", image: heroGym },
    { name: "Costas", image: heroGym },
    { name: "Braços", image: heroGym },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="p-6 pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-lime">VISION</span>
            <span className="text-foreground">FIT</span>
          </h1>
          <div className="flex gap-3">
            <Button size="icon" variant="ghost" className="rounded-full bg-secondary">
              <Search className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full bg-secondary relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-lime rounded-full"></span>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Olá, {userName}! 👋</h2>
          <p className="text-muted-foreground">É hora de desafiar seus limites.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`${action.color} h-24 flex flex-col gap-2 text-foreground transition-all`}
            >
              <action.icon className="h-8 w-8" />
              <span className="font-semibold">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Recommended Workouts */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Recomendados</h3>
          <Button variant="link" className="text-lime p-0 h-auto hover:text-lime/80">
            Ver Todos →
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {recommendedWorkouts.map((workout, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-72 h-48 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => navigate("/workouts")}
            >
              <img
                src={workout.image}
                alt={workout.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-white font-bold text-lg mb-2">{workout.title}</h4>
                <div className="flex items-center gap-3 text-white/90 text-sm mb-2">
                  <span>⏱ {workout.duration}</span>
                  <span>🔥 {workout.calories}</span>
                </div>
                <span className="inline-block px-3 py-1 bg-lime text-black text-xs font-semibold rounded-full">
                  {workout.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle Focus Area */}
      <div className="px-6">
        <h3 className="text-xl font-bold mb-4">Área de Foco</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {muscleGroups.map((group, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
              onClick={() => navigate("/workouts")}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-secondary group-hover:border-lime transition-colors">
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-sm text-foreground">{group.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
