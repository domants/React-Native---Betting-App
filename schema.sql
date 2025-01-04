-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum type
CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'sub_coordinator', 'usher');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table (lowercase, no quotes)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    user_role user_role DEFAULT 'usher',
    parent_id UUID REFERENCES users(id),
    percentage_l2 NUMERIC DEFAULT 0,
    percentage_l3 NUMERIC DEFAULT 0,
    winnings_l2 NUMERIC DEFAULT 0,
    winnings_l3 NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create game_results table
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_type TEXT NOT NULL CHECK (game_type IN ('last_two', 'swertres')),
    draw_time TIMESTAMPTZ NOT NULL,
    winning_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create bet_limits table
CREATE TABLE bet_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_type TEXT NOT NULL CHECK (game_type IN ('last_two', 'swertres')),
    number TEXT NOT NULL,
    max_amount NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Create bets table
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    bet_number TEXT NOT NULL,
    bet_amount NUMERIC NOT NULL,
    game_type TEXT NOT NULL CHECK (game_type IN ('last_two', 'swertres')),
    draw_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bet_limits_updated_at
    BEFORE UPDATE ON bet_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users are viewable by authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for admins"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );

CREATE POLICY "Users can update own record or admin can update any"
    ON users FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );

-- Bets table policies
CREATE POLICY "Bets are viewable by authenticated users"
    ON bets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own bets"
    ON bets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update bets"
    ON bets FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );

-- Game results policies
CREATE POLICY "Game results are viewable by authenticated users"
    ON game_results FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can insert game results"
    ON game_results FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    );

-- Bet limits policies
CREATE POLICY "Bet limits are viewable by authenticated users"
    ON bet_limits FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage bet limits"
    ON bet_limits FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND user_role = 'admin'
        )
    ); 