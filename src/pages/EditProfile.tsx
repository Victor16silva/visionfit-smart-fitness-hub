import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { toast } from "sonner";

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");

      // Load phone and birth_date from user metadata if available
      const { data: authData } = await supabase.auth.getUser();
      const metadata = authData.user?.user_metadata;
      setPhone(metadata?.phone || "");
      setBirthDate(metadata?.birth_date || "");
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Erro ao carregar perfil");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update profile table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          phone: phone,
          birth_date: birthDate,
        },
      });

      if (metadataError) throw metadataError;

      toast.success("Perfil atualizado com sucesso!");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground">Editar Perfil</h1>
            <p className="text-sm text-muted-foreground">Atualize suas informações pessoais</p>
          </div>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto">
        {/* Avatar Section */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarFallback className="text-4xl bg-primary/20 text-primary font-bold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Camera className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-foreground">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Digite seu nome completo"
                className="bg-muted border-border"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="bg-muted border-border opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-muted border-border"
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-foreground">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 mt-6"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-destructive/10 border-destructive/30 mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Uma vez que você excluir sua conta, não há como voltar atrás. Por favor, tenha certeza.
            </p>
            <Button
              variant="destructive"
              className="w-full font-bold"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.")) {
                  toast.error("Funcionalidade em desenvolvimento");
                }
              }}
            >
              Excluir Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
