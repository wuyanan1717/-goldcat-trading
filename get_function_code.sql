-- 获取当前 handle_new_user 函数的完整定义
SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';
