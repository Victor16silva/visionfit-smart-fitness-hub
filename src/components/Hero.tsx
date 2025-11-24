import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-gym.jpg";

const Hero = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Modern gym with teal and coral lighting" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
        <div className="absolute inset-0 gradient-hero" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Lançamento Oficial</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Treino inteligente.
            <br />
            <span className="text-gradient-primary">Resultados reais.</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            IA que adapta seus treinos em tempo real, gamificação que te motiva, 
            e saúde 360° para você alcançar seu melhor desempenho.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="group"
              onClick={() => navigate("/auth")}
            >
              Comece Grátis
              <ArrowRight className="group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="group"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="group-hover:scale-110 transition-smooth" />
              Ver Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-12 border-t border-border/50">
            <div>
              <div className="text-3xl font-bold text-gradient-primary">50k+</div>
              <div className="text-sm text-muted-foreground">Usuários ativos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient-primary">2M+</div>
              <div className="text-sm text-muted-foreground">Treinos completos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">Avaliação média</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
