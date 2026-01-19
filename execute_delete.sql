-- ============================================================================
-- 执行删除测试账号（已去掉注释，可直接运行）
-- ============================================================================
-- ⚠️ 警告：此脚本会永久删除用户及其所有数据！
-- ============================================================================

-- 2.1 删除 daily_scan_counts 表中的记录（必须先删除，否则有外键约束）
DELETE FROM daily_scan_counts
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

-- 2.2 删除用户的交易记录
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

-- 2.3 删除用户的自定义模式
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

-- 2.4 删除用户的反馈（如果有此表）
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

-- 2.5 删除 profiles 表中的用户资料
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

-- 2.6 最后删除 auth.users 中的用户
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

-- 2.7 验证删除结果
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
