-- 查看所有约束的详细信息
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints AS tc
LEFT JOIN information_schema.check_constraints AS cc
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'profiles';
