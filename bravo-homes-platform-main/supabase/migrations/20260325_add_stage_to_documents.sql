-- =========================================================
-- ATUALIZAÇÃO REQUERIDA NO BANCO DE DADOS: FOTOS POR ETAPA
-- =========================================================

-- Adiciona a coluna stage_id na tabela project_documents para suportar fotos por estágio
ALTER TABLE public.project_documents
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL;

-- Indexação para não perder performance na Galeria
CREATE INDEX IF NOT EXISTS idx_project_documents_stage_id ON public.project_documents(stage_id);
