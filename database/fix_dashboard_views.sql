-- Fix Dashboard Views for Proper Diary Status Logic
-- This script updates the database views to correctly handle diary status changes

-- First, fix any incorrect amount_collected data
-- Reset amount_collected to 0 for all non-paid diaries
UPDATE diary_allotments 
SET amount_collected = 0 
WHERE status != 'paid';

-- Set amount_collected to 11000 for all paid diaries
UPDATE diary_allotments 
SET amount_collected = 11000 
WHERE status = 'paid';

-- Drop existing views
DROP VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS issuer_performance;

-- Create updated view for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM ticket_sales) as total_tickets_sold,
    (SELECT SUM(amount_paid) FROM ticket_sales) as total_revenue,
    -- Diaries allotted: count diaries that are allotted but NOT paid or returned
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'allotted') as diaries_allotted,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'fully_sold') as diaries_fully_sold,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'paid') as diaries_paid,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'returned') as diaries_returned,
    -- Remaining diaries: diaries that are not allotted to anyone
    (SELECT COUNT(*) FROM diaries WHERE id NOT IN (SELECT diary_id FROM diary_allotments WHERE status IN ('allotted', 'fully_sold', 'paid', 'returned'))) as diaries_remaining,
    (SELECT SUM(amount_collected) FROM diary_allotments) as total_amount_collected,
    -- Expected amount from diaries that are allotted but not yet paid
    (SELECT SUM(expected_amount) FROM diaries d 
     JOIN diary_allotments da ON d.id = da.diary_id 
     WHERE da.status = 'allotted') as expected_amount_from_allotted;

-- Create updated view for issuer performance with more precise logic
CREATE VIEW issuer_performance AS
SELECT 
    i.id,
    i.issuer_name,
    i.contact_number,
    -- Count diaries that are currently allotted (only 'allotted' status)
    (SELECT COUNT(*) FROM diary_allotments da2 WHERE da2.issuer_id = i.id AND da2.status = 'allotted') as diaries_allotted,
    -- Count diaries that are paid
    (SELECT COUNT(*) FROM diary_allotments da3 WHERE da3.issuer_id = i.id AND da3.status = 'paid') as diaries_paid,
    -- Count tickets sold only from currently allotted diaries
    (SELECT COUNT(*) FROM ticket_sales ts2 
     JOIN diary_allotments da4 ON ts2.diary_id = da4.diary_id 
     WHERE ts2.issuer_id = i.id AND da4.status = 'allotted') as tickets_sold,
    -- Sum amount collected only from currently allotted diaries
    (SELECT COALESCE(SUM(ts3.amount_paid), 0) FROM ticket_sales ts3 
     JOIN diary_allotments da5 ON ts3.diary_id = da5.diary_id 
     WHERE ts3.issuer_id = i.id AND da5.status = 'allotted') as total_collected,
    -- Expected amount from currently allotted diaries only
    (SELECT COALESCE(SUM(d2.expected_amount), 0) FROM diaries d2 
     JOIN diary_allotments da6 ON d2.id = da6.diary_id 
     WHERE da6.issuer_id = i.id AND da6.status = 'allotted') as expected_amount,
    ROUND(
        CASE 
            WHEN (SELECT COALESCE(SUM(d3.expected_amount), 0) FROM diaries d3 
                  JOIN diary_allotments da7 ON d3.id = da7.diary_id 
                  WHERE da7.issuer_id = i.id AND da7.status = 'allotted') > 0 THEN 
                ((SELECT COALESCE(SUM(ts4.amount_paid), 0) FROM ticket_sales ts4 
                  JOIN diary_allotments da8 ON ts4.diary_id = da8.diary_id 
                  WHERE ts4.issuer_id = i.id AND da8.status = 'allotted') / 
                 (SELECT COALESCE(SUM(d4.expected_amount), 0) FROM diaries d4 
                  JOIN diary_allotments da9 ON d4.id = da9.diary_id 
                  WHERE da9.issuer_id = i.id AND da9.status = 'allotted')) * 100 
            ELSE 0 
        END, 2
    ) as collection_percentage
FROM issuers i;
