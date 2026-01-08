-- 修复：只插入实际存在的列
-- Fix: Insert only columns that actually exist in profiles table

-- 步骤 1: 删除现有 trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 步骤 2: 删除现有函数
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 步骤 3: 创建新函数（只包含实际存在的列）
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username,
    email,
    total_capital
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    10000
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 4: 重新创建 trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 验证
SELECT '✅ 修复完成！现在 trigger 只插入实际存在的列。' as status;
