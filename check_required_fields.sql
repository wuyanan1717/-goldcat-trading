-- 查看 profiles 表的必需字段（NOT NULL 的列）
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND is_nullable = 'NO'  -- 只显示不允许 NULL 的列
ORDER BY ordinal_position;
