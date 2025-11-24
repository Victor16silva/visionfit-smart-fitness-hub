import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const benefits = [
  "7 dias de teste grátis",
  "Cancele quando quiser",
  "Sem taxas ocultas",
  "Suporte 24/7",
];

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Pronto para transformar
            <br />
            <span className="text-gradient-primary">seus resultados?</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já estão alcançando seus objetivos 
            com a tecnologia mais avançada de fitness.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50"
              >
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="group text-lg px-10">
              Comece Grátis Agora
              <ArrowRight className="group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-10">
              Falar com Vendas
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Mais de <span className="text-primary font-semibold">10.000</span> academias já usam VisionFit
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
