import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type SuperPage = Tables<"super_pages">;
export type SuperPageStatus = "draft" | "published" | "needs_review" | "archived";

// ── List ──────────────────────────────────────────────────────────────────────

export function useSuperPagesList(blogId: string | undefined) {
  const [pages, setPages] = useState<SuperPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!blogId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("super_pages")
      .select("id, title, slug, focus_keyword, status, word_count, quality_score, created_at, updated_at, published_at")
      .eq("blog_id", blogId)
      .order("created_at", { ascending: false });
    if (!error && data) setPages(data as SuperPage[]);
    setLoading(false);
  }, [blogId]);

  useEffect(() => { fetch(); }, [fetch]);

  const deletePage = useCallback(async (id: string) => {
    const { error } = await supabase.from("super_pages").delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar Super Page"); return false; }
    setPages((prev) => prev.filter((p) => p.id !== id));
    toast.success("Super Page deletada");
    return true;
  }, []);

  const changeStatus = useCallback(async (id: string, status: SuperPageStatus) => {
    const updates: Partial<SuperPage> = { status };
    if (status === "published") updates.published_at = new Date().toISOString();
    if (status === "draft") updates.published_at = null;
    const { error } = await supabase.from("super_pages").update(updates as any).eq("id", id);
    if (error) { toast.error("Erro ao alterar status"); return false; }
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    toast.success(status === "published" ? "Super Page publicada!" : "Super Page despublicada");
    return true;
  }, []);

  return { pages, loading, refetch: fetch, deletePage, changeStatus };
}

// ── Single ────────────────────────────────────────────────────────────────────

export function useSuperPage(id: string | undefined) {
  const [page, setPage] = useState<SuperPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("super_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return; }
        setPage(data as SuperPage);
        setLoading(false);
      });
  }, [id]);

  const save = useCallback(async (updates: Partial<SuperPage>) => {
    if (!id) return false;
    setSaving(true);
    const { error } = await supabase.from("super_pages").update(updates as any).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return false; }
    setPage((prev) => (prev ? { ...prev, ...updates } : prev));
    setLastSaved(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    return true;
  }, [id]);

  const publish = useCallback(async () => {
    const ok = await save({ status: "published", published_at: new Date().toISOString() } as any);
    if (ok) toast.success("Super Page publicada!");
    return ok;
  }, [save]);

  const unpublish = useCallback(async () => {
    const ok = await save({ status: "draft", published_at: null } as any);
    if (ok) toast.success("Super Page despublicada");
    return ok;
  }, [save]);

  return { page, setPage, loading, saving, lastSaved, save, publish, unpublish };
}
