-- ============================================================================
-- 注册功能修复 SQL - 最终版本
-- ============================================================================
-- 此脚本会：
-- 1. 删除现有的有问题的 trigger 和 function
-- 2. 创建新的 handle_new_user 函数（包含 username 字段）
-- 3. 重新创建 trigger
-- ============================================================================

-- 步骤 1: 删除现有 trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 步骤 2: 删除现有函数
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 步骤 3: 创建新函数（包含 username）
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url, 
    total_capital
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    10000
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 4: 重新创建 trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 步骤 5: 验证修复成功
SELECT '✅ 修复完成！请验证以下内容：' as status;
SELECT '1. 运行验证查询确认函数包含 username 字段' as step_1;
SELECT '2. 刷新前端页面并尝试注册' as step_2;
SELECT '3. 检查 profiles 表中新用户的 username 字段' as step_3;
