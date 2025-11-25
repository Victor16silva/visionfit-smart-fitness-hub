import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, Apple, Trophy, User } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Dumbbell, label: "Treinos", path: "/workouts" },
    { icon: Apple, label: "Nutrição", path: "/settings" },
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Trophy, label: "Desafios", path: "/challenges" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary border-t border-border z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            >
              <item.icon
                className={`h-6 w-6 ${
                  isActive ? "text-lime" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-lime font-semibold" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}