import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
  showBar?: boolean;
}

export default function SectionHeader({ 
  title, 
  subtitle, 
  actionText = "Ver todos", 
  actionLink,
  onAction,
  showBar = true
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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBar && <div className="w-1 h-6 bg-primary rounded-full" />}
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {(actionLink || onAction) && (
        <button 
          onClick={handleAction}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {actionText}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
