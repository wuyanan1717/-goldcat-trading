-- 创建交易记录表
CREATE TABLE trades (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 交易基本信息
  date TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  
  -- 价格信息
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  
  -- 仓位信息
  margin NUMERIC NOT NULL,
  leverage NUMERIC NOT NULL,
  timeframe TEXT NOT NULL,
  pattern TEXT,
  
  -- 交易状态
  status TEXT DEFAULT 'open',
  profit_loss NUMERIC DEFAULT 0,
  violated_discipline BOOLEAN DEFAULT FALSE,
  
  -- 备注
  notes TEXT,
  review TEXT,
  
  -- 风险分析（JSON 存储）
  risk_analysis JSONB
);

-- 启用 RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能查看自己的交易
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能插入自己的交易
CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户只能更新自己的交易
CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 策略：用户只能删除自己的交易
CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- 创建索引提高查询性能
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);
