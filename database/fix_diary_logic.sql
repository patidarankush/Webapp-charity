-- Fix Diary Logic - Exclude Returned Diaries
-- Run this in Supabase SQL Editor

-- 1. Fix the issuer_performance view to exclude returned diaries
DROP VIEW IF EXISTS issuer_performance;

CREATE VIEW issuer_performance AS
SELECT 
    i.id,
    i.issuer_name,
    i.contact_number,
    COALESCE(da_stats.diaries_allotted, 0) as diaries_allotted,
    COALESCE(ts_stats.tickets_sold, 0) as tickets_sold,
    COALESCE(ts_stats.total_collected, 0) as total_collected,
    COALESCE(da_stats.expected_amount, 0) as expected_amount,
    ROUND(
        CASE 
            WHEN COALESCE(da_stats.expected_amount, 0) > 0 THEN 
                (COALESCE(ts_stats.total_collected, 0) / da_stats.expected_amount) * 100 
            ELSE 0 
        END, 2
    ) as collection_percentage
FROM issuers i
LEFT JOIN (
    SELECT 
        da.issuer_id,
        COUNT(da.id) as diaries_allotted,
        SUM(d.expected_amount) as expected_amount
    FROM diary_allotments da
    JOIN diaries d ON da.diary_id = d.id
    WHERE da.status != 'returned'  -- Exclude returned diaries
    GROUP BY da.issuer_id
) da_stats ON i.id = da_stats.issuer_id
LEFT JOIN (
    SELECT 
        ts.issuer_id,
        COUNT(ts.id) as tickets_sold,
        SUM(ts.amount_paid) as total_collected
    FROM ticket_sales ts
    GROUP BY ts.issuer_id
) ts_stats ON i.id = ts_stats.issuer_id;

-- 2. Fix the dashboard_stats view to exclude returned diaries
DROP VIEW IF EXISTS dashboard_stats;

CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM ticket_sales) as total_tickets_sold,
    (SELECT SUM(amount_paid) FROM ticket_sales) as total_revenue,
    (SELECT COUNT(*) FROM diary_allotments WHERE status != 'returned') as diaries_allotted,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'fully_sold') as diaries_fully_sold,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'paid') as diaries_paid,
    (SELECT COUNT(*) FROM diary_allotments WHERE status = 'returned') as diaries_returned,
    (SELECT COUNT(*) FROM diaries WHERE id NOT IN (
        SELECT diary_id FROM diary_allotments 
        WHERE status IN ('allotted', 'fully_sold', 'paid')
    )) as diaries_remaining,
    (SELECT SUM(amount_collected) FROM diary_allotments WHERE status != 'returned') as total_amount_collected,
    (SELECT SUM(expected_amount) FROM diaries d 
     JOIN diary_allotments da ON d.id = da.diary_id 
     WHERE da.status IN ('allotted', 'fully_sold')) as expected_amount_from_allotted;

ary number 