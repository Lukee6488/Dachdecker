-- ============================================================
-- Elektriker Dashboard – Auth & Roles Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name  TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'secretary'
                            CHECK (role IN ('secretary', 'project_manager')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select"     ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_select"     ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Add pm_user_id column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pm_user_id TEXT;

-- 3. RLS on orders & employees
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_authenticated"    ON public.orders;
DROP POLICY IF EXISTS "employees_authenticated" ON public.employees;

CREATE POLICY "orders_authenticated"    ON public.orders    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "employees_authenticated" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'secretary')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. pgcrypto extension (needed for crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 6. RPC function to create test accounts
CREATE OR REPLACE FUNCTION public.setup_test_accounts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sec_id uuid;
  pl_id  uuid;
BEGIN

  -- Sekretärin
  SELECT id INTO sec_id FROM auth.users WHERE email = 'sekretaer@heikes.internal';
  IF sec_id IS NULL THEN
    sec_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      sec_id,
      'authenticated', 'authenticated',
      'sekretaer@heikes.internal',
      crypt('Test1234!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('display_name', 'Sekretaerin', 'role', 'secretary'),
      false
    );
    BEGIN
      INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (sec_id, sec_id::text, sec_id, jsonb_build_object('sub', sec_id::text, 'email', 'sekretaer@heikes.internal'), 'email', NOW(), NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (sec_id, 'Sekretaerin', 'secretary')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Sekretaerin', role = 'secretary';

  -- Projektleiter
  SELECT id INTO pl_id FROM auth.users WHERE email = 'projektleiter1@heikes.internal';
  IF pl_id IS NULL THEN
    pl_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
      pl_id,
      'authenticated', 'authenticated',
      'projektleiter1@heikes.internal',
      crypt('Test1234!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('display_name', 'Projektleiter 1', 'role', 'project_manager'),
      false
    );
    BEGIN
      INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES (pl_id, pl_id::text, pl_id, jsonb_build_object('sub', pl_id::text, 'email', 'projektleiter1@heikes.internal'), 'email', NOW(), NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (pl_id, 'Projektleiter 1', 'project_manager')
  ON CONFLICT (id) DO UPDATE SET display_name = 'Projektleiter 1', role = 'project_manager';

  RETURN jsonb_build_object('success', true, 'sekretaer_id', sec_id, 'projektleiter_id', pl_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.setup_test_accounts() TO anon, authenticated;

-- 7. Order logs table
CREATE TABLE IF NOT EXISTS public.order_logs (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   TEXT        NOT NULL,
  action     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_authenticated" ON public.order_logs;
CREATE POLICY "logs_authenticated" ON public.order_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
