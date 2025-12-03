import { useNavigate } from "react-router-dom";

interface BodyFocusItemProps {
  name: string;
  imageUrl: string;
  area: string;
}

export default function BodyFocusItem({ name, imageUrl, area }: BodyFocusItemProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/workouts/focus/${area.toLowerCase()}`)}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-transparent group-hover:border-lime transition-all duration-300">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {name}
      </span>
    </button>
  );
}
