-- ============================================================================
-- 删除第二批测试账号（5个账号）
-- ============================================================================
-- ⚠️ 警告：此脚本会永久删除用户及其所有数据！
-- ============================================================================

-- 步骤 1: 预览将要删除的用户
SELECT 
    'PREVIEW - Users to be deleted' as action,
    u.id,
    u.email,
    u.created_at,
    (SELECT COUNT(*) FROM trades WHERE user_id = u.id) as total_trades,
    (SELECT COUNT(*) FROM user_patterns WHERE user_id = u.id) as total_patterns
FROM auth.users u
WHERE u.email IN (
    'wuffett1717@gmail.com',
    'wyn17171993@gmail.com',
    'wuffett3030@gmail.com',
    '1861230@126.com',
    '1992@gmail.com'
)
ORDER BY u.created_at;

-- ============================================================================
-- 步骤 2: 执行删除（已去掉注释，可直接运行）
-- ============================================================================

-- 2.1 删除 daily_scan_counts
DELETE FROM daily_scan_counts
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'wuffett1717@gmail.com',
        'wyn17171993@gmail.com',
        'wuffett3030@gmail.com',
        '1861230@126.com',
        '1992@gmail.com'
    )
);

-- 2.2 删除交易记录
DELETE FROM trades
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'wuffett1717@gmail.com',
        'wyn17171993@gmail.com',
        'wuffett3030@gmail.com',
        '1861230@126.com',
        '1992@gmail.com'
    )
);

-- 2.3 删除自定义模式
DELETE FROM user_patterns
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'wuffett1717@gmail.com',
        'wyn17171993@gmail.com',
        'wuffett3030@gmail.com',
        '1861230@126.com',
        '1992@gmail.com'
    )
);

-- 2.4 删除反馈
DELETE FROM feedback
WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'wuffett1717@gmail.com',
        'wyn17171993@gmail.com',
        'wuffett3030@gmail.com',
        '1861230@126.com',
        '1992@gmail.com'
    )
);

-- 2.5 删除用户资料
DELETE FROM public.profiles
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
        'wuffett1717@gmail.com',
        'wyn17171993@gmail.com',
        'wuffett3030@gmail.com',
        '1861230@126.com',
        '1992@gmail.com'
    )
);

-- 2.6 删除认证信息
DELETE FROM auth.users
WHERE email IN (
    'wuffett1717@gmail.com',
    'wyn17171993@gmail.com',
    'wuffett3030@gmail.com',
    '1861230@126.com',
    '1992@gmail.com'
);

-- 2.7 验证删除结果
SELECT 
    'Deletion completed!' as status,
    COUNT(*) as remaining_test_accounts
FROM auth.users
WHERE email IN (
    'wuffett1717@gmail.com',
    'wyn17171993@gmail.com',
    'wuffett3030@gmail.com',
    '1861230@126.com',
    '1992@gmail.com'
);
-- 如果返回 0，则删除成功
