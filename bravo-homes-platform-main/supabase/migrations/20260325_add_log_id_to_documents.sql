-- =========================================================
-- ATUALIZAÇÃO REQUERIDA NO BANCO DE DADOS: FOTOS NO DIÁRIO DE OBRAS
-- =========================================================

-- Adiciona a coluna log_id na tabela project_documents para suportar fotos por vistoria
ALTER TABLE public.project_documents
ADD COLUMN IF NOT EXISTS log_id UUID REFERENCES public.daily_logs(id) ON DELETE CASCADE;

-- Indexação para máxima performance ao carregar o histórico de logs
CREATE INDEX IF NOT EXISTS idx_project_documents_log_id ON public.project_documents(log_id);
