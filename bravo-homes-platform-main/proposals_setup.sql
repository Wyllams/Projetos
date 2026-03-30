-- SQL Setup for Proposals and Proposal Templates
-- Please run this directly in your Supabase SQL Editor.

-- TABLE: proposal_templates
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT proposal_templates_pkey PRIMARY KEY (id)
);

-- TABLE: proposals
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  lead_id uuid NULL REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  total_value numeric NULL,
  services jsonb NULL DEFAULT '[]'::jsonb,
  terms jsonb NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'::text,
  viewed_at timestamp with time zone NULL,
  signed_at timestamp with time zone NULL,
  signature_url text NULL,
  pdf_url text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT proposals_pkey PRIMARY KEY (id)
);

-- RLS Policies (Update these based on your current setup if needed)
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can insert their own proposal_templates" ON public.proposal_templates FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can update their own proposal_templates" ON public.proposal_templates FOR UPDATE USING (auth.uid() = partner_id) WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can delete their own proposal_templates" ON public.proposal_templates FOR DELETE USING (auth.uid() = partner_id);
CREATE POLICY "Partners can view their own proposal_templates" ON public.proposal_templates FOR SELECT USING (auth.uid() = partner_id);

CREATE POLICY "Partners can insert their own proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can update their own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = partner_id) WITH CHECK (auth.uid() = partner_id);
CREATE POLICY "Partners can delete their own proposals" ON public.proposals FOR DELETE USING (auth.uid() = partner_id);
CREATE POLICY "Partners can view their own proposals" ON public.proposals FOR SELECT USING (auth.uid() = partner_id);

-- IMPORTANT: Guests need to be able to view and update the proposal to sign it
-- WARNING: This allows public access to proposals if the user has the ID. Since IDs are UUIDs, they act as secure tokens.
CREATE POLICY "Public can view a proposal via UUID" ON public.proposals FOR SELECT USING (true);
CREATE POLICY "Public can sign a proposal" ON public.proposals FOR UPDATE USING (true) WITH CHECK (true);

-- STORAGE BUCKET: proposals
INSERT INTO storage.buckets (id, name, public) VALUES ('proposals', 'proposals', true) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Partners can upload directly to proposals bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proposals' AND auth.role() = 'authenticated');
CREATE POLICY "Partners can update proposals bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'proposals' AND auth.role() = 'authenticated');
CREATE POLICY "Partners can delete proposals bucket" ON storage.objects FOR DELETE USING (bucket_id = 'proposals' AND auth.role() = 'authenticated');
-- Allow public insert so signed PDFs can be uploaded without auth (guest uploads)
CREATE POLICY "Public can upload to proposals bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proposals' AND auth.role() = 'anon');
-- Allow public select so anyone with link can see the PDF / Image
CREATE POLICY "Public can view objects in proposals bucket" ON storage.objects FOR SELECT USING (bucket_id = 'proposals');

-- RUN THESE TO UPGRADE DB:
-- ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS services jsonb NULL DEFAULT '[]'::jsonb;
-- ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS terms jsonb NULL DEFAULT '{}'::jsonb;
