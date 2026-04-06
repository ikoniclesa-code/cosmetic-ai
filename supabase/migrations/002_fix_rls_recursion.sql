-- =============================================
-- FIX: RLS Recursion on profiles table
-- =============================================
-- Problem: Admin policies on "profiles" query the profiles table itself,
-- causing infinite recursion in PostgreSQL RLS evaluation.
-- Fix: Use a SECURITY DEFINER function that bypasses RLS.
--
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create a SECURITY DEFINER function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop old recursive policies on PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3. Recreate admin policies using the safe function
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- 4. Fix admin policies on other tables too (same recursion risk)
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
CREATE POLICY "Admins can view all businesses"
  ON public.businesses FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all credit transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all generations" ON public.generations;
CREATE POLICY "Admins can view all generations"
  ON public.generations FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all admin logs" ON public.admin_logs;
CREATE POLICY "Admins can view all admin logs"
  ON public.admin_logs FOR SELECT
  USING (public.is_admin());
