import { Button } from "@/components/ui/button";
import { Dumbbell, Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-bold">VisionFit</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground hover:text-primary transition-smooth">
              Recursos
            </a>
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-smooth">
              Como Funciona
            </a>
            <a href="#plans" className="text-foreground hover:text-primary transition-smooth">
              Planos
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-smooth">
              Sobre
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="hover:text-primary transition-smooth font-medium"
              onClick={() => window.location.href = '/auth'}
            >
              Entrar
            </Button>
            <Button 
              className="gradient-primary text-primary-foreground font-semibold shadow-primary hover:scale-105 transition-smooth"
              onClick={() => window.location.href = '/auth'}
            >
              Começar Grátis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-smooth"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-foreground hover:text-primary transition-smooth px-4 py-2">
                Recursos
              </a>
              <a href="#how-it-works" className="text-foreground hover:text-primary transition-smooth px-4 py-2">
                Como Funciona
              </a>
              <a href="#plans" className="text-foreground hover:text-primary transition-smooth px-4 py-2">
                Planos
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-smooth px-4 py-2">
                Sobre
              </a>
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border/50">
                <Button 
                  variant="ghost" 
                  className="w-full hover:text-primary transition-smooth"
                  onClick={() => window.location.href = '/auth'}
                >
                  Entrar
                </Button>
                <Button 
                  className="w-full gradient-primary text-primary-foreground font-semibold shadow-primary"
                  onClick={() => window.location.href = '/auth'}
                >
                  Começar Grátis
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
