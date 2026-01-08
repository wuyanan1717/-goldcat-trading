-- Clear cached daily briefs to force regeneration with new 2000 char limit
DELETE FROM daily_briefs 
WHERE category IN ('airdrop_hunters', 'traders', 'onchain_alpha', 'treasure_hunters', 'cryptopanic_hot');
