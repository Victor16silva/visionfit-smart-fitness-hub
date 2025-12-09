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
  Trash2,
  Calendar,
  GraduationCap
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UserDetailCard from "@/components/admin/UserDetailCard";
import WorkoutDetailCard from "@/components/admin/WorkoutDetailCard";
import AssignWorkoutModal from "@/components/admin/AssignWorkoutModal";
import CreateWorkoutModal from "@/components/admin/CreateWorkoutModal";
import AdminWorkoutModal from "@/components/admin/AdminWorkoutModal";
import EditWorkoutModal from "@/components/admin/EditWorkoutModal";
import ExercisePickerModal from "@/components/admin/ExercisePickerModal";
import ExerciseFormModal from "@/components/admin/ExerciseFormModal";
import WorkoutProgramModal from "@/components/admin/WorkoutProgramModal";
import StudentDetailCard from "@/components/admin/StudentDetailCard";
import StudentReportModal from "@/components/admin/StudentReportModal";
import SendMessageModal from "@/components/admin/SendMessageModal";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
  workouts_count?: number;
  gender?: string;
  age?: number;
  weight_kg?: number;
  is_active?: boolean;
}

interface WorkoutPlan {
  id: string;
  name: string;
  muscle_groups: string[];
  category?: string;
  division_letter?: string;
  description?: string;
  user_id?: string;
  created_by?: string;
}

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  difficulty?: string;
  image_url?: string;
  equipment?: string;
  description?: string;
  video_url?: string;
}

interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_recommended?: boolean;
  progress_percent?: number;
  workouts_count?: number;
}

interface Student {
  id: string;
  full_name: string;
  email?: string;
  goals?: {
    gender?: string;
    age?: number;
    weight_kg?: number;
    height_cm?: number;
    fitness_goals?: string[];
    body_type?: string;
    training_level?: string;
    photo_front_url?: string;
    photo_back_url?: string;
    photo_left_url?: string;
    photo_right_url?: string;
    trainer_request_date?: string;
  };
  current_program_id?: string;
  current_program_name?: string;
}

type TabType = "students" | "users" | "programs" | "workouts" | "exercises";

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [focusFilter, setFocusFilter] = useState<string>("");

  // User modal states
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSelectedExercises, setUserSelectedExercises] = useState<Exercise[]>([]);
  const [userExercisePickerOpen, setUserExercisePickerOpen] = useState(false);

  // Workout modal states
  const [adminWorkoutModalOpen, setAdminWorkoutModalOpen] = useState(false);
  const [editWorkoutModalOpen, setEditWorkoutModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const [workoutSelectedExercises, setWorkoutSelectedExercises] = useState<Exercise[]>([]);
  const [workoutExercisePickerOpen, setWorkoutExercisePickerOpen] = useState(false);

  // Exercise modal states
  const [exerciseFormOpen, setExerciseFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Context for which picker is being used
  const [pickerContext, setPickerContext] = useState<"user" | "workout" | "edit">("user");

  // Program modal states
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<WorkoutProgram | null>(null);

  // Student modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [studentForProgram, setStudentForProgram] = useState<string | null>(null);

  const stats = {
    students: students.length,
    users: users.length,
    programs: programs.length,
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
      // Load students (users who requested a trainer)
      const { data: goalsData } = await supabase
        .from("user_goals")
        .select("*")
        .eq("trainer_requested", true)
        .order("trainer_request_date", { ascending: false });

      const studentsWithDetails = await Promise.all(
        (goalsData || []).map(async (goal) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, current_program_id")
            .eq("id", goal.user_id)
            .maybeSingle();

          let programName = null;
          if (profile?.current_program_id) {
            const { data: program } = await supabase
              .from("workout_programs")
              .select("name")
              .eq("id", profile.current_program_id)
              .maybeSingle();
            programName = program?.name;
          }

          return {
            id: goal.user_id,
            full_name: profile?.full_name || "Usuário",
            goals: {
              gender: goal.gender,
              age: goal.age,
              weight_kg: goal.weight_kg,
              height_cm: goal.height_cm,
              fitness_goals: goal.fitness_goals,
              body_type: goal.body_type,
              training_level: goal.training_level,
              photo_front_url: goal.photo_front_url,
              photo_back_url: goal.photo_back_url,
              photo_left_url: goal.photo_left_url,
              photo_right_url: goal.photo_right_url,
              trainer_request_date: goal.trainer_request_date,
            },
            current_program_id: profile?.current_program_id,
            current_program_name: programName,
          };
        })
      );
      setStudents(studentsWithDetails);

      // Load users with auth data
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, gender, age, weight_kg")
        .order("full_name");

      // Get roles, email and active status for each user
      const usersWithDetails = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Get role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .maybeSingle();

          // Get email and phone from auth.users
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);

          // Count workouts for user
          const { count } = await supabase
            .from("workout_plans")
            .select("*", { count: 'exact', head: true })
            .eq("user_id", profile.id);

          return {
            ...profile,
            email: authData?.user?.email,
            phone: authData?.user?.user_metadata?.phone,
            role: roleData?.role || "user",
            workouts_count: count || 0,
            is_active: true
          };
        })
      );

      setUsers(usersWithDetails);

      // Load workout programs
      const { data: programsData } = await supabase
        .from("workout_programs")
        .select("*")
        .order("created_at", { ascending: false });

      // Get workout count for each program
      const programsWithCounts = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count } = await supabase
            .from("workout_plans")
            .select("*", { count: 'exact', head: true })
            .eq("program_id", program.id);
          return { ...program, workouts_count: count || 0 };
        })
      );
      setPrograms(programsWithCounts);

      // Load workouts (standalone, not in programs)
      const { data: workoutsData } = await supabase
        .from("workout_plans")
        .select("*")
        .is("program_id", null)
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

  // User handlers
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
      setUserSelectedExercises([]);
      setCreateModalOpen(true);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
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

  const handleMakeTrainer = async (userId: string) => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "personal")
        .maybeSingle();

      if (existingRole) {
        toast.info("Usuário já é personal trainer");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "personal" });

      if (error) throw error;

      toast.success("Usuário promovido a Personal Trainer");
      loadAllData();
    } catch (error) {
      console.error("Error making trainer:", error);
      toast.error("Erro ao promover usuário");
    }
  };

  const handleMakeMaster = async (userId: string) => {
    try {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "master")
        .maybeSingle();

      if (existingRole) {
        toast.info("Usuário já é master");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "master" });

      if (error) throw error;

      toast.success("Usuário promovido a Master");
      loadAllData();
    } catch (error) {
      console.error("Error making master:", error);
      toast.error("Erro ao promover usuário");
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        // Ban user (set banned_until to a far future date)
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "876600h" // 100 years
        });

        if (error) throw error;
        toast.success("Usuário desativado");
      } else {
        // Unban user
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: "none"
        });

        if (error) throw error;
        toast.success("Usuário ativado");
      }

      loadAllData();
    } catch (error) {
      console.error("Error toggling user active status:", error);
      toast.error("Erro ao alterar status do usuário");
    }
  };

  // Workout handlers
  const handleEditWorkout = (workout: WorkoutPlan) => {
    setEditingWorkout(workout);
    setWorkoutSelectedExercises([]);
    setEditWorkoutModalOpen(true);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!confirm("Tem certeza que deseja excluir este treino?")) return;

    try {
      // First delete workout exercises
      await supabase
        .from("workout_exercises")
        .delete()
        .eq("workout_plan_id", workoutId);

      // Then delete the workout
      const { error } = await supabase
        .from("workout_plans")
        .delete()
        .eq("id", workoutId);

      if (error) throw error;
      
      toast.success("Treino excluído com sucesso");
      loadAllData();
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("Erro ao excluir treino");
    }
  };

  // Exercise picker handlers based on context
  const handleOpenExercisePicker = (context: "user" | "workout" | "edit") => {
    setPickerContext(context);
    if (context === "user") {
      setUserExercisePickerOpen(true);
    } else {
      setWorkoutExercisePickerOpen(true);
    }
  };

  const handleSelectExercises = (newExercises: Exercise[]) => {
    if (pickerContext === "user") {
      setUserSelectedExercises(prev => [...prev, ...newExercises]);
    } else {
      setWorkoutSelectedExercises(prev => [...prev, ...newExercises]);
    }
  };

  const handleRemoveUserExercise = (exerciseId: string) => {
    setUserSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  const handleRemoveWorkoutExercise = (exerciseId: string) => {
    setWorkoutSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  // Filter helpers
  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !levelFilter || levelFilter === "all" || w.category === levelFilter;
    const matchesFocus = !focusFilter || focusFilter === "all" || w.muscle_groups?.includes(focusFilter);
    return matchesSearch && matchesLevel && matchesFocus;
  });

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = !levelFilter || levelFilter === "all" || e.difficulty === levelFilter;
    const matchesFocus = !focusFilter || focusFilter === "all" || e.muscle_groups?.includes(focusFilter);
    return matchesSearch && matchesLevel && matchesFocus;
  });

  const filteredPrograms = programs.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Student handlers
  const handleViewReport = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setReportModalOpen(true);
    }
  };

  const handleCreateStudentProgram = (studentId: string) => {
    setStudentForProgram(studentId);
    setEditingProgram(null);
    setProgramModalOpen(true);
  };

  const handleEditStudentProgram = async (studentId: string, programId: string) => {
    const { data: program } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("id", programId)
      .maybeSingle();
    
    if (program) {
      setStudentForProgram(studentId);
      setEditingProgram(program);
      setProgramModalOpen(true);
    }
  };

  const handleSendMessage = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setMessageModalOpen(true);
    }
  };

  const handleProgramSuccess = async () => {
    if (studentForProgram && editingProgram) {
      // If we created/edited a program for a student, assign it to them
      await supabase
        .from("profiles")
        .update({ current_program_id: editingProgram.id })
        .eq("id", studentForProgram);
    }
    setStudentForProgram(null);
    loadAllData();
  };

  const tabs = [
    { id: "students" as TabType, label: "Alunos", icon: GraduationCap },
    { id: "users" as TabType, label: "Usuários", icon: Users },
    { id: "programs" as TabType, label: "Programas", icon: Calendar },
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
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate("/dashboard")}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Master Admin - Gerencie treinos e exercícios</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <Card className="bg-card border-border border-lime/30">
                <CardContent className="p-4 text-center">
                  <GraduationCap className="h-6 w-6 text-lime mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.students}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Alunos</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.users}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Usuários</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-blue mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.programs}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Programas</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Dumbbell className="h-6 w-6 text-purple mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.workouts}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Treinos</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <Target className="h-6 w-6 text-orange mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.exercises}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Exercícios</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="grid grid-cols-5 gap-1 p-1 bg-card rounded-xl overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                    setLevelFilter("");
                    setFocusFilter("");
                  }}
                  className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
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
          <div>
            {/* Students Tab */}
            {activeTab === "students" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">
                    Alunos que Solicitaram Treino
                  </h2>
                  <Badge variant="outline" className="bg-lime/10 text-lime border-lime">
                    {filteredStudents.length} alunos
                  </Badge>
                </div>
                
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-bold text-foreground mb-2">Nenhum aluno ainda</h3>
                    <p className="text-muted-foreground text-sm">
                      Quando os usuários completarem o onboarding e clicarem em "Chamar Professor",<br/>
                      eles aparecerão aqui para você criar o treino deles.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                    {filteredStudents.map((student) => (
                      <StudentDetailCard
                        key={student.id}
                        student={student}
                        onViewReport={handleViewReport}
                        onCreateProgram={handleCreateStudentProgram}
                        onEditProgram={handleEditStudentProgram}
                        onSendMessage={handleSendMessage}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
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
                      onMakeTrainer={handleMakeTrainer}
                      onMakeMaster={handleMakeMaster}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
              </div>
            )}

            {/* Programs Tab */}
            {activeTab === "programs" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">Programas de Treino</h2>
                  <Button 
                    className="bg-lime text-black font-bold hover:bg-lime/90"
                    onClick={() => {
                      setEditingProgram(null);
                      setProgramModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Programa
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPrograms.map((program) => (
                    <Card 
                      key={program.id} 
                      className="bg-card border-border cursor-pointer hover:border-lime/50 transition-all"
                      onClick={() => {
                        setEditingProgram(program);
                        setProgramModalOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-lime/20 flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-lime" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-foreground">{program.name}</h3>
                                {program.is_recommended && (
                                  <Badge className="bg-amber-500/20 text-amber-500 text-xs">Recomendado</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {program.category || "Geral"} • {program.workouts_count || 0} treinos
                              </p>
                              {program.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{program.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
                              onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setProgramModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4 text-blue-400" />
                            </button>
                            <button 
                              className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (confirm("Excluir este programa e todos os treinos dentro dele?")) {
                                  await supabase.from("workout_programs").delete().eq("id", program.id);
                                  toast.success("Programa excluído");
                                  loadAllData();
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredPrograms.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum programa encontrado</p>
                      <p className="text-sm text-muted-foreground mt-1">Crie um programa para organizar treinos por dias da semana</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Workouts Tab */}
            {activeTab === "workouts" && (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-28 bg-card border-border">
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
                    <SelectTrigger className="flex-1 min-w-[120px] bg-card border-border">
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
                  <h2 className="text-lg md:text-xl font-bold text-foreground">Planos de Treino</h2>
                  <Button 
                    className="bg-lime text-black font-bold hover:bg-lime/90"
                    onClick={() => {
                      setWorkoutSelectedExercises([]);
                      setAdminWorkoutModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Treino
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkouts.map((workout) => (
                    <WorkoutDetailCard
                      key={workout.id}
                      workout={workout}
                      onEdit={handleEditWorkout}
                      onDelete={handleDeleteWorkout}
                    />
                  ))}
                  {filteredWorkouts.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      Nenhum treino encontrado
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Exercises Tab */}
            {activeTab === "exercises" && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-28 bg-card border-border">
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
                    <SelectTrigger className="flex-1 min-w-[120px] bg-card border-border">
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
                  <h2 className="text-lg md:text-xl font-bold text-foreground">Exercícios</h2>
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

                <div className="flex flex-col gap-3">
                  {filteredExercises.map((exercise) => (
                    <div 
                      key={exercise.id} 
                      className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-lime/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* GIF/Image as cover */}
                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                          {exercise.image_url ? (
                            <img 
                              src={exercise.image_url} 
                              alt={exercise.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Target className="h-7 w-7 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Exercise info */}
                        <div>
                          <h3 className="font-bold text-foreground text-base mb-2">{exercise.name}</h3>
                          <div className="flex gap-2 flex-wrap">
                            {exercise.muscle_groups?.slice(0, 2).map((mg, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs px-2.5 py-0.5 border-border text-muted-foreground"
                              >
                                {mg}
                              </Badge>
                            ))}
                            {exercise.equipment && (
                              <Badge className="bg-lime text-black text-xs px-2.5 py-0.5">
                                {exercise.equipment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button 
                          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingExercise(exercise);
                            setExerciseFormOpen(true);
                          }}
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
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
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredExercises.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum exercício encontrado
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Modals */}
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
          setUserSelectedExercises([]);
          loadAllData();
        }}
        user={selectedUser}
        onOpenExercisePicker={() => handleOpenExercisePicker("user")}
        selectedExercises={userSelectedExercises}
        onRemoveExercise={handleRemoveUserExercise}
      />

      {/* Workout Modals */}
      <AdminWorkoutModal
        isOpen={adminWorkoutModalOpen}
        onClose={() => {
          setAdminWorkoutModalOpen(false);
          setWorkoutSelectedExercises([]);
        }}
        onOpenExercisePicker={() => handleOpenExercisePicker("workout")}
        selectedExercises={workoutSelectedExercises}
        onRemoveExercise={handleRemoveWorkoutExercise}
        onSuccess={loadAllData}
      />

      <EditWorkoutModal
        isOpen={editWorkoutModalOpen}
        onClose={() => {
          setEditWorkoutModalOpen(false);
          setEditingWorkout(null);
          setWorkoutSelectedExercises([]);
        }}
        workout={editingWorkout}
        onOpenExercisePicker={() => handleOpenExercisePicker("edit")}
        selectedExercises={workoutSelectedExercises}
        onRemoveExercise={handleRemoveWorkoutExercise}
        onSuccess={loadAllData}
      />

      {/* Exercise Pickers */}
      <ExercisePickerModal
        isOpen={userExercisePickerOpen}
        onClose={() => setUserExercisePickerOpen(false)}
        onSelectExercises={handleSelectExercises}
        selectedCount={userSelectedExercises.length}
      />

      <ExercisePickerModal
        isOpen={workoutExercisePickerOpen}
        onClose={() => setWorkoutExercisePickerOpen(false)}
        onSelectExercises={handleSelectExercises}
        selectedCount={workoutSelectedExercises.length}
      />

      {/* Exercise Form Modal */}
      <ExerciseFormModal
        isOpen={exerciseFormOpen}
        onClose={() => {
          setExerciseFormOpen(false);
          setEditingExercise(null);
        }}
        exercise={editingExercise}
        onSuccess={loadAllData}
      />

      {/* Workout Program Modal */}
      <WorkoutProgramModal
        isOpen={programModalOpen}
        onClose={() => {
          setProgramModalOpen(false);
          setEditingProgram(null);
          setStudentForProgram(null);
        }}
        onSuccess={handleProgramSuccess}
        editingProgram={editingProgram}
        studentId={studentForProgram}
      />

      {/* Student Report Modal */}
      <StudentReportModal
        isOpen={reportModalOpen}
        onClose={() => {
          setReportModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />

      {/* Send Message Modal */}
      {selectedStudent && (
        <SendMessageModal
          isOpen={messageModalOpen}
          onClose={() => {
            setMessageModalOpen(false);
            setSelectedStudent(null);
          }}
          studentId={selectedStudent.id}
          studentName={selectedStudent.full_name}
          onSuccess={loadAllData}
        />
      )}
    </div>
  );
}
