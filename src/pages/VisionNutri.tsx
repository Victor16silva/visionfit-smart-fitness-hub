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
  Search,
  Plus,
  GraduationCap,
  UtensilsCrossed,
  Apple
} from "lucide-react";
import StudentDetailCard from "@/components/admin/StudentDetailCard";
import StudentReportModal from "@/components/admin/StudentReportModal";
import SendMessageModal from "@/components/admin/SendMessageModal";

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

interface MealPlan {
  id: string;
  name: string;
  description?: string;
  calories_target?: number;
  user_id?: string;
  created_by?: string;
}

type TabType = "students" | "meal-plans";

export default function VisionNutri() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Student modal states
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);

  const stats = {
    students: students.length,
    mealPlans: mealPlans.length
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

      // TODO: Load meal plans when table is created
      setMealPlans([]);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter helpers
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredMealPlans = mealPlans.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleSendMessage = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setMessageModalOpen(true);
    }
  };

  const tabs = [
    { id: "students" as TabType, label: "Alunos", icon: GraduationCap },
    { id: "meal-plans" as TabType, label: "Planos de Refeição", icon: UtensilsCrossed },
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
              onClick={() => navigate("/profile")}
              className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-lime">Vision Nutri</h1>
              <p className="text-sm text-muted-foreground">Gerencie alunos e planos de refeição</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Card className="bg-card border-border border-lime/30">
                <CardContent className="p-4 text-center">
                  <GraduationCap className="h-6 w-6 text-lime mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.students}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Alunos</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <UtensilsCrossed className="h-6 w-6 text-orange mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-foreground">{stats.mealPlans}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Planos</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-1 p-1 bg-card rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                  }}
                  className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 md:py-3 px-2 md:px-4 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4 md:h-5 md:w-5" />
                  <span>{tab.label}</span>
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
                    Alunos
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
                      Quando os usuários completarem o onboarding e clicarem em "Chamar Professor",<br />
                      eles aparecerão aqui para você criar planos nutricionais.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                    {filteredStudents.map((student) => (
                      <StudentDetailCard
                        key={student.id}
                        student={student}
                        onViewReport={handleViewReport}
                        onCreateProgram={() => {}}
                        onEditProgram={() => {}}
                        onSendMessage={handleSendMessage}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Meal Plans Tab */}
            {activeTab === "meal-plans" && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold text-foreground">Planos de Refeição</h2>
                  <Button
                    className="bg-lime text-black font-bold hover:bg-lime/90"
                    onClick={() => {
                      // TODO: Open meal plan modal
                      alert("Funcionalidade em desenvolvimento");
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                  </Button>
                </div>

                <div className="text-center py-12">
                  <Apple className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-foreground mb-2">Em Desenvolvimento</h3>
                  <p className="text-muted-foreground text-sm">
                    A funcionalidade de Planos de Refeição está sendo desenvolvida.<br />
                    Em breve você poderá criar e gerenciar planos nutricionais personalizados.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
