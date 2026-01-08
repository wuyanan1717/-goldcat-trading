-- 强制修复：删除旧函数并重新创建（确保包含 username）
-- Force fix: Drop old function and recreate with username support

-- 1. 删除旧的 trigger（必须先删除 trigger 才能删除函数）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 删除旧的函数
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. 重新创建函数（包含 username）
CREATE FUNCTION public.handle_new_user()
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
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建 trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. 验证修复成功
SELECT '✅ 修复成功！现在 handle_new_user 函数已包含 username 字段。请刷新页面并重新注册。' as status;
