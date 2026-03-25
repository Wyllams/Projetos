-- ============================================================
-- OMNISEEN: Article Analytics
-- Migration: article_analytics table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.article_analytics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  blog_id       UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  views         INT NOT NULL DEFAULT 0,
  unique_views  INT NOT NULL DEFAULT 0,
  clicks        INT NOT NULL DEFAULT 0,
  read_time_avg NUMERIC(6,2) DEFAULT 0,   -- seconds
  bounces       INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (article_id, date)
);

ALTER TABLE public.article_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "article_analytics_owner"
  ON public.article_analytics
  FOR ALL
  USING (blog_id IN (SELECT id FROM public.blogs WHERE user_id = auth.uid()))
  WITH CHECK (blog_id IN (SELECT id FROM public.blogs WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_analytics_article ON public.article_analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_article_analytics_blog    ON public.article_analytics(blog_id);
CREATE INDEX IF NOT EXISTS idx_article_analytics_date    ON public.article_analytics(date);
