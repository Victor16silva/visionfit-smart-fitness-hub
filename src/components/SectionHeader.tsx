import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  actionText = "Ver todos", 
  actionLink,
  onAction 
}: SectionHeaderProps) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionLink) {
      navigate(actionLink);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {(actionLink || onAction) && (
        <button 
          onClick={handleAction}
          className="flex items-center gap-1 text-sm text-lime hover:text-lime/80 transition-smooth"
        >
          {actionText}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
