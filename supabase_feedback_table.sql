-- 创建 feedback 表用于存储用户反馈

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  user_email text NOT NULL,
  user_name text,
  feedback_type text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback(status);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at DESC);

-- RLS 策略：允许所有用户插入反馈
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 允许所有用户（包括匿名）插入反馈
CREATE POLICY "Allow anyone to insert feedback"
ON feedback FOR INSERT
TO public
WITH CHECK (true);

-- 只允许用户查看自己的反馈
CREATE POLICY "Users can view their own feedback"
ON feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 注释
COMMENT ON TABLE feedback IS '用户反馈表';
COMMENT ON COLUMN feedback.user_id IS '用户ID（可选，未登录用户为 NULL）';
COMMENT ON COLUMN feedback.user_email IS '用户邮箱（必填）';
COMMENT ON COLUMN feedback.user_name IS '用户姓名（可选）';
COMMENT ON COLUMN feedback.feedback_type IS '反馈类型: suggestion, bug, account, other';
COMMENT ON COLUMN feedback.content IS '反馈内容';
COMMENT ON COLUMN feedback.status IS '处理状态: pending, processing, resolved, closed';
