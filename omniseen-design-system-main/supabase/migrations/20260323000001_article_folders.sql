-- ============================================================
-- OMNISEEN: Article Folders (Sistema de Pastas)
-- Migration: article_folders table + folder_id col on articles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.article_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id     UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT,
  color       TEXT DEFAULT '#6366f1',
  icon        TEXT DEFAULT 'folder',
  parent_id   UUID REFERENCES public.article_folders(id) ON DELETE CASCADE,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.article_folders(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.article_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_folders_owner_all"
  ON public.article_folders
  FOR ALL
  USING (blog_id IN (SELECT id FROM public.blogs WHERE user_id = auth.uid()))
  WITH CHECK (blog_id IN (SELECT id FROM public.blogs WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_folders_blog_id ON public.article_folders(blog_id);
CREATE INDEX IF NOT EXISTS idx_articles_folder_id ON public.articles(folder_id);
