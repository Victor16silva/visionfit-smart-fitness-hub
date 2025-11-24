import { Brain, Trophy, Activity, Users, Smartphone, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "IA Adaptativa",
    description: "Treinos que se ajustam automaticamente à sua performance, fadiga e disponibilidade.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: Trophy,
    title: "Gamificação",
    description: "Desafios, rankings, squads e recompensas para manter você motivado todos os dias.",
    gradient: "from-accent to-accent-glow",
  },
  {
    icon: Activity,
    title: "Saúde 360°",
    description: "Rastreamento completo de sono, nutrição, hidratação e recuperação muscular.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Users,
    title: "Personal Trainers",
    description: "Plataforma completa para profissionais gerenciarem alunos, treinos e agenda.",
    gradient: "from-accent to-accent-glow",
  },
  {
    icon: Smartphone,
    title: "Check-in Inteligente",
    description: "QR Code, NFC e mapa de ocupação em tempo real da academia.",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: Zap,
    title: "Tempo Real",
    description: "Substituições automáticas de exercícios quando equipamentos estão ocupados.",
    gradient: "from-accent to-primary",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tudo que você precisa em{" "}
            <span className="text-gradient-primary">um só lugar</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Recursos avançados que transformam sua experiência na academia
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 bg-card/50 backdrop-blur border-border/50 hover:bg-card transition-smooth group shadow-card hover:shadow-primary"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-bounce`}>
                <feature.icon className="w-6 h-6 text-background" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-smooth">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
