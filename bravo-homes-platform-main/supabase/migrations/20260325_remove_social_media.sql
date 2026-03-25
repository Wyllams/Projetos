-- ============================================
-- Feature Removal: Social Media Integration
-- ============================================

DO $$ BEGIN
  -- Drop tables if they exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_posts') THEN
    DROP TABLE public.social_posts CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'social_accounts') THEN
    DROP TABLE public.social_accounts CASCADE;
  END IF;
END $$;
