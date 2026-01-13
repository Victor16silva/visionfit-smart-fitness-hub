import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Dumbbell,
  ChevronRight,
  Send,
  User,
  Calendar,
  Target,
  Image,
  Plus,
  Check,
  Clock,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  gender: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  body_type: string | null;
  training_level: string | null;
  fitness_goals: string[];
  photo_front_url: string | null;
  photo_back_url: string | null;
  photo_left_url: string | null;
  photo_right_url: string | null;
  trainer_requested: boolean;
  updated_at: string;
  has_unread_messages?: boolean;
}

interface ChatMessage {
  id: string;
  message: string;
  sender_id: string;
  created_at: string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  muscle_groups: string[];
  category: string | null;
}

const VisionTreiner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);
  
  // Workout assignment state
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");

  useEffect(() => {
    checkAccess();
    loadStudents();
    loadWorkoutPlans();
  }, [user]);

  const checkAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles || !roles.some(r => ['personal', 'admin', 'master'].includes(r.role))) {
      toast.error("Acesso negado");
      navigate('/profile');
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    
    // Get all users who have completed goals and requested trainer
    const { data: goals, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('trainer_requested', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading students:', error);
      setLoading(false);
      return;
    }

    if (goals && goals.length > 0) {
      // Get profile info for each student
      const userIds = goals.map(g => g.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Get auth users emails - we'll use user_id for now
      const studentsData: Student[] = goals.map(goal => {
        const profile = profiles?.find(p => p.id === goal.user_id);
        return {
          id: goal.id,
          user_id: goal.user_id,
          full_name: profile?.full_name || 'Usuário',
          email: '',
          gender: goal.gender,
          age: goal.age,
          weight_kg: goal.weight_kg,
          height_cm: goal.height_cm,
          body_type: goal.body_type,
          training_level: goal.training_level,
          fitness_goals: goal.fitness_goals || [],
          photo_front_url: goal.photo_front_url,
          photo_back_url: goal.photo_back_url,
          photo_left_url: goal.photo_left_url,
          photo_right_url: goal.photo_right_url,
          trainer_requested: goal.trainer_requested || false,
          updated_at: goal.updated_at
        };
      });

      setStudents(studentsData);
    }
    
    setLoading(false);
  };

  const loadWorkoutPlans = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('workout_plans')
      .select('id, name, description, muscle_groups, category')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setWorkoutPlans(data);
    }
  };

  const openChat = async (student: Student) => {
    setSelectedStudent(student);
    setChatOpen(true);
    
    // Find or get chat request
    const { data: request } = await supabase
      .from('trainer_chat_requests')
      .select('id')
      .eq('user_id', student.user_id)
      .single();

    if (request) {
      setChatRequestId(request.id);
      loadChatMessages(request.id);
      subscribeToMessages(request.id);
    }
  };

  const loadChatMessages = async (requestId: string) => {
    const { data } = await supabase
      .from('trainer_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (data) {
      setChatMessages(data);
    }
  };

  const subscribeToMessages = (requestId: string) => {
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_messages',
          filter: `request_id=eq.${requestId}`
        },
        (payload) => {
          setChatMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRequestId || !user) return;

    const { error } = await supabase
      .from('trainer_messages')
      .insert({
        request_id: chatRequestId,
        sender_id: user.id,
        message: newMessage.trim()
      });

    if (error) {
      toast.error("Erro ao enviar mensagem");
      return;
    }

    setNewMessage("");
  };

  const openWorkoutModal = (student: Student) => {
    setSelectedStudent(student);
    setWorkoutModalOpen(true);
  };

  const assignWorkout = async () => {
    if (!selectedWorkout || !selectedStudent || !user) return;

    // Get the workout plan details
    const workout = workoutPlans.find(w => w.id === selectedWorkout);
    if (!workout) return;

    // Create a copy of the workout for the student
    const { data: newPlan, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: selectedStudent.user_id,
        created_by: user.id,
        name: workout.name,
        description: workout.description,
        muscle_groups: workout.muscle_groups,
        category: workout.category,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao atribuir treino");
      return;
    }

    // Copy exercises from original workout
    const { data: originalExercises } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_plan_id', selectedWorkout);

    if (originalExercises && originalExercises.length > 0) {
      const newExercises = originalExercises.map(ex => ({
        workout_plan_id: newPlan.id,
        exercise_id: ex.exercise_id,
        order_index: ex.order_index,
        sets: ex.sets,
        reps_min: ex.reps_min,
        reps_max: ex.reps_max,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes
      }));

      await supabase.from('workout_exercises').insert(newExercises);
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: selectedStudent.user_id,
      title: 'Novo Treino Atribuído!',
      message: `O personal atribuiu o treino "${workout.name}" para você.`,
      type: 'workout'
    });

    toast.success("Treino atribuído com sucesso!");
    setWorkoutModalOpen(false);
    setSelectedWorkout("");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center space-x-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Vision Treiner</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus alunos</p>
        </div>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="w-full justify-start px-4 pt-4 bg-transparent">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alunos
          </TabsTrigger>
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Treinos
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum aluno encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.photo_front_url || ''} />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {getInitials(student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground">{student.full_name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {student.training_level && (
                              <Badge variant="outline" className="text-xs">
                                {student.training_level}
                              </Badge>
                            )}
                            {student.fitness_goals.slice(0, 2).map(goal => (
                              <Badge key={goal} variant="secondary" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(student.updated_at)}
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {student.age || '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">Anos</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {student.weight_kg || '-'}kg
                        </div>
                        <div className="text-xs text-muted-foreground">Peso</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {student.height_cm || '-'}cm
                        </div>
                        <div className="text-xs text-muted-foreground">Altura</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {student.gender === 'male' ? '♂' : student.gender === 'female' ? '♀' : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">Gênero</div>
                      </div>
                    </div>

                    {/* Photos Preview */}
                    {(student.photo_front_url || student.photo_back_url) && (
                      <div className="flex gap-2 mt-4 overflow-x-auto">
                        {student.photo_front_url && (
                          <img 
                            src={student.photo_front_url} 
                            alt="Frente"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        {student.photo_back_url && (
                          <img 
                            src={student.photo_back_url} 
                            alt="Costas"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        {student.photo_left_url && (
                          <img 
                            src={student.photo_left_url} 
                            alt="Esquerda"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                        {student.photo_right_url && (
                          <img 
                            src={student.photo_right_url} 
                            alt="Direita"
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openChat(student)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openWorkoutModal(student)}
                      >
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Atribuir Treino
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Chats Tab */}
        <TabsContent value="chats" className="p-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conversa disponível
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <Card 
                  key={student.id} 
                  className="bg-card border-border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => openChat(student)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={student.photo_front_url || ''} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-foreground">{student.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Clique para abrir o chat
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workouts Tab */}
        <TabsContent value="workouts" className="p-4">
          <Button 
            className="w-full mb-4"
            onClick={() => navigate('/create-workout')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Treino
          </Button>

          {workoutPlans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum treino criado ainda
            </div>
          ) : (
            <div className="space-y-3">
              {workoutPlans.map((workout) => (
                <Card key={workout.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{workout.name}</h3>
                        {workout.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {workout.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {workout.muscle_groups.map(group => (
                            <Badge key={group} variant="outline" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge>{workout.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Modal */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedStudent?.photo_front_url || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {selectedStudent ? getInitials(selectedStudent.full_name) : '?'}
                </AvatarFallback>
              </Avatar>
              <span>{selectedStudent?.full_name}</span>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <span className="text-xs opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button size="icon" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Workout Modal */}
      <Dialog open={workoutModalOpen} onOpenChange={setWorkoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Treino para {selectedStudent?.full_name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {workoutPlans.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>Você ainda não criou nenhum treino.</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setWorkoutModalOpen(false);
                    navigate('/create-workout');
                  }}
                >
                  Criar treino agora
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {workoutPlans.map((workout) => (
                    <Card 
                      key={workout.id}
                      className={`cursor-pointer transition-colors ${
                        selectedWorkout === workout.id 
                          ? 'border-primary bg-primary/10' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedWorkout(workout.id)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{workout.name}</h4>
                          <div className="flex gap-1 mt-1">
                            {workout.muscle_groups.slice(0, 3).map(g => (
                              <Badge key={g} variant="outline" className="text-xs">
                                {g}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {selectedWorkout === workout.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button 
                  className="w-full" 
                  disabled={!selectedWorkout}
                  onClick={assignWorkout}
                >
                  Atribuir Treino
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisionTreiner;
