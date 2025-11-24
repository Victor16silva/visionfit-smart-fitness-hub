import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, Mail, Lock, User, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-gym.jpg";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao VisionFit.",
        });
      } else {
        if (!fullName) {
          throw new Error("Nome completo é obrigatório");
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: "Conta criada!",
          description: "Bem-vindo ao VisionFit.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Lado Esquerdo - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={heroImg} 
          alt="Fitness" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/60 to-accent/40" />
        
        {/* Conteúdo sobre a imagem */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-foreground">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-primary mb-6">
              <Dumbbell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold mb-4">
              VisionFit
            </h1>
            <p className="text-xl text-foreground/80 max-w-md">
              Transforme seu corpo e sua mente com treinos inteligentes e personalizados
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-foreground/90">Treinos personalizados para seus objetivos</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <p className="text-foreground/90">Acompanhe seu progresso em tempo real</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-foreground/90">Biblioteca completa de exercícios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-primary">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">VisionFit</h1>
          </div>

          <Card className="border-none shadow-card">
            <CardContent className="pt-8 pb-8">
              {/* Toggle Login/Cadastro */}
              <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg mb-8">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-smooth ${
                    isLogin 
                      ? 'bg-primary text-primary-foreground shadow-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 rounded-md font-medium transition-smooth ${
                    !isLogin 
                      ? 'bg-accent text-accent-foreground shadow-accent' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              {/* Título */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Bem-vindo de volta!' : 'Comece sua jornada'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isLogin 
                    ? 'Entre para continuar seus treinos' 
                    : 'Crie sua conta e alcance seus objetivos'}
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="fullName" className="text-sm font-medium">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required={!isLogin}
                        className="pl-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-11 h-12 bg-secondary/50 border-border/50 focus:border-primary"
                    />
                  </div>
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  size="lg"
                  disabled={loading}
                  className={`w-full h-12 font-bold text-base shadow-lg hover:scale-105 transition-smooth ${
                    isLogin 
                      ? 'gradient-primary text-primary-foreground shadow-primary' 
                      : 'gradient-accent text-accent-foreground shadow-accent'
                  }`}
                >
                  {loading ? (
                    <span>{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Texto inferior */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? (
              <>Não tem uma conta? <button onClick={() => setIsLogin(false)} className="text-primary hover:text-primary-glow font-medium transition-smooth">Cadastre-se</button></>
            ) : (
              <>Já tem uma conta? <button onClick={() => setIsLogin(true)} className="text-accent hover:text-accent-glow font-medium transition-smooth">Entre aqui</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
