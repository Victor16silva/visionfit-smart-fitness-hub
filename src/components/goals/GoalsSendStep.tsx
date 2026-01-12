import { motion } from "framer-motion";
import { Send, MessageCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

interface GoalsSendStepProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  loading: boolean;
  sent: boolean;
}

export function GoalsSendStep({ 
  message, 
  onMessageChange, 
  onSend, 
  loading,
  sent 
}: GoalsSendStepProps) {
  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto bg-lime/20 rounded-full flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-lime" />
        </motion.div>
        
        <div>
          <h1 className="text-2xl font-black text-foreground mb-2">
            Enviado com Sucesso! 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            Seu personal irá analisar suas informações e entrará em contato em breve.
          </p>
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-primary" />
            <p className="text-sm text-foreground">
              Acompanhe o chat na seção "Meus Objetivos" do seu perfil
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h1 className="text-2xl font-black text-foreground mb-2">
          ✉️ Enviar para o Personal
        </h1>
        <p className="text-muted-foreground text-sm">
          Adicione uma mensagem para seu personal trainer
        </p>
      </div>

      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">
              Suas informações serão enviadas:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Dados pessoais (gênero, idade, peso, altura)</li>
              <li>• Biotipo e nível de treino</li>
              <li>• Objetivos fitness selecionados</li>
              <li>• Fotos de evolução (se adicionadas)</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Mensagem para o personal (opcional)
        </label>
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Conte mais sobre seus objetivos, limitações, histórico de treino..."
          className="min-h-[120px] bg-muted/50 border-border resize-none"
        />
      </div>

      <Button
        onClick={onSend}
        disabled={loading}
        className="w-full bg-lime text-black hover:bg-lime/90 font-bold h-14"
      >
        {loading ? (
          "Enviando..."
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Enviar para o Personal
          </>
        )}
      </Button>
    </motion.div>
  );
}
