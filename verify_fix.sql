-- 验证修复是否成功
-- 运行这个查询来确认 handle_new_user 函数包含 username 字段

SELECT pg_get_functiondef(oid) as function_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 预期结果：函数定义中应该包含 "new.raw_user_meta_data->>'username'"
