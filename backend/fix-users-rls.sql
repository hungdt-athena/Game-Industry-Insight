-- =====================================================
-- FIX RLS POLICIES FOR USERS TABLE
-- Run this to fix the infinite loop issue
-- =====================================================

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update any user" ON public.users;
DROP POLICY IF EXISTS "Moderator can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin/Mod can approve users" ON public.users;

-- =====================================================
-- NEW SIMPLIFIED POLICIES
-- =====================================================

-- 1. Allow ALL authenticated users to read their OWN profile
-- This is the critical fix - no circular dependency
CREATE POLICY "Users can read own profile" 
  ON public.users FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- 2. Create a security definer function to check roles safely
-- This bypasses RLS and prevents circular dependency
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id LIMIT 1;
$$;

-- 3. Admin/Moderator can view all users (using the safe function)
CREATE POLICY "Admin can view all users" 
  ON public.users FOR SELECT 
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Moderator can view all users" 
  ON public.users FOR SELECT 
  TO authenticated
  USING (
    public.get_user_role(auth.uid()) IN ('admin', 'moderator')
  );

-- 4. Users can update their own profile (display_name, avatar_url only)
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Admin can update any user
CREATE POLICY "Admin can update any user" 
  ON public.users FOR UPDATE 
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 6. Admin can insert users (for invite flow)
CREATE POLICY "Admin can insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
