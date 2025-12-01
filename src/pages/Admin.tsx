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
import UserDetailCard from "@/components/admin/UserDetailCard";
import AssignWorkoutModal from "@/components/admin/AssignWorkoutModal";
import CreateWorkoutModal from "@/components/admin/CreateWorkoutModal";
import ExercisePickerModal from "@/components/admin/ExercisePickerModal";
import ExerciseFormModal from "@/components/admin/ExerciseFormModal";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email?: string;
  role?: string;
  workouts_count?: number;
  gender?: string;
  age?: number;
  weight_kg?: number;
}

interface WorkoutPlan {
  id: string;
  name: string;
  muscle_groups: string[];
  category?: string;
  division_letter?: string;
  description?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  difficulty?: string;
  image_url?: string;
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

  // Modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseFormOpen, setExerciseFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

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
      // Load users with auth data
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, gender, age, weight_kg")
        .order("full_name");

      // Get roles and email for each user
      const usersWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          // Count workouts for user
          const { count } = await supabase
            .from("workout_plans")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", profile.id);

          return {
            ...profile,
            role: roleData?.role || "user",
            workouts_count: count || 0
          };
        })
      );

      setUsers(usersWithDetails);

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

  const handleAssignWorkout = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setSelectedUser(foundUser);
      setAssignModalOpen(true);
    }
  };

  const handleCreateWorkout = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setSelectedUser(foundUser);
      setSelectedExercises([]);
      setCreateModalOpen(true);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        toast.info("Usuário já é admin");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) throw error;
      
      toast.success("Usuário promovido a admin");
      loadAllData();
    } catch (error) {
      console.error("Error making admin:", error);
      toast.error("Erro ao promover usuário");
    }
  };

  const handleSelectExercises = (newExercises: Exercise[]) => {
    setSelectedExercises(prev => [...prev, ...newExercises]);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
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
                  ? "bg-background text-foreground shadow-sm border border-border"
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
                <UserDetailCard
                  key={userData.id}
                  user={userData}
                  onAssignWorkout={handleAssignWorkout}
                  onCreateWorkout={handleCreateWorkout}
                  onMakeAdmin={handleMakeAdmin}
                />
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
                className="bg-lime text-black font-bold hover:bg-lime/90"
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
                          <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center">
                            <span className="text-lg font-bold text-black">
                              {workout.division_letter || "A"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground">{workout.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {workout.description || workout.muscle_groups?.slice(0, 2).join(" e ")}
                            </p>
                            <div className="flex gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {workout.category || "Avançado"}
                              </Badge>
                              <Badge className="bg-lime text-black text-xs">
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
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-24 bg-card border-border">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
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
                <SelectContent className="bg-card border-border">
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
              <h2 className="text-lg font-bold text-foreground">Exercícios</h2>
              <Button 
                className="bg-lime text-black font-bold hover:bg-lime/90"
                onClick={() => {
                  setEditingExercise(null);
                  setExerciseFormOpen(true);
                }}
              >
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
                          <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                            {exercise.image_url ? (
                              <img 
                                src={exercise.image_url} 
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Target className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground mb-1">{exercise.name}</h3>
                            <div className="flex gap-1.5 flex-wrap">
                              {exercise.muscle_groups?.slice(0, 2).map((mg, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="secondary" 
                                  className="text-xs bg-muted text-foreground"
                                >
                                  {mg}
                                </Badge>
                              ))}
                              {exercise.difficulty && (
                                <Badge className="text-xs bg-muted text-foreground">
                                  {exercise.difficulty}
                                </Badge>
                              )}
                              <Badge className="bg-lime text-black text-xs">
                                {exercise.muscle_groups?.[0] || "Geral"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center hover:bg-muted transition-colors"
                            onClick={() => {
                              setEditingExercise(exercise);
                              setExerciseFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="w-8 h-8 rounded-full bg-card-hover flex items-center justify-center hover:bg-destructive/20 transition-colors"
                            onClick={async () => {
                              if (confirm("Tem certeza que deseja excluir este exercício?")) {
                                const { error } = await supabase
                                  .from("exercises")
                                  .delete()
                                  .eq("id", exercise.id);
                                if (error) {
                                  toast.error("Erro ao excluir exercício");
                                } else {
                                  toast.success("Exercício excluído");
                                  loadAllData();
                                }
                              }
                            }}
                          >
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

      {/* Modals */}
      <AssignWorkoutModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedUser(null);
          loadAllData();
        }}
        user={selectedUser}
      />

      <CreateWorkoutModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedUser(null);
          setSelectedExercises([]);
          loadAllData();
        }}
        user={selectedUser}
        onOpenExercisePicker={() => setExercisePickerOpen(true)}
        selectedExercises={selectedExercises}
        onRemoveExercise={handleRemoveExercise}
      />

      <ExercisePickerModal
        isOpen={exercisePickerOpen}
        onClose={() => setExercisePickerOpen(false)}
        onSelectExercises={handleSelectExercises}
        selectedCount={selectedExercises.length}
      />

      <ExerciseFormModal
        isOpen={exerciseFormOpen}
        onClose={() => {
          setExerciseFormOpen(false);
          setEditingExercise(null);
        }}
        exercise={editingExercise}
        onSuccess={loadAllData}
      />
    </div>
  );
}
