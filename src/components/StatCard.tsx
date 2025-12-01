import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "lime" | "purple" | "orange" | "blue";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  color = "lime",
  trend
}: StatCardProps) {
  const colorClasses = {
    lime: "text-lime",
    purple: "text-purple",
    orange: "text-orange",
    blue: "text-blue",
  };

  const bgColorClasses = {
    lime: "bg-lime/10",
    purple: "bg-purple/10",
    orange: "bg-orange/10",
    blue: "bg-blue/10",
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClasses[color]}`}>
          <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? "text-lime" : "text-destructive"}`}>
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/60 mt-1">{subtitle}</p>
      )}
    </Card>
  );
}
