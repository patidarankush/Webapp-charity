# Temple Trust Lottery Management System

A comprehensive web application for managing lottery-based fundraising schemes for charitable temple trusts. The system handles 39,999 lottery tickets distributed across 1,819 diaries, with advanced features for ticket sales, diary management, and devotee database management.

## Features

### 🎯 Core Functionality
- **Live Dashboard**: Real-time status of ticket sales and amount collection
- **Ticket Management**: Complete CRUD operations for ticket sales with auto-fill functionality
- **Diary Management**: Allotment tracking, status management, and issuer management
- **Advanced Search**: Multi-criteria search across all data with export functionality

### 🔧 Technical Features
- **Auto-fill Logic**: Diary details automatically populated when lottery number is entered
- **Data Validation**: Comprehensive validation with duplicate detection and range checking
- **Audit Logging**: Complete audit trail for all data changes
- **Responsive Design**: Mobile-first design with Atlassian-inspired UI
- **Real-time Updates**: Live data synchronization with Supabase

### 📊 Dashboard Metrics
- Total tickets sold and revenue
- Diary allotment status distribution
- Issuer performance tracking
- Collection rate monitoring
- Visual charts and progress tracking

## Technology Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Supabase (PostgreSQL)
- **UI Framework**: Tailwind CSS with custom Atlassian-inspired components
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel
- **State Management**: React Hooks with React Hook Form

## Database Schema

### Core Tables
- **diaries**: 1,819 diaries with ticket ranges and expected amounts
- **issuers**: Ticket seller information and contact details
- **diary_allotments**: Allotment tracking with status management
- **ticket_sales**: Complete purchaser and transaction records
- **audit_logs**: Comprehensive change tracking

### Key Features
- Automatic diary number calculation from lottery numbers
- Status tracking (allotted, fully_sold, paid, returned)
- Amount collection monitoring
- Audit trail for all operations

## Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd lottery-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. This will create all tables, indexes, triggers, and initial data

### 4. Environment Configuration
```bash
cp env.example .env
```

Update `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start Development Server
```bash
npm run dev
# or
npm start
```

The application will be available at `http://localhost:3000`

## Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

### Domain Setup
1. Purchase domain from your preferred registrar
2. Configure DNS settings in Vercel
3. Enable SSL certificate (automatic with Vercel)

## Usage Guide

### Dashboard
- View real-time metrics and statistics
- Monitor collection progress
- Track issuer performance

### Ticket Sales
- Add new ticket sales with auto-fill functionality
- Edit existing records
- Search and filter tickets
- Export data for reporting

### Diary Management
- Allot diaries to issuers
- Track allotment status
- Manage issuer information
- Monitor collection progress

### Advanced Search
- Multi-criteria search across all data
- Export search results
- Filter by date ranges, amounts, and status

## Data Structure

### Lottery Tickets
- **Total**: 39,999 tickets
- **Price**: ₹500 each
- **Distribution**: 1,819 diaries
- **Range**: 1-39999

### Diaries
- **Standard Diaries**: 22 tickets each (Diaries 1-1818)
- **Last Diary**: 3 tickets (Diary 1819)
- **Expected Amount**: ₹11,000 (standard) / ₹1,500 (last diary)

### Auto-fill Logic
- Diary number calculated from lottery number
- Issuer details auto-populated from diary allotment
- Validation ensures lottery number matches diary range

## Security Features

- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Audit logging for all changes
- Secure API endpoints

## Performance Optimizations

- Database indexes on frequently queried columns
- Efficient queries with proper joins
- Pagination for large datasets
- Optimized React components with proper state management

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software developed for Temple Trust lottery management.
