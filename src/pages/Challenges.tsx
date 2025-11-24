import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Challenge {
  id: string;
  creator_id: string;
  opponent_id: string;
  status: string;
  week_start: string;
  week_end: string;
  created_at: string;
  creator_profile?: { full_name: string };
  opponent_profile?: { full_name: string };
  creator_workouts?: number;
  opponent_workouts?: number;
}

interface Message {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: { full_name: string };
}

export default function Challenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [opponentEmail, setOpponentEmail] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadChallenges();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedChallenge) {
      loadMessages();
      const channel = supabase
        .channel(`challenge_${selectedChallenge}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "challenge_messages",
            filter: `challenge_id=eq.${selectedChallenge}`,
          },
          () => loadMessages()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedChallenge]);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .or(`creator_id.eq.${user?.id},opponent_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load profiles separately
      const challengesWithProfiles = await Promise.all(
        (data || []).map(async (challenge) => {
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", challenge.creator_id)
            .single();

          const { data: opponentProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", challenge.opponent_id)
            .single();

          return {
            ...challenge,
            creator_profile: creatorProfile,
            opponent_profile: opponentProfile,
          };
        })
      );

      // Load workout counts for each challenge
      const challengesWithWorkouts = await Promise.all(
        challengesWithProfiles.map(async (challenge) => {
          const weekStart = new Date(challenge.week_start);
          const weekEnd = new Date(challenge.week_end);

          const { data: creatorLogs } = await supabase
            .from("workout_logs")
            .select("id")
            .eq("user_id", challenge.creator_id)
            .gte("completed_at", weekStart.toISOString())
            .lte("completed_at", weekEnd.toISOString());

          const { data: opponentLogs } = await supabase
            .from("workout_logs")
            .select("id")
            .eq("user_id", challenge.opponent_id)
            .gte("completed_at", weekStart.toISOString())
            .lte("completed_at", weekEnd.toISOString());

          return {
            ...challenge,
            creator_workouts: creatorLogs?.length || 0,
            opponent_workouts: opponentLogs?.length || 0,
          };
        })
      );

      setChallenges(challengesWithWorkouts);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedChallenge) return;

    try {
      const { data, error } = await supabase
        .from("challenge_messages")
        .select("*")
        .eq("challenge_id", selectedChallenge)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Load profiles separately
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.user_id)
            .single();

          return {
            ...msg,
            profile,
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const createChallenge = async () => {
    if (!opponentEmail) return;

    try {
      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { error } = await supabase.from("challenges").insert({
        creator_id: user?.id,
        opponent_id: opponentEmail, // Using UUID for now
        week_start: weekStart.toISOString().split("T")[0],
        week_end: weekEnd.toISOString().split("T")[0],
      });

      if (error) throw error;

      toast({
        title: "Desafio criado!",
        description: "Aguarde a aceitação do oponente.",
      });

      setOpponentEmail("");
      loadChallenges();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o desafio. Verifique o ID do usuário.",
        variant: "destructive",
      });
    }
  };

  const updateChallengeStatus = async (challengeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("challenges")
        .update({ status })
        .eq("id", challengeId);

      if (error) throw error;

      toast({
        title: status === "accepted" ? "Desafio aceito!" : "Desafio recusado",
      });

      loadChallenges();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o desafio.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChallenge) return;

    try {
      const { error } = await supabase.from("challenge_messages").insert({
        challenge_id: selectedChallenge,
        user_id: user?.id,
        message: newMessage,
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { label: "Pendente", icon: Clock, variant: "secondary" as const },
      accepted: { label: "Ativo", icon: CheckCircle, variant: "default" as const },
      declined: { label: "Recusado", icon: XCircle, variant: "destructive" as const },
      completed: { label: "Concluído", icon: Trophy, variant: "outline" as const },
    };

    const config = variants[status as keyof typeof variants];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (selectedChallenge) {
    const challenge = challenges.find((c) => c.id === selectedChallenge);
    if (!challenge) return null;

    const isCreator = challenge.creator_id === user?.id;
    const opponentName = isCreator
      ? challenge.opponent_profile?.full_name
      : challenge.creator_profile?.full_name;

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => setSelectedChallenge(null)} className="mb-4">
          ← Voltar
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Placar da Semana</CardTitle>
              <CardDescription>
                {new Date(challenge.week_start).toLocaleDateString()} -{" "}
                {new Date(challenge.week_end).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">
                    {isCreator ? "Você" : challenge.creator_profile?.full_name}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {challenge.creator_workouts}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-medium">
                    {isCreator ? opponentName : "Você"}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {challenge.opponent_workouts}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat</CardTitle>
              <CardDescription>Converse com seu oponente</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 mb-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.user_id === user?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg ${
                          msg.user_id === user?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  disabled={challenge.status !== "accepted"}
                />
                <Button
                  onClick={sendMessage}
                  disabled={challenge.status !== "accepted"}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Trophy className="h-8 w-8 text-primary" />
        Desafios
      </h1>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Ativos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="create">Criar Novo</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading ? (
            <p className="text-center py-8">Carregando...</p>
          ) : challenges.filter((c) => c.status === "accepted").length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum desafio ativo no momento.</p>
              </CardContent>
            </Card>
          ) : (
            challenges
              .filter((c) => c.status === "accepted")
              .map((challenge) => (
                <Card
                  key={challenge.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedChallenge(challenge.id)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          vs.{" "}
                          {challenge.creator_id === user?.id
                            ? challenge.opponent_profile?.full_name
                            : challenge.creator_profile?.full_name}
                        </CardTitle>
                        <CardDescription>
                          {new Date(challenge.week_start).toLocaleDateString()} -{" "}
                          {new Date(challenge.week_end).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(challenge.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-around">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {challenge.creator_id === user?.id
                            ? challenge.creator_workouts
                            : challenge.opponent_workouts}
                        </p>
                        <p className="text-sm text-muted-foreground">Seus treinos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {challenge.creator_id === user?.id
                            ? challenge.opponent_workouts
                            : challenge.creator_workouts}
                        </p>
                        <p className="text-sm text-muted-foreground">Oponente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {challenges.filter((c) => c.status === "pending").length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum desafio pendente.</p>
              </CardContent>
            </Card>
          ) : (
            challenges
              .filter((c) => c.status === "pending")
              .map((challenge) => (
                <Card key={challenge.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {challenge.creator_id === user?.id ? "Aguardando" : "Novo Desafio"} de{" "}
                          {challenge.creator_id === user?.id
                            ? challenge.opponent_profile?.full_name
                            : challenge.creator_profile?.full_name}
                        </CardTitle>
                        <CardDescription>
                          {new Date(challenge.week_start).toLocaleDateString()} -{" "}
                          {new Date(challenge.week_end).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(challenge.status)}
                    </div>
                  </CardHeader>
                  {challenge.opponent_id === user?.id && (
                    <CardContent className="flex gap-2">
                      <Button
                        onClick={() => updateChallengeStatus(challenge.id, "accepted")}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceitar
                      </Button>
                      <Button
                        onClick={() => updateChallengeStatus(challenge.id, "declined")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Desafio</CardTitle>
              <CardDescription>Desafie um amigo para treinar mais esta semana!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  ID do Usuário Oponente
                </label>
                <Input
                  id="email"
                  type="text"
                  placeholder="UUID do usuário"
                  value={opponentEmail}
                  onChange={(e) => setOpponentEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cole o ID do usuário que deseja desafiar. Você pode encontrá-lo na página de
                  perfil.
                </p>
              </div>
              <Button onClick={createChallenge} className="w-full">
                Criar Desafio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
