-- 简单测试：只插入最基本的字段
-- 这将帮助我们逐步排查哪些列可以用

INSERT INTO public.profiles (id, username, email)
VALUES (
    gen_random_uuid(),
    '测试用户',
    'test@example.com'
)
RETURNING *;

-- 如果这个成功，说明这3个列没问题
-- 如果失败，会显示具体哪个列有问题
