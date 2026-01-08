-- 移除用户名长度限制
-- Remove username length constraint

-- 删除现有的长度约束
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS username_length;

-- 成功提示
SELECT 'Username length constraint removed. You can now use any username length.' as status;
