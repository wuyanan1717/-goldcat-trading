-- 最简化的 trigger 函数：只插入必需的字段
-- Minimal trigger function: only insert required fields

-- 步骤 1: 删除现有 trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 步骤 2: 删除现有函数
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 步骤 3: 创建最简化的函数
-- 只插入 id 和可选的 username
-- created_at 会自动使用默认值
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 4: 重新创建 trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 验证
SELECT '✅ 最简化修复完成！Trigger 现在只插入 id 和 username。' as status;
