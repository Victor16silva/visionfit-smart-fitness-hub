import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, Apple, Trophy, User } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation structure from report - 5 items with Home in center
  const navItems = [
    { icon: Dumbbell, label: "Treinos", path: "/workouts" },
    { icon: Apple, label: "Nutrição", path: "/nutrition" },
    { icon: Home, label: "Home", path: "/dashboard", isCenter: true },
    { icon: Trophy, label: "Desafios", path: "/challenges" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb md:hidden">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isCenter = item.isCenter;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all ${
                isCenter ? "relative -top-3" : ""
              }`}
            >
              {isCenter ? (
                // Center Home button with special styling
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isActive 
                    ? "bg-lime text-black glow-lime" 
                    : "bg-muted text-muted-foreground hover:bg-lime/20"
                }`}>
                  <item.icon className="h-6 w-6" />
                </div>
              ) : (
                <>
                  <item.icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-lime" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-[10px] transition-colors ${
                      isActive ? "text-lime font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
