-- ============================================
-- Fix: Allow admins to DELETE from clients and profiles
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. RLS Policy: Allow admin users to delete clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_can_delete_clients' AND tablename = 'clients'
  ) THEN
    CREATE POLICY admins_can_delete_clients ON public.clients
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 2. RLS Policy: Allow admin users to delete profiles (for partner removal)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_can_delete_profiles' AND tablename = 'profiles'
  ) THEN
    CREATE POLICY admins_can_delete_profiles ON public.profiles
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles AS admin_profile
          WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'
        )
      );
  END IF;
END $$;

-- 3. RLS Policy: Allow admin users to delete leads
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_can_delete_leads' AND tablename = 'leads'
  ) THEN
    CREATE POLICY admins_can_delete_leads ON public.leads
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 4. RLS Policy: Allow admin to delete messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_can_delete_messages' AND tablename = 'messages'
  ) THEN
    CREATE POLICY admins_can_delete_messages ON public.messages
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 5. RLS Policy: Allow admin to delete notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'admins_can_delete_notifications' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY admins_can_delete_notifications ON public.notifications
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- 6. RPC Fallback functions (uses SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.delete_client_by_id(client_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.leads WHERE leads.client_id = delete_client_by_id.client_id;
  DELETE FROM public.clients WHERE clients.id = delete_client_by_id.client_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_profile_by_id(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.leads SET partner_id = NULL WHERE leads.partner_id = delete_profile_by_id.profile_id;
  DELETE FROM public.messages WHERE messages.sender_id = delete_profile_by_id.profile_id OR messages.receiver_id = delete_profile_by_id.profile_id;
  DELETE FROM public.notifications WHERE notifications.user_id = delete_profile_by_id.profile_id;
  DELETE FROM public.profiles WHERE profiles.id = delete_profile_by_id.profile_id;
END;
$$;
