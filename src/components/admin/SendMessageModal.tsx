import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onSuccess: () => void;
}

export default function SendMessageModal({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName,
  onSuccess 
}: SendMessageModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !user) return;

    setLoading(true);
    try {
      // Find or create trainer chat request
      let { data: existingRequest } = await supabase
        .from("trainer_chat_requests")
        .select("id")
        .eq("user_id", studentId)
        .maybeSingle();

      let requestId = existingRequest?.id;

      if (!requestId) {
        const { data: newRequest, error: createError } = await supabase
          .from("trainer_chat_requests")
          .insert({
            user_id: studentId,
            trainer_id: user.id,
            status: "active"
          })
          .select("id")
          .single();

        if (createError) throw createError;
        requestId = newRequest.id;
      } else {
        // Update existing request to active and assign trainer
        await supabase
          .from("trainer_chat_requests")
          .update({ 
            trainer_id: user.id,
            status: "active" 
          })
          .eq("id", requestId);
      }

      // Send the message
      const { error: messageError } = await supabase
        .from("trainer_messages")
        .insert({
          request_id: requestId,
          sender_id: user.id,
          message: message.trim()
        });

      if (messageError) throw messageError;

      toast.success("Mensagem enviada com sucesso!");
      setMessage("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  };

  const quickMessages = [
    "Seu treino personalizado está pronto! Acesse a aba de treinos para começar.",
    "Olá! Vi seu perfil e vou preparar um treino especial para você.",
    "Seu programa de treino foi atualizado. Confira as novidades!",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem para {studentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Quick Messages */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Mensagens Rápidas</Label>
            <div className="space-y-2">
              {quickMessages.map((quickMsg, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(quickMsg)}
                  className="w-full text-left p-3 text-sm bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <Label htmlFor="message">Sua Mensagem</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem para o aluno..."
              className="min-h-[120px] mt-2"
            />
          </div>

          {/* Send Button */}
          <Button
            className="w-full bg-lime text-black font-bold hover:bg-lime/90 h-12"
            onClick={handleSend}
            disabled={!message.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
