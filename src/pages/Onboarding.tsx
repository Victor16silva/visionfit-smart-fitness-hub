import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dumbbell, ChevronRight } from "lucide-react";
import splashImg from "@/assets/onboarding-splash.jpg";
import welcomeImg from "@/assets/onboarding-welcome.jpg";
import loginImg from "@/assets/onboarding-login.jpg";

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Auto-advance from first slide after 5 seconds
  useEffect(() => {
    if (currentSlide === 0) {
      const timer = setTimeout(() => {
        setCurrentSlide(1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  const slides = [
    {
      image: splashImg,
      title: "VisionFit",
      subtitle: "Transforme Seu Potencial",
      showButton: false,
    },
    {
      image: welcomeImg,
      title: "Bem-vindo",
      description: "VisionFit é um personal trainer alimentado por IA que se adapta aos seus objetivos, rastreia seu progresso e oferece treinos personalizados e planos focados.",
      showButton: true,
      buttonText: "Vamos Começar",
    },
  ];

  const handleNext = () => {
    navigate("/auth");
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentSlideData.image}
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        {/* Logo/Title Area */}
        {currentSlide === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-6 border border-primary/30">
              <Dumbbell className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-6xl font-bold text-primary mb-2">
              {currentSlideData.title}
            </h1>
            <p className="text-xl text-foreground/80">
              {currentSlideData.subtitle}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-end pb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              {currentSlideData.title}
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed max-w-md">
              {currentSlideData.description}
            </p>
          </div>
        )}

        {/* Bottom Section */}
        <div className="space-y-6">
          {currentSlideData.showButton && (
            <Button
              onClick={handleNext}
              size="lg"
              className="w-full h-14 text-lg font-bold gradient-primary shadow-primary"
            >
              {currentSlideData.buttonText}
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          )}

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-primary"
                    : "w-2 bg-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Skip/Continue */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={handleNext}
              className="w-full text-center text-foreground/60 hover:text-foreground transition-colors"
            >
              {currentSlide === 0 ? "Toque para continuar" : "Pular"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
