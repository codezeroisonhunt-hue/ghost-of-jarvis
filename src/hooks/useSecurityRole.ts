import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/security/types";

export function useSecurityRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setRoles([]);
      setLoading(false);
      return;
    }

    let { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);

    // Bootstrap: if nobody is admin yet, the first signed-in user claims it.
    if (!data || data.length === 0) {
      const { data: claimed } = await supabase.rpc("claim_admin_if_first");
      if (claimed) {
        const res = await supabase.from("user_roles").select("role").eq("user_id", uid);
        data = res.data;
      }
    }

    setRoles(((data ?? []).map((r) => r.role) as AppRole[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = roles.includes("admin");
  const isOperator = isAdmin || roles.includes("operator");

  return { roles, isAdmin, isOperator, loading, userId, reload: load };
}

export async function writeAudit(
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({
    user_id: data.user.id,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    metadata: (metadata ?? null) as never,
  });
}
