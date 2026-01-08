-- Sample data for daily_briefs table
-- Run this manually in Supabase SQL Editor to populate the database with test data

INSERT INTO daily_briefs (category, lang, content)
VALUES 
  ('airdrop_hunters', 'zh', '🎁 **空投快讯**

1. ZKsync 生态 DeFi 协议 SyncSwap 暗示即将启动代币空投计划
2. Move 语言公链 Aptos 推出新一轮社区激励活动  
3. 以太坊 L2 网络 Base 上线积分系统，早期用户可获额外奖励'),

  ('traders', 'zh', '📊 **交易策略分析**

市场观察：
- BTC 在 42K-44K 区间震荡，关注支撑位 41.8K
- ETH/BTC 汇率走强，山寨季信号渐显
- 链上数据显示大额稳定币持续流入交易所

建议：短线可适度参与反弹，中线继续观望'),

  ('onchain_alpha', 'zh', '🔍 **链上Alpha情报**

1. 某巨鲸地址在过去24h建仓 500 万美元 ARB
2. Ethereum Name Service (ENS) 域名注册量创历史新高  
3. Solana 链上 DEX 交易量突破 10 亿美元'),

  ('treasure_hunters', 'zh', '💎 **撸毛机会**

热门项目：
- Scroll 测试网交互活动持续进行中
- Starknet 生态 DEX Jediswap 推出交易挖矿
- Polygon zkEVM 桥接用户可领取 NFT 徽章'),

  ('onchain_data', 'zh', '📈 **链上数据**

- 以太坊 Gas 费降至 10 Gwei 以下
- DeFi TVL 回升至 500 亿美元  
- NFT 交易量环比增长 35%')

ON CONFLICT (category, lang) 
DO UPDATE SET 
  content = EXCLUDED.content,
  created_at = NOW();
