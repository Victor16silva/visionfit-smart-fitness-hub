import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import muscleShoulders from "@/assets/muscle-shoulders.jpg";
import muscleChest from "@/assets/muscle-chest.jpg";
import muscleAbs from "@/assets/muscle-abs.jpg";
import muscleLegs from "@/assets/muscle-legs.jpg";
import muscleArms from "@/assets/muscle-arms.jpg";
import muscleBack from "@/assets/muscle-back.jpg";

export default function AllBodyFocus() {
  const navigate = useNavigate();

  const allMuscleGroups = [
    { name: "Ombros", image: muscleShoulders, area: "ombros" },
    { name: "Peito", image: muscleChest, area: "peito" },
    { name: "Abdômen", image: muscleAbs, area: "abdomen" },
    { name: "Pernas", image: muscleLegs, area: "pernas" },
    { name: "Braços", image: muscleArms, area: "bracos" },
    { name: "Costas", image: muscleBack, area: "costas" },
    { name: "Tríceps", image: muscleArms, area: "triceps" },
    { name: "Bíceps", image: muscleArms, area: "biceps" },
    { name: "Panturrilha", image: muscleLegs, area: "panturrilha" },
    { name: "Glúteos", image: muscleLegs, area: "gluteos" },
    { name: "Antebraço", image: muscleArms, area: "antebraco" },
    { name: "Trapézio", image: muscleBack, area: "trapezio" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold">Área de Foco</h1>
        </div>
      </div>

      {/* Grid of muscle groups */}
      <div className="p-4">
        <p className="text-muted-foreground text-sm mb-4">
          Selecione um grupo muscular para ver treinos específicos
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allMuscleGroups.map((group, index) => (
            <button
              key={index}
              onClick={() => navigate(`/workouts/focus/${group.area}`)}
              className="relative aspect-square rounded-2xl overflow-hidden group"
            >
              <img
                src={group.image}
                alt={group.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <span className="text-white font-semibold text-sm">{group.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
