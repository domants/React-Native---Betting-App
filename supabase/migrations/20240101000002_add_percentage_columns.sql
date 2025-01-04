-- Add percentage and winnings columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS percentage_l2 DECIMAL(5,2) DEFAULT 0 CHECK (percentage_l2 >= 0 AND percentage_l2 <= 100),
ADD COLUMN IF NOT EXISTS percentage_l3 DECIMAL(5,2) DEFAULT 0 CHECK (percentage_l3 >= 0 AND percentage_l3 <= 100),
ADD COLUMN IF NOT EXISTS winnings_l2 DECIMAL(10,2) DEFAULT 0 CHECK (winnings_l2 >= 0),
ADD COLUMN IF NOT EXISTS winnings_l3 DECIMAL(10,2) DEFAULT 0 CHECK (winnings_l3 >= 0); 