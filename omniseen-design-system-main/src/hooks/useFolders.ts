import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ArticleFolder {
  id: string;
  blog_id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  position: number;
  created_at: string;
  article_count?: number;
}

// Cast to any to bypass type-check on the new table (types regenerate after migration)
const db = supabase as any;

export function useFolders(blogId: string | undefined) {
  const [folders, setFolders] = useState<ArticleFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!blogId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await db
      .from("article_folders")
      .select("*")
      .eq("blog_id", blogId)
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    setFolders(data ?? []);
    setLoading(false);
  }, [blogId]);

  useEffect(() => { fetch(); }, [fetch]);

  const createFolder = useCallback(async (name: string, color = "#6366f1") => {
    if (!blogId || !name.trim()) return null;
    const { data, error } = await db.from("article_folders").insert({
      blog_id: blogId,
      name: name.trim(),
      color,
      slug: name.trim().toLowerCase().replace(/\s+/g, "-"),
      position: folders.length,
    }).select().single();
    if (error) { toast.error("Erro ao criar pasta"); return null; }
    setFolders((prev) => [...prev, data as ArticleFolder]);
    toast.success(`Pasta "${name}" criada!`);
    return data as ArticleFolder;
  }, [blogId, folders.length]);

  const renameFolder = useCallback(async (id: string, name: string) => {
    if (!name.trim()) return;
    await db.from("article_folders").update({ name: name.trim() }).eq("id", id);
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name: name.trim() } : f));
    toast.success("Pasta renomeada");
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    await db.from("articles").update({ folder_id: null }).eq("folder_id", id);
    await db.from("article_folders").delete().eq("id", id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    toast.success("Pasta deletada");
  }, []);

  return { folders, loading, refetch: fetch, createFolder, renameFolder, deleteFolder };
}

export async function moveArticleToFolder(articleId: string, folderId: string | null) {
  const { error } = await db
    .from("articles")
    .update({ folder_id: folderId })
    .eq("id", articleId);
  if (error) { toast.error("Erro ao mover artigo"); return false; }
  return true;
}
