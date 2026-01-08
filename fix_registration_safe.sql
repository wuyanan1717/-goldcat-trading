-- 安全修复：仅更新注册触发器函数
-- Safe Fix: Only update the registration trigger function

-- 重写 handle_new_user 函数，确保正确保存 username
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

-- 成功提示
SELECT 'Registration fix applied successfully. Please try registering again.' as status;
