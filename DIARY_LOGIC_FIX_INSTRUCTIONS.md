# Diary Logic Fix Instructions

## Problem Identified

The dashboard was incorrectly counting **returned diaries** in the "diaries allotted" and "expected amount" calculations. 

### Current Issue:
- **Ankush**: Shows 3 diaries allotted (including 1 returned diary)
- **Expected Amount**: Includes returned diary amounts
- **Logic**: Returned diaries should not count toward active allotments

### Correct Logic:
- **Ankush**: Should show 2 diaries allotted (excluding 1 returned diary)
- **Expected Amount**: Should only include active (non-returned) diaries
- **Returned diaries**: Should be tracked separately but not included in active counts

## Current Data Analysis

**Before Fix:**
- Ankush: 3 total allotments (2 active + 1 returned)
- Expected Amount: ₹33,000 (including returned diary)

**After Fix:**
- Ankush: 2 active diaries allotted
- Expected Amount: ₹22,000 (excluding returned diary)
- Returned: 1 diary (tracked separately)

## Solution

Run the SQL fix in your **Supabase SQL Editor**:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Create a new query

### Step 2: Run the Fix SQL
Copy and paste the contents of `database/fix_diary_logic.sql` and run it.

### Step 3: Verify the Fix
After running the SQL, the dashboard should show:

**Expected Results:**
- **Ankush**: 2 diaries allotted, ₹22,000 expected, 3 tickets sold, ₹1,500 collected (6.82%)
- **ramesh**: 1 diary allotted, ₹11,000 expected, 2 tickets sold, ₹1,000 collected (9.09%)
- **rajesh**: 1 diary allotted, ₹11,000 expected, 0 tickets sold, ₹0 collected (0%)

**Dashboard Stats:**
- Total Diaries Allotted: 4 (active only)
- Diaries Returned: 1 (tracked separately)
- Expected Amount from Allotted: ₹44,000

## What the Fix Does

1. **Excludes returned diaries** from "diaries allotted" count
2. **Excludes returned diary amounts** from expected amount calculations
3. **Maintains separate tracking** of returned diaries
4. **Fixes collection percentages** to be based on active diaries only
5. **Ensures accurate dashboard statistics**

## Key Changes

### Issuer Performance View:
- `WHERE da.status != 'returned'` - Excludes returned diaries
- Only counts active diary allotments
- Only includes expected amounts from active diaries

### Dashboard Stats View:
- `WHERE status != 'returned'` - Excludes returned diaries from allotted count
- Separate count for returned diaries
- Expected amount calculation excludes returned diaries

## Files to Run

Run the SQL from: `database/fix_diary_logic.sql`

## After Running the Fix

1. Refresh your webapp dashboard
2. Verify that:
   - Ankush shows 2 diaries allotted (not 3)
   - Expected amount for Ankush is ₹22,000 (not ₹33,000)
   - Collection percentages are calculated correctly
   - Returned diaries are tracked separately

## Business Logic

This fix implements the correct business logic:
- **Active Diaries**: Only count toward issuer performance
- **Returned Diaries**: Tracked separately, don't affect performance metrics
- **Expected Amounts**: Based only on active diary allotments
- **Collection Rates**: Calculated against active diary expectations

The fix ensures that returned diaries don't inflate performance metrics or expected collection amounts.


