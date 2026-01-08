-- 测试 INSERT 语句（模拟 trigger 行为）
-- 这将帮助我们找到真正的错误

-- 使用一个测试 UUID 和测试数据
INSERT INTO public.profiles (
    id, 
    username, 
    full_name, 
    avatar_url, 
    total_capital
)
VALUES (
    gen_random_uuid(),  -- 生成一个随机 UUID
    '测试用户123',       -- 测试 username
    '测试全名',          -- 测试 full_name
    NULL,               -- avatar_url 可以为空
    10000               -- total_capital
);

-- 如果这个查询成功，说明表结构没问题
-- 如果失败，我们就能看到具体的错误信息
