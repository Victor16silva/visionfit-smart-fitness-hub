import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [challenges, setChallenges] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Configurações</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>Gerencie suas preferências de notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações sobre suas atividades
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="challenges">Desafios</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações de novos desafios
              </p>
            </div>
            <Switch
              id="challenges"
              checked={challenges}
              onCheckedChange={setChallenges}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyReport">Relatório Semanal</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo semanal dos seus treinos
              </p>
            </div>
            <Switch
              id="weeklyReport"
              checked={weeklyReport}
              onCheckedChange={setWeeklyReport}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacidade</CardTitle>
          <CardDescription>Controle como seus dados são usados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Seus dados de treino são privados e apenas compartilhados quando você aceita um
              desafio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
