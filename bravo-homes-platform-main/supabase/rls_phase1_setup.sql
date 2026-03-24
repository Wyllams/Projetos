-- BRAVO HOMES: Políticas de Segurança RLS (Fase 1)
-- Execute este script no painel SQL do Supabase (SQL Editor)

-- 1. Habilitando RLS nas tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'profiles'
-- Apenas usuários autenticados podem ver os perfis (necessário para a listagem na AdminDashboard)
DROP POLICY IF EXISTS "Perfis visíveis para autenticados" ON public.profiles;
CREATE POLICY "Perfis visíveis para autenticados" 
ON public.profiles FOR SELECT TO authenticated USING (true);

-- Usuário pode alterar seu próprio perfil
DROP POLICY IF EXISTS "Usuário altera próprio perfil" ON public.profiles;
CREATE POLICY "Usuário altera próprio perfil" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Trigger para bloquear a alteração de 'role' (Apenas admins podem mudar níveis de permissão)
CREATE OR REPLACE FUNCTION public.restrict_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
      RAISE EXCEPTION 'Apenas administradores podem modificar permissões de conta.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_restrict_role_update ON public.profiles;
CREATE TRIGGER tr_restrict_role_update 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW EXECUTE FUNCTION public.restrict_role_update();

-- 3. Políticas para 'clients'
-- Clientes podem ver seus próprios dados
DROP POLICY IF EXISTS "Clientes visualizam próprios dados" ON public.clients;
CREATE POLICY "Clientes visualizam próprios dados"
ON public.clients FOR SELECT TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins visualizam todos os clientes
DROP POLICY IF EXISTS "Admins visualizam todos os clientes" ON public.clients;
CREATE POLICY "Admins visualizam todos os clientes"
ON public.clients FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- 4. Políticas para 'leads'
-- Bloqueando inserção anônima (forçando uso da Edge Function submit-lead)
DROP POLICY IF EXISTS "Inserção de leads apenas service_role" ON public.leads;
CREATE POLICY "Inserção de leads apenas service_role"
ON public.leads FOR INSERT TO authenticated, anon
WITH CHECK (false); -- Anon/Autenticados normais não inserem, apenas edge functions bypassam RLS

-- Admins visualizam/editam tudo
DROP POLICY IF EXISTS "Admins editam leads" ON public.leads;
CREATE POLICY "Admins editam leads"
ON public.leads FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Parceiros veem apenas leads atribuídos a eles
DROP POLICY IF EXISTS "Parceiros veem leads designados" ON public.leads;
CREATE POLICY "Parceiros veem leads designados"
ON public.leads FOR SELECT TO authenticated
USING (partner_id = auth.uid());

-- 5. Políticas para 'projects'
-- Admins visualizam/editam tudo
DROP POLICY IF EXISTS "Admins editam projetos" ON public.projects;
CREATE POLICY "Admins editam projetos"
ON public.projects FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Parceiros veem apenas os projetos designados a eles
DROP POLICY IF EXISTS "Parceiros veem projetos designados" ON public.projects;
CREATE POLICY "Parceiros veem projetos designados"
ON public.projects FOR SELECT TO authenticated
USING (partner_id = auth.uid());

-- Clientes veem apenas os projetos designados ao seu client_id
DROP POLICY IF EXISTS "Clientes veem próprios projetos" ON public.projects;
CREATE POLICY "Clientes veem próprios projetos"
ON public.projects FOR SELECT TO authenticated
USING (client_id IN (SELECT id FROM public.clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
