-- ============================================================================
-- 批量删除测试账号脚本
-- ============================================================================
-- ⚠️ 警告：此脚本会永久删除用户及其所有数据，请谨慎执行！
-- ============================================================================

-- 步骤 1: 预览将要删除的用户（建议先运行此步骤确认）
SELECT 
    'PREVIEW - Users to be deleted' as action,
    u.id,
    u.email,
    u.created_at,
    (SELECT COUNT(*) FROM trades WHERE user_id = u.id) as total_trades,
    (SELECT COUNT(*) FROM user_patterns WHERE user_id = u.id) as total_patterns
FROM auth.users u
WHERE u.email IN (
    '273310326@qq.com',
    'wulanlan1224@gmail.com',
    '15566929388@126.com',
    'wuffett1717@gmail.com',  -- 注意：您列表中是 'wuffett1717@gmail'，我添加了 .com
    'delu@deludynamics.com',
    'wyn1818@gmail.com',
    '540002731@qq.com',
    'test123@gmail.com',
    'info@hikoda.com',
    'wyn1919@126.com',
    'wyn2020@126.com'
)
ORDER BY u.created_at;

-- ============================================================================
-- 步骤 2: 执行删除（取消下面的注释来执行）
-- ============================================================================

/*
-- 2.1 删除用户的交易记录
DELETE FROM trades
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        '273310326@qq.com',
        'wulanlan1224@gmail.com',
        '15566929388@126.com',
        'wuffett1717@gmail.com',
        'delu@deludynamics.com',
        'wyn1818@gmail.com',
        '540002731@qq.com',
        'test123@gmail.com',
        'info@hikoda.com',
        'wyn1919@126.com',
        'wyn2020@126.com'
    )
);

-- 2.2 删除用户的自定义模式
DELETE FROM user_patterns
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        '273310326@qq.com',
        'wulanlan1224@gmail.com',
        '15566929388@126.com',
        'wuffett1717@gmail.com',
        'delu@deludynamics.com',
        'wyn1818@gmail.com',
        '540002731@qq.com',
        'test123@gmail.com',
        'info@hikoda.com',
        'wyn1919@126.com',
        'wyn2020@126.com'
    )
);

-- 2.3 删除用户的反馈（如果有此表）
DELETE FROM feedback
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        '273310326@qq.com',
        'wulanlan1224@gmail.com',
        '15566929388@126.com',
        'wuffett1717@gmail.com',
        'delu@deludynamics.com',
        'wyn1818@gmail.com',
        '540002731@qq.com',
        'test123@gmail.com',
        'info@hikoda.com',
        'wyn1919@126.com',
        'wyn2020@126.com'
    )
);

-- 2.4 删除 profiles 表中的用户资料
DELETE FROM public.profiles
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        '273310326@qq.com',
        'wulanlan1224@gmail.com',
        '15566929388@126.com',
        'wuffett1717@gmail.com',
        'delu@deludynamics.com',
        'wyn1818@gmail.com',
        '540002731@qq.com',
        'test123@gmail.com',
        'info@hikoda.com',
        'wyn1919@126.com',
        'wyn2020@126.com'
    )
);

-- 2.5 最后删除 auth.users 中的用户
DELETE FROM auth.users
WHERE email IN (
    '273310326@qq.com',
    'wulanlan1224@gmail.com',
    '15566929388@126.com',
    'wuffett1717@gmail.com',
    'delu@deludynamics.com',
    'wyn1818@gmail.com',
    '540002731@qq.com',
    'test123@gmail.com',
    'info@hikoda.com',
    'wyn1919@126.com',
    'wyn2020@126.com'
);

-- 2.6 验证删除结果
SELECT 
    'Deletion completed!' as status,
    COUNT(*) as remaining_test_accounts
FROM auth.users
WHERE email IN (
    '273310326@qq.com',
    'wulanlan1224@gmail.com',
    '15566929388@126.com',
    'wuffett1717@gmail.com',
    'delu@deludynamics.com',
    'wyn1818@gmail.com',
    '540002731@qq.com',
    'test123@gmail.com',
    'info@hikoda.com',
    'wyn1919@126.com',
    'wyn2020@126.com'
);
-- 如果返回 0，则删除成功
*/
