-- 查看数据库中最新的 daily_briefs 数据
-- 检查是否包含 link 字段

SELECT 
    id,
    category,
    lang,
    created_at,
    jsonb_array_length(content) as item_count,
    content->0 as first_item_sample
FROM daily_briefs
WHERE category = 'treasure_hunters'
  AND lang = 'zh'
ORDER BY created_at DESC
LIMIT 1;
