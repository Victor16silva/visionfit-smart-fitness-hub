import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Users, 
  Dumbbell, 
  Target, 
  Search, 
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  workouts_count?: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  muscle_groups: string[];
  category?: string;
  division_letter?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  difficulty?: string;
}

type TabType = "users" | "workouts" | "exercises";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [focusFilter, setFocusFilter] = useState<string>("");

  const stats = {
    users: users.length,
    workouts: workouts.length,
    exercises: exercises.length
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .in("role", ["admin", "master"])
        .maybeSingle();

      if (!data) {
        navigate("/dashboard");
        return;
      }

      loadAllData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/dashboard");
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load users
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          return {
            ...profile,
            role: roleData?.role || "user"
          };
        })
      );

      setUsers(usersWithRoles);

      // Load workouts
      const { data: workoutsData } = await supabase
        .from("workout_plans")
        .select("*")
        .order("created_at", { ascending: false });

      setWorkouts(workoutsData || []);

      // Load exercises
      const { data: exercisesData } = await supabase
        .from("exercises")
        .select("*")
        .order("name");

      setExercises(exercisesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      master: { bg: "bg-orange", text: "text-white" },
      admin: { bg: "bg-purple", text: "text-white" },
      personal: { bg: "bg-blue-500", text: "text-white" },
      user: { bg: "bg-card-hover", text: "text-foreground" }
    };

    const variant = variants[role] || variants.user;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${variant.bg} ${variant.text}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: "users" as TabType, label: "Usuários", icon: Users },
    { id: "workouts" as TabType, label: "Treinos", icon: Dumbbell },
    { id: "exercises" as TabType, label: "Exercícios", icon: Target },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-card-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Master Admin - Gerencie treinos e exercícios</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{stats.users}</p>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Dumbbell className="h-6 w-6 text-purple mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{stats.workouts}</p>
              <p className="text-xs text-muted-foreground">Treinos</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-orange mx-auto mb-2" />
              <p className="text-2xl font-black text-foreground">{stats.exercises}</p>
              <p className="text-xs text-muted-foreground">Exercícios</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2 p-1 bg-card rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border rounded-xl"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-3">
            {users
              .filter((u) => 
                u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((userData) => (
                <Card key={userData.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {userData.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground">{userData.full_name}</h3>
                            {getRoleBadge(userData.role || "user")}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {userData.workouts_count || 0} treinos atribuídos
                          </p>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === "workouts" && (
          <>
            <div className="flex gap-2 mb-4">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-24 bg-card border-border">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={focusFilter} onValueChange={setFocusFilter}>
                <SelectTrigger className="flex-1 bg-card border-border">
                  <SelectValue placeholder="Área de Foco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Peito">Peito</SelectItem>
                  <SelectItem value="Costas">Costas</SelectItem>
                  <SelectItem value="Pernas">Pernas</SelectItem>
                  <SelectItem value="Ombros">Ombros</SelectItem>
                  <SelectItem value="Braços">Braços</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Planos de Treino</h2>
              <Button 
                className="bg-primary text-primary-foreground font-bold"
                onClick={() => navigate("/create-workout")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Treino
              </Button>
            </div>

            <div className="space-y-3">
              {workouts
                .filter((w) => 
                  w.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((workout) => (
                  <Card key={workout.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-lg font-bold text-primary-foreground">
                              {workout.division_letter || "A"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{workout.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {workout.muscle_groups?.slice(0, 2).join(" e ")}
                            </p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Avançado
                              </Badge>
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                {workout.muscle_groups?.[0] || "Geral"}
                              </Badge>
                              <Badge className="bg-orange text-white text-xs">
                                Destaque
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}

        {/* Exercises Tab */}
        {activeTab === "exercises" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Exercícios</h2>
              <Button className="bg-primary text-primary-foreground font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Novo Exercício
              </Button>
            </div>

            <div className="space-y-3">
              {exercises
                .filter((e) => 
                  e.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((exercise) => (
                  <Card key={exercise.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-card-hover flex items-center justify-center">
                            <Target className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{exercise.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {exercise.muscle_groups?.join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
