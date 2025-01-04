-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for roles and bet types if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Admin', 'Coordinator', 'Sub-Coordinator', 'Usher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bet_type AS ENUM ('L2', '3D');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    parent_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    percentage_balance DECIMAL(5,2) DEFAULT 100.00 CHECK (percentage_balance >= 0 AND percentage_balance <= 100),
    winnings_balance DECIMAL(10,2) DEFAULT 0.00 CHECK (winnings_balance >= 0),
    CONSTRAINT valid_parent_hierarchy CHECK (
        (role = 'Admin' AND parent_id IS NULL) OR
        (role = 'Coordinator' AND parent_id IS NOT NULL) OR
        (role = 'Sub-Coordinator' AND parent_id IS NOT NULL) OR
        (role = 'Usher' AND parent_id IS NOT NULL)
    )
);

-- Create Draw Results table
CREATE TABLE draw_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draw_date DATE UNIQUE NOT NULL,
    l2_result CHAR(2) CHECK (l2_result ~ '^[0-9]{2}$'),
    d3_result CHAR(3) CHECK (d3_result ~ '^[0-9]{3}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Bet Limits table
CREATE TABLE bet_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number_type bet_type NOT NULL,
    limit_amount DECIMAL(10,2) NOT NULL CHECK (limit_amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(number_type)
);

-- Create Bets table
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    bet_number TEXT NOT NULL,
    bet_amount DECIMAL(10,2) NOT NULL CHECK (bet_amount > 0),
    bet_type bet_type NOT NULL,
    draw_date DATE NOT NULL REFERENCES draw_results(draw_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_bet_number CHECK (
        (bet_type = 'L2' AND bet_number ~ '^[0-9]{2}$') OR
        (bet_type = '3D' AND bet_number ~ '^[0-9]{3}$')
    )
);

-- Create Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    draw_date DATE NOT NULL REFERENCES draw_results(draw_date),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create User Hierarchy table
CREATE TABLE user_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES users(id),
    child_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, child_id),
    CHECK (parent_id != child_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_parent_id ON users(parent_id);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_draw_date ON bets(draw_date);
CREATE INDEX idx_bets_bet_type ON bets(bet_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_draw_date ON payouts(draw_date);
CREATE INDEX idx_user_hierarchy_parent_id ON user_hierarchy(parent_id);
CREATE INDEX idx_user_hierarchy_child_id ON user_hierarchy(child_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create functions for maintaining user hierarchy
CREATE OR REPLACE FUNCTION maintain_user_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        INSERT INTO user_hierarchy (parent_id, child_id)
        VALUES (NEW.parent_id, NEW.id)
        ON CONFLICT (parent_id, child_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user hierarchy maintenance
CREATE TRIGGER user_hierarchy_maintenance
AFTER INSERT OR UPDATE OF parent_id ON users
FOR EACH ROW
EXECUTE FUNCTION maintain_user_hierarchy();

-- Create function for audit logging
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, details)
    VALUES (
        COALESCE(current_setting('app.current_user_id', true)::UUID, NEW.id),
        TG_ARGV[0],
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'action', TG_OP,
            'new_data', row_to_json(NEW),
            'old_data', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE null END
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for important tables
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit('user_modification');

CREATE TRIGGER bets_audit
AFTER INSERT OR UPDATE OR DELETE ON bets
FOR EACH ROW EXECUTE FUNCTION log_audit('bet_modification');

CREATE TRIGGER draw_results_audit
AFTER INSERT OR UPDATE OR DELETE ON draw_results
FOR EACH ROW EXECUTE FUNCTION log_audit('draw_result_modification');

-- Create function to check if a user is an admin
CREATE OR REPLACE FUNCTION check_is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT (role = 'Admin')
    INTO is_admin
    FROM users
    WHERE id = user_id;
    
    RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION check_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_is_admin(UUID) TO service_role; 