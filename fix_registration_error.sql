-- 修复注册报错：重置用户表触发器和权限
-- Fix Registration Error: Repair Profiles Table & Trigger Logic

-- 1. 确保 profiles 表存在且字段完整
-- Ensure profiles table exists with correct schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  total_capital NUMERIC DEFAULT 0,
  -- 约束：用户名至少3个字符
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 补充字段（如果缺失）
-- Add total_capital column if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_capital') THEN
    ALTER TABLE public.profiles ADD COLUMN total_capital NUMERIC DEFAULT 0;
  END IF;
  
  -- Add username column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;
END $$;

-- 2. 启用行级安全 (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 重置权限策略
-- Reset RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. 修复自动创建用户的 Trigger 函数
-- Fix Trigger Function to safely insert profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url, total_capital)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 重新绑定 Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 成功反馈
SELECT 'Fix applied successfully' as status;
