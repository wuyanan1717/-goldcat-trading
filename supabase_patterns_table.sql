-- 创建用户形态表
CREATE TABLE user_patterns (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  patterns JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view own patterns"
  ON user_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON user_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON user_patterns FOR UPDATE
  USING (auth.uid() = user_id);
