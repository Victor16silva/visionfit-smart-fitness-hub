import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      "";
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY") ??
      "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Configuração do servidor incompleta" }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return json({ error: "Não autenticado" }, 401);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    const roles = (callerRoles ?? []).map((row) => row.role);
    const isAdmin = roles.includes("admin") || roles.includes("master");
    if (!isAdmin) {
      return json({ error: "Apenas admin pode excluir contas" }, 403);
    }

    const payload = await req.json().catch(() => ({}));
    const targetUserId = payload.user_id;
    if (typeof targetUserId !== "string" || !targetUserId) {
      return json({ error: "user_id inválido" }, 400);
    }

    if (targetUserId === caller.id) {
      return json({ error: "Você não pode excluir a própria conta" }, 400);
    }

    const { data: targetRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", targetUserId);

    const targetIsProtected = (targetRoles ?? []).some(
      (row) => row.role === "admin" || row.role === "master",
    );
    const callerIsMaster = roles.includes("master");
    if (targetIsProtected && !callerIsMaster) {
      return json({ error: "Apenas master pode excluir contas admin" }, 403);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      targetUserId,
    );
    if (deleteError) {
      return json({ error: deleteError.message }, 400);
    }

    return json({ success: true });
  } catch (error) {
    console.error("delete-user error:", error);
    return json({ error: "Erro ao excluir conta" }, 500);
  }
});
