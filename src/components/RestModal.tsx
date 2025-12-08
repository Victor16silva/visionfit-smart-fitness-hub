import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Timer } from "lucide-react";

interface RestModalProps {
  isOpen: boolean;
  restTime: number;
  onClose: () => void;
  onSkip: () => void;
}

export default function RestModal({ isOpen, restTime, onSkip }: RestModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md bg-[#2a2a2a] border-0 rounded-3xl p-8"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Timer Icon */}
          <div className="w-20 h-20 rounded-full bg-[#3498db] flex items-center justify-center mb-6">
            <Timer className="h-10 w-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">Muito bom!</h2>
          <p className="text-muted-foreground mb-6">
            Você finalizou mais uma série.<br />
            Descanse por:
          </p>

          {/* Timer Display */}
          <div className="text-7xl font-bold text-white mb-8 tracking-wider">
            {formatTime(restTime)}
          </div>

          {/* Skip Button */}
          <Button
            onClick={onSkip}
            className="w-full h-14 rounded-full bg-[#3498db] hover:bg-[#2980b9] text-white font-bold text-lg"
          >
            PARAR CRONÔMETRO
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
