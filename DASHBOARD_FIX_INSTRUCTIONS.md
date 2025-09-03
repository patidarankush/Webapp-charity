# Dashboard Statistics Fix Instructions

## Problem Identified

The dashboard is showing incorrect statistics due to issues in the database views:

1. **Issuer Performance View**: Shows inflated numbers due to Cartesian product in JOINs
   - Ankush shows 9 diaries and 9 tickets (should be 2 diaries, 3 tickets)
   - ramesh shows 2 diaries and 2 tickets (should be 1 diary, 2 tickets)

2. **Dashboard Stats**: The "Diaries Allotted" count may be inconsistent

## Root Cause

The `issuer_performance` view uses multiple LEFT JOINs that create a Cartesian product:
- When an issuer has multiple diary allotments AND multiple ticket sales
- The JOIN creates duplicate rows (diaries × tickets)
- COUNT() functions count these duplicates instead of unique records

## Solution

Run the following SQL in your **Supabase SQL Editor**:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query

### Step 2: Run the Fix SQL
Copy and paste the contents of `database/fix_dashboard_issues.sql` and run it.

### Step 3: Verify the Fix
After running the SQL, the dashboard should show correct numbers:

**Expected Results:**
- **Ankush**: 2 diaries allotted, 3 tickets sold, ₹1,500 collected
- **ramesh**: 1 diary allotted, 2 tickets sold, ₹1,000 collected  
- **rajesh**: 1 diary allotted, 0 tickets sold, ₹0 collected

## What the Fix Does

1. **Replaces the problematic view** with subqueries instead of JOINs
2. **Eliminates Cartesian products** by calculating counts separately
3. **Ensures accurate statistics** for dashboard display
4. **Maintains all existing functionality** while fixing the data accuracy

## Files to Run

Run the SQL from: `database/fix_dashboard_issues.sql`

This will fix both the `issuer_performance` and `dashboard_stats` views.

## After Running the Fix

1. Refresh your webapp dashboard
2. Verify that the numbers now match the actual data
3. Check that all statistics are consistent and accurate

The fix ensures that:
- ✅ Diary counts are accurate
- ✅ Ticket counts are accurate  
- ✅ Revenue calculations are correct
- ✅ Collection percentages are properly calculated

