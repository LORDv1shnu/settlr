-- Migration script to add settlements table
-- Execute this script with: psql -U postgres -d settlr_db -f add-settlements-table.sql

-- Create settlements table
CREATE TABLE IF NOT EXISTS settlements (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    settled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_settlement_group
        FOREIGN KEY (group_id) 
        REFERENCES expense_groups(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_settlement_from_user
        FOREIGN KEY (from_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_settlement_to_user
        FOREIGN KEY (to_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    -- Ensure amount is positive
    CONSTRAINT chk_amount_positive
        CHECK (amount > 0),
    
    -- Ensure from_user and to_user are different
    CONSTRAINT chk_different_users
        CHECK (from_user_id != to_user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON settlements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_settled_at ON settlements(settled_at);

-- Add comments for documentation
COMMENT ON TABLE settlements IS 'Records of debt settlements between users in expense groups';
COMMENT ON COLUMN settlements.group_id IS 'Reference to the expense group';
COMMENT ON COLUMN settlements.from_user_id IS 'User who is paying/settling the debt';
COMMENT ON COLUMN settlements.to_user_id IS 'User who is receiving the payment';
COMMENT ON COLUMN settlements.amount IS 'Amount being settled in the transaction';
COMMENT ON COLUMN settlements.payment_method IS 'Method of payment (cash, bank transfer, etc.)';
COMMENT ON COLUMN settlements.notes IS 'Optional notes about the settlement';

-- Display success message
SELECT 'Settlements table created successfully!' AS status;

-- Show the table structure
\d settlements
