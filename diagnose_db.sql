-- 诊断脚本：检查 profiles 表的真实结构和触发器状态
-- Diagnostic script: Check actual profiles table structure and trigger status

-- 1. 查看 profiles 表的所有字段
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. 查看所有约束
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'profiles' AND table_schema = 'public';

-- 3. 查看当前的 trigger 函数定义
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. 检查 trigger 是否存在
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
