-- Update dashboard_stats view to include diaries_remaining
-- Run this in Supabase SQL Editor

DROP VIEW IF EXISTS dashboard_stats;

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

