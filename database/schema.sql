-- Lottery Management System Database Schema
-- For Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE diary_status AS ENUM ('allotted', 'fully_sold', 'paid', 'returned');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- 1. Diaries Table
CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_number INTEGER UNIQUE NOT NULL CHECK (diary_number >= 1 AND diary_number <= 1819),
    ticket_start_range INTEGER NOT NULL,
    ticket_end_range INTEGER NOT NULL,
    total_tickets INTEGER NOT NULL CHECK (total_tickets IN (22, 3)),
    expected_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Issuers Table
CREATE TABLE issuers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issuer_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Diary Allotments Table
CREATE TABLE diary_allotments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
    issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
    allotment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status diary_status NOT NULL DEFAULT 'allotted',
    amount_collected DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(diary_id, issuer_id) -- A diary can only be allotted to one issuer at a time
);

-- 4. Ticket Sales Table
CREATE TABLE ticket_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lottery_number INTEGER UNIQUE NOT NULL CHECK (lottery_number >= 1 AND lottery_number <= 39999),
    purchaser_name VARCHAR(255) NOT NULL,
    purchaser_contact VARCHAR(20) NOT NULL,
    purchaser_address TEXT,
    issuer_id UUID REFERENCES issuers(id) ON DELETE CASCADE,
    diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ticket_sales_lottery_number ON ticket_sales(lottery_number);
CREATE INDEX idx_ticket_sales_purchaser_name ON ticket_sales(purchaser_name);
CREATE INDEX idx_ticket_sales_issuer_id ON ticket_sales(issuer_id);
CREATE INDEX idx_ticket_sales_diary_id ON ticket_sales(diary_id);
CREATE INDEX idx_ticket_sales_purchase_date ON ticket_sales(purchase_date);
CREATE INDEX idx_diary_allotments_status ON diary_allotments(status);
CREATE INDEX idx_diary_allotments_issuer_id ON diary_allotments(issuer_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_diaries_updated_at BEFORE UPDATE ON diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_issuers_updated_at BEFORE UPDATE ON issuers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diary_allotments_updated_at BEFORE UPDATE ON diary_allotments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ticket_sales_updated_at BEFORE UPDATE ON ticket_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to get diary number from lottery number
CREATE OR REPLACE FUNCTION get_diary_from_lottery_number(lottery_num INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Most diaries have 22 tickets, last diary has 3 tickets
    -- Diary 1: tickets 1-22, Diary 2: tickets 23-44, etc.
    -- Last diary (1819): tickets 39997-39999
    
    IF lottery_num <= 39996 THEN
        RETURN CEIL(lottery_num::DECIMAL / 22);
    ELSE
        RETURN 1819; -- Last diary
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate lottery number range for diary
CREATE OR REPLACE FUNCTION validate_lottery_number_for_diary(lottery_num INTEGER, diary_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    start_range INTEGER;
    end_range INTEGER;
BEGIN
    IF diary_num = 1819 THEN
        -- Last diary has tickets 39997-39999
        start_range := 39997;
        end_range := 39999;
    ELSE
        -- Regular diaries have 22 tickets each
        start_range := (diary_num - 1) * 22 + 1;
        end_range := diary_num * 22;
    END IF;
    
    RETURN lottery_num >= start_range AND lottery_num <= end_range;
END;
$$ LANGUAGE plpgsql;

-- Insert initial diary data
INSERT INTO diaries (diary_number, ticket_start_range, ticket_end_range, total_tickets, expected_amount)
SELECT 
    diary_num,
    CASE 
        WHEN diary_num = 1819 THEN 39997
        ELSE (diary_num - 1) * 22 + 1
    END,
    CASE 
        WHEN diary_num = 1819 THEN 39999
        ELSE diary_num * 22
    END,
    CASE 
        WHEN diary_num = 1819 THEN 3
        ELSE 22
    END,
    CASE 
        WHEN diary_num = 1819 THEN 1500.00
        ELSE 11000.00
    END
FROM generate_series(1, 1819) AS diary_num;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_user);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers
CREATE TRIGGER audit_ticket_sales AFTER INSERT OR UPDATE OR DELETE ON ticket_sales FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_diary_allotments AFTER INSERT OR UPDATE OR DELETE ON diary_allotments FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_issuers AFTER INSERT OR UPDATE OR DELETE ON issuers FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create view for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM ticket_sales) as total_tickets_sold,
    (SELECT SUM(amount_paid) FROM ticket_sales) as total_revenue,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'allotted') as diaries_allotted,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'fully_sold') as diaries_fully_sold,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'paid') as diaries_paid,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'returned') as diaries_returned,
    (SELECT COUNT(*) FROM diaries WHERE id NOT IN (SELECT diary_id FROM diary_allotments WHERE status IN ('allotted', 'fully_sold', 'paid'))) as diaries_remaining,
    (SELECT SUM(amount_collected) FROM diary_allotments) as total_amount_collected,
    (SELECT SUM(expected_amount) FROM diaries d 
     JOIN diary_allotments da ON d.id = da.diary_id 
     WHERE da.status IN ('allotted', 'fully_sold')) as expected_amount_from_allotted;

-- Create view for issuer performance
CREATE VIEW issuer_performance AS
SELECT 
    i.id,
    i.issuer_name,
    i.contact_number,
    COUNT(da.id) as diaries_allotted,
    COUNT(ts.id) as tickets_sold,
    COALESCE(SUM(ts.amount_paid), 0) as total_collected,
    COALESCE(SUM(d.expected_amount), 0) as expected_amount,
    ROUND(
        CASE 
            WHEN SUM(d.expected_amount) > 0 THEN 
                (COALESCE(SUM(ts.amount_paid), 0) / SUM(d.expected_amount)) * 100 
            ELSE 0 
        END, 2
    ) as collection_percentage
FROM issuers i
LEFT JOIN diary_allotments da ON i.id = da.issuer_id
LEFT JOIN diaries d ON da.diary_id = d.id
LEFT JOIN ticket_sales ts ON i.id = ts.issuer_id
GROUP BY i.id, i.issuer_name, i.contact_number;
