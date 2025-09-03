# Database Setup Guide

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **LotteryManage** (ID: akeswgiwdsxdbmokftws)

## Step 2: Run Database Schema

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire content from `database/schema.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

## Step 3: Verify Tables Created

After running the schema, you should see these tables in the **Table Editor**:

- `diaries` - Contains all 1,819 diary records
- `issuers` - For managing ticket sellers
- `diary_allotments` - Tracks diary assignments to issuers
- `ticket_sales` - Records of sold tickets
- `audit_logs` - Change tracking

## Step 4: Verify Views Created

Check that these views are created in the **Database** section:

- `dashboard_stats` - Aggregated statistics for dashboard
- `issuer_performance` - Performance metrics for issuers

## Step 5: Test the Application

1. Restart your development server: `npm run dev`
2. Open `http://localhost:3000`
3. The dashboard should now load with real data from Supabase

## Important Notes

- The schema includes 1,819 diary records with proper ticket ranges
- All tables have proper constraints and relationships
- Audit logging is enabled for all changes
- The system is ready for production use

## Troubleshooting

If you encounter any issues:

1. Check the Supabase logs in the dashboard
2. Verify all tables were created successfully
3. Ensure the views are working properly
4. Check browser console for any connection errors
