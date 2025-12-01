import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Dumbbell, Activity, Plus, Search, MoreVertical, Shield, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  difficulty: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  muscle_groups: string[];
  category: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    loadData();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some((r) => r.role === "admin" || r.role === "master");
    
    if (!isAdmin) {
      toast({ title: "Acesso negado", variant: "destructive" });
      navigate("/dashboard");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users with roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url");

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const usersWithRoles = profiles?.map((profile) => ({
        id: profile.id,
        email: "",
        full_name: profile.full_name,
        avatar_url: profile.avatar_url || undefined,
        role: userRoles?.find((r) => r.user_id === profile.id)?.role || "user",
      })) || [];

      setUsers(usersWithRoles);

      // Load exercises
      const { data: exercisesData } = await supabase
        .from("exercises")
        .select("id, name, muscle_groups, difficulty")
        .order("name");

      setExercises(exercisesData || []);

      // Load workout plans
      const { data: workoutsData } = await supabase
        .from("workout_plans")
        .select("id, name, muscle_groups, category")
        .order("name");

      setWorkoutPlans(workoutsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredWorkouts = workoutPlans.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleColors: Record<string, string> = {
    master: "bg-purple text-purple-foreground",
    admin: "bg-orange text-orange-foreground",
    personal: "bg-blue text-blue-foreground",
    user: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-black">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerenciar aplicação</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 bg-card border-border text-center">
            <Users className="w-6 h-6 text-lime mx-auto mb-1" />
            <p className="text-2xl font-black">{users.length}</p>
            <p className="text-xs text-muted-foreground">Usuários</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <Activity className="w-6 h-6 text-purple mx-auto mb-1" />
            <p className="text-2xl font-black">{exercises.length}</p>
            <p className="text-xs text-muted-foreground">Exercícios</p>
          </Card>
          <Card className="p-3 bg-card border-border text-center">
            <Dumbbell className="w-6 h-6 text-orange mx-auto mb-1" />
            <p className="text-2xl font-black">{workoutPlans.length}</p>
            <p className="text-xs text-muted-foreground">Treinos</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="users" className="flex-1">Usuários</TabsTrigger>
            <TabsTrigger value="workouts" className="flex-1">Treinos</TabsTrigger>
            <TabsTrigger value="exercises" className="flex-1">Exercícios</TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="p-3 bg-card border-border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback>{getInitials(u.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{u.full_name}</p>
                    <Badge className={`text-xs ${roleColors[u.role]}`}>
                      {u.role}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        Alterar Papel
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Dumbbell className="w-4 h-4 mr-2" />
                        Atribuir Treino
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-3">
            <Button 
              className="w-full bg-lime text-black hover:bg-lime/90 mb-4"
              onClick={() => navigate("/workouts/create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Treino
            </Button>
            
            {filteredWorkouts.map((w) => (
              <Card key={w.id} className="p-3 bg-card border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{w.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {w.muscle_groups?.join(", ") || w.category}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-3">
            <Button 
              className="w-full bg-lime text-black hover:bg-lime/90 mb-4"
              onClick={() => navigate("/exercises/create")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Exercício
            </Button>
            
            {filteredExercises.map((e) => (
              <Card key={e.id} className="p-3 bg-card border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-lime" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {e.muscle_groups?.join(", ")} • {e.difficulty}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
