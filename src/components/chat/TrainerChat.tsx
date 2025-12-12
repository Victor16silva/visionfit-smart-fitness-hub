import { useState, useEffect, useRef } from "react";
import { Send, X, ExternalLink, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  workout_id?: string;
  read: boolean;
  created_at: string;
  sender_name?: string;
  workout_name?: string;
}

interface TrainerChatProps {
  isOpen: boolean;
  onClose: () => void;
  trainerId: string;
  trainerName: string;
  userId: string;
}

export default function TrainerChat({
  isOpen,
  onClose,
  trainerId,
  trainerName,
  userId,
}: TrainerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      subscribeToMessages();
    }
  }, [isOpen, userId, trainerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("trainer_chat")
        .select(`
          *,
          sender:sender_id(full_name),
          workout_plans:workout_id(name)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .or(`sender_id.eq.${trainerId},receiver_id.eq.${trainerId}`)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        sender_name: msg.sender?.full_name,
        workout_name: msg.workout_plans?.name,
      }));

      setMessages(formattedMessages);

      // Mark messages as read
      await supabase
        .from("trainer_chat")
        .update({ read: true })
        .eq("receiver_id", userId)
        .eq("read", false);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar mensagens");
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("trainer_chat_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trainer_chat",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("trainer_chat").insert({
        sender_id: userId,
        receiver_id: trainerId,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return date.toLocaleDateString("pt-BR");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-card w-full max-w-2xl h-[600px] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div>
            <h2 className="text-lg font-bold text-foreground">Chat com {trainerName}</h2>
            <p className="text-xs text-muted-foreground">Personal Trainer</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                Nenhuma mensagem ainda. Comece a conversa!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === userId;
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].created_at) !==
                  formatDate(msg.created_at);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isOwnMessage
                          ? "bg-lime text-black"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {!isOwnMessage && (
                        <p className="text-xs font-semibold mb-1">
                          {msg.sender_name || "Trainer"}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      {msg.workout_id && msg.workout_name && (
                        <button
                          onClick={() => {
                            navigate(`/workout-session/${msg.workout_id}`);
                            onClose();
                          }}
                          className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                            isOwnMessage
                              ? "bg-black/20 hover:bg-black/30"
                              : "bg-lime/20 hover:bg-lime/30"
                          } transition-colors`}
                        >
                          <Dumbbell className="h-3 w-3" />
                          <span>{msg.workout_name}</span>
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          isOwnMessage ? "text-black/60" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-muted border-border h-12"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || loading}
              className="bg-lime text-black hover:bg-lime/90 h-12 px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
