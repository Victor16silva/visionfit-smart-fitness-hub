import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  Users, 
  Target, 
  Trophy, 
  Heart, 
  Calendar, 
  Bell, 
  HelpCircle,
  LogOut,
  ChevronRight,
  Dumbbell,
  Flame,
  TrendingUp,
  ExternalLink
} from "lucide-react";

interface ProfileStats {
  workouts: number;
  streak: number;
  level: string;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  action?: () => void;
  variant?: "default" | "warning" | "danger";
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    workouts: 1,
    streak: 7,
    level: "Iniciante"
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
    checkAdminStatus();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setFullName(data.full_name);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .in("role", ["admin", "master"])
        .maybeSingle();

      setIsAdmin(!!data);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const getInitials = () => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const accountMenuItems: MenuItem[] = [
    { icon: Users, label: "Sobre Mim", path: "/settings" },
    { icon: Target, label: "Meus Objetivos", path: "/goals" },
    { icon: Trophy, label: "Conquistas", path: "/progress" },
    { icon: Heart, label: "Favoritos", path: "/favorites" },
    { icon: Calendar, label: "Meu Progresso", path: "/calendar" },
    { icon: Bell, label: "Notificações", path: "/settings" },
    { icon: Settings, label: "Configurações", path: "/settings" },
    { icon: HelpCircle, label: "Suporte", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-3xl font-black text-foreground">Perfil</h1>
        <button 
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Profile Card with Gradient */}
      <div className="px-4 mb-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-purple via-purple/80 to-accent">
          <CardContent className="p-6">
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-background">
                  <AvatarFallback className="text-2xl bg-card text-primary font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <ExternalLink className="h-3.5 w-3.5 text-primary-foreground" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{fullName}</h2>
                <p className="text-white/70 text-sm">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Premium
                  </span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-card text-foreground text-xs font-semibold">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Dumbbell className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{stats.workouts}</p>
                <p className="text-xs text-white/70">Treinos</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Flame className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black text-white">{stats.streak}</p>
                <p className="text-xs text-white/70">Sequência</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <TrendingUp className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-lg font-black text-white">{stats.level}</p>
                <p className="text-xs text-white/70">Nível</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* About Me Section */}
      <div className="px-4 mb-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-1">Sobre Mim</h3>
            <p className="text-sm text-muted-foreground">
              Adicione uma descrição sobre você e seus objetivos fitness.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div className="px-4 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Gerenciamento
          </p>
          <Card 
            className="bg-orange/10 border-orange/30 cursor-pointer hover:bg-orange/20 transition-colors"
            onClick={() => navigate("/admin")}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange" />
                  </div>
                  <span className="font-bold text-orange">Painel Admin</span>
                </div>
                <ChevronRight className="h-5 w-5 text-orange" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Menu */}
      <div className="px-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Conta
        </p>
        <div className="space-y-2">
          {accountMenuItems.map((item, index) => (
            <Card 
              key={index}
              className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => item.path && navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-card-hover flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout */}
        <Card 
          className="bg-destructive/10 border-destructive/30 cursor-pointer hover:bg-destructive/20 transition-colors mt-4"
          onClick={handleSignOut}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <LogOut className="h-5 w-5 text-destructive" />
                </div>
                <span className="font-bold text-destructive">Sair da Conta</span>
              </div>
              <ChevronRight className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
