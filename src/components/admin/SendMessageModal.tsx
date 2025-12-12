import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess?: () => void;
}

export default function SendMessageModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  onSuccess,
}: SendMessageModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    setLoading(true);
    try {
      // First check if there's an existing chat request
      let { data: existingRequest } = await supabase
        .from("trainer_chat_requests")
        .select("id")
        .eq("user_id", studentId)
        .maybeSingle();

      let requestId = existingRequest?.id;

      // If no existing request, create one
      if (!requestId) {
        const { data: newRequest, error: requestError } = await supabase
          .from("trainer_chat_requests")
          .insert({
            user_id: studentId,
            trainer_id: user.id,
            status: "active"
          })
          .select("id")
          .single();

        if (requestError) throw requestError;
        requestId = newRequest?.id;
      }

      // Insert the message
      const { error } = await supabase.from("trainer_messages").insert({
        request_id: requestId,
        sender_id: user.id,
        message: message.trim(),
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso!");
      setMessage("");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Enviar Mensagem
            </h2>
            <p className="text-xs text-muted-foreground">Para: {studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mensagem
            </label>
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] bg-muted border-border resize-none"
            />
          </div>

          <Button
            className="w-full bg-lime text-black font-bold h-12 hover:bg-lime/90"
            onClick={handleSend}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              "Enviando..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
