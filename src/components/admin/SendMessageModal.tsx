import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: { id: string; full_name: string } | null;
  studentId?: string;
  studentName?: string;
  onSuccess?: () => void | Promise<void>;
}

export default function SendMessageModal({ isOpen, onClose, student, studentId, studentName, onSuccess }: SendMessageModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const targetId = student?.id || studentId;
  const targetName = student?.full_name || studentName;

  const handleSend = async () => {
    if (!message.trim() || !targetId || !user) {
      toast.error("Digite uma mensagem");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: targetId,
        title: "Nova mensagem do treinador",
        message: message.trim(),
        type: "trainer_message",
      });

      if (error) throw error;

      toast.success("Mensagem enviada!");
      setMessage("");
      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !targetId) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-md animate-fade-in">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Enviar Mensagem</h2>
            <p className="text-sm text-muted-foreground">Para: {targetName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <Textarea placeholder="Digite sua mensagem..." value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px] bg-muted border-border resize-none" />
        </div>
        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-lime text-black font-bold hover:bg-lime/90" onClick={handleSend} disabled={loading || !message.trim()}>
            <Send className="h-4 w-4 mr-2" />{loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
