import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface QuickActionCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  href: string;
  color?: "lime" | "purple" | "orange" | "blue";
}

export default function QuickActionCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  href,
  color = "lime"
}: QuickActionCardProps) {
  const navigate = useNavigate();

  const colorClasses = {
    lime: "bg-lime/10 text-lime border-lime/20 hover:bg-lime/20",
    purple: "bg-purple/10 text-purple border-purple/20 hover:bg-purple/20",
    orange: "bg-orange/10 text-orange border-orange/20 hover:bg-orange/20",
    blue: "bg-blue/10 text-blue border-blue/20 hover:bg-blue/20",
  };

  const iconColorClasses = {
    lime: "bg-lime/20 text-lime",
    purple: "bg-purple/20 text-purple",
    orange: "bg-orange/20 text-orange",
    blue: "bg-blue/20 text-blue",
  };

  return (
    <Card 
      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${colorClasses[color]}`}
      onClick={() => navigate(href)}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${iconColorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </Card>
  );
}
