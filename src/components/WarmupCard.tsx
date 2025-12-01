import { useNavigate } from "react-router-dom";

interface WarmupCardProps {
  title: string;
  subtitle: string;
  image: string;
  points?: number;
}

export default function WarmupCard({ title, subtitle, image, points }: WarmupCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      className="relative rounded-2xl overflow-hidden cursor-pointer group h-32"
      onClick={() => navigate("/workouts")}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Points badge */}
      {points && (
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-lime/90 rounded-full">
          <span className="text-xs font-bold text-black">+{points} pts</span>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-3 left-3 right-3">
        <h4 className="text-white font-bold text-base mb-0.5">{title}</h4>
        <p className="text-white/70 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}
