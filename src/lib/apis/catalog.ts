import { supabase } from "@/integrations/supabase/client";

export type ApiRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  documentation_url: string;
  auth_type: string | null;
  https: boolean | null;
  cors: string;
  postman_available: boolean;
  tags: string[];
  source_repository: string;
  source_commit: string | null;
  status: string;
  health_status: string | null;
  last_checked_at: string | null;
  last_synced_at: string;
};

export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  api_count: number;
  updated_at: string;
};

export type DirectoryFilters = {
  search?: string;
  category?: string;
  auth?: "all" | "none" | "apiKey" | "OAuth" | "other";
  https?: "all" | "yes" | "no";
  cors?: "all" | "yes" | "no" | "unknown";
  sort?: "name" | "category" | "recent";
  page?: number;
  pageSize?: number;
};

export async function fetchCategories(): Promise<CategoryRecord[]> {
  const { data, error } = await supabase
    .from("api_categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CategoryRecord[];
}

export async function fetchApis(f: DirectoryFilters) {
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 24;
  let q = supabase.from("apis").select("*", { count: "exact" });

  if (f.search?.trim()) {
    const s = f.search.trim().replace(/[%,()]/g, " ");
    q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`);
  }
  if (f.category && f.category !== "all") q = q.eq("category", f.category);
  if (f.auth && f.auth !== "all") {
    if (f.auth === "none") q = q.is("auth_type", null);
    else if (f.auth === "other") q = q.not("auth_type", "is", null).not("auth_type", "in", '("apiKey","OAuth")');
    else q = q.eq("auth_type", f.auth);
  }
  if (f.https && f.https !== "all") q = q.eq("https", f.https === "yes");
  if (f.cors && f.cors !== "all") q = q.eq("cors", f.cors);

  if (f.sort === "category") q = q.order("category").order("name");
  else if (f.sort === "recent") q = q.order("last_synced_at", { ascending: false }).order("name");
  else q = q.order("name", { ascending: true });

  const from = (page - 1) * pageSize;
  const { data, error, count } = await q.range(from, from + pageSize - 1);
  if (error) throw error;
  return { rows: (data ?? []) as ApiRecord[], total: count ?? 0, page, pageSize };
}

export async function fetchApiBySlug(slug: string): Promise<ApiRecord | null> {
  const { data, error } = await supabase.from("apis").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return (data as ApiRecord) ?? null;
}

export async function fetchCatalogStats() {
  const [apis, cats, noAuth, https, sync] = await Promise.all([
    supabase.from("apis").select("id", { count: "exact", head: true }),
    supabase.from("api_categories").select("id", { count: "exact", head: true }),
    supabase.from("apis").select("id", { count: "exact", head: true }).is("auth_type", null),
    supabase.from("apis").select("id", { count: "exact", head: true }).eq("https", true),
    supabase.from("sync_runs").select("*").order("created_at", { ascending: false }).limit(1),
  ]);
  return {
    apiCount: apis.count ?? 0,
    categoryCount: cats.count ?? 0,
    noAuthCount: noAuth.count ?? 0,
    httpsCount: https.count ?? 0,
    lastSync: (sync.data?.[0] as { created_at: string; api_count: number; status: string } | undefined) ?? null,
  };
}

export function toCsv(rows: ApiRecord[]) {
  const cols = ["name", "description", "category", "documentation_url", "auth_type", "https", "cors", "tags"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc((r as never)[c])).join(","))].join("\n");
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const REPO_URL = "https://github.com/public-apis/public-apis";
