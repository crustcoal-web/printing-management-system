# NAAM Studio - Order & Business Management System

A production-ready, professional Order Management, Customer Ledger, Payment, Expense, Profit Analytics, and Microsoft Word DOCX Order Slip Generator built for **NAAM Studio** custom printing business.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router) & TypeScript
- **Database & Auth**: Supabase PostgreSQL, Supabase Auth, Row-Level Security (RLS)
- **Styling**: Tailwind CSS & Lucide Icons
- **Analytics Charts**: Recharts
- **Word Order Slips**: `docx` library (Native A4 Portrait 2×5 Grid Table Layout)
- **Report Exports**: `xlsx` (Excel XLSX), CSV, and PDF Print Formatting

---

## Key Features

1. **NAAM Studio Official Branding**:
   - Official NAAM Studio logo embedded across Login, Sidebar, Header, Settings, and customer-facing Word Order Slips.

2. **Strict Financial Security (Role-Based RLS)**:
   - **Admin**: Full system access.
   - **Manager**: Orders, Customers, Products, Payments, Expenses, Reports.
   - **Staff**: Orders, Customers, Products, Payments, Order Slips.
   - **Financial Data Isolation**: Database-level Security Definer views and RLS policies ensure Staff users CANNOT query or view cost prices, internal delivery costs, net profit, profit margins, or operational expense reports.

3. **Zero Financial Data Drift**:
   - Atomic calculation formulas guarantee mathematical consistency:
     - `Gross Revenue = Subtotal - Discount + Delivery Charges + Additional Charges`
     - `Total Internal Cost = Product Cost + Delivery Cost + Other Internal Costs`
     - `Net Profit = Gross Revenue - Total Internal Cost`
     - `Remaining Balance = Gross Revenue - Total Paid`
     - `COD Amount = Remaining Balance`

4. **Microsoft Word .DOCX Order Slip Generator**:
   - Generates real, editable Microsoft Word `.docx` documents.
   - **A4 Portrait** layout formatted as a **2 Columns × 5 Rows (10 slips per page max)** table grid.
   - **Dynamic Page Breakdown**:
     - 1 order -> 1 page (1 slip)
     - 10 orders -> 1 full page (10 slips)
     - 11 orders -> 2 pages (10 + 1)
     - 25 orders -> 3 pages (10 + 10 + 5)
   - Excludes private internal costs & profit details from customer-facing slips.

5. **Soft Delete / Trash System**:
   - Deleted orders move to Trash (`deleted_at` timestamp). Excluded from active sales, profit, and dashboard statistics.
   - Restore returns orders to active calculation. Permanent deletion is restricted to Admins and requires double-confirmation by typing `DELETE`.

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env.local` with your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 3. Apply Supabase Database Migrations
Execute the SQL files in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_functions_triggers_rls.sql`
3. `supabase/seed/seed.sql`

### 4. Run Local Development Server
```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Creating the First Admin User

To assign Admin privileges to a user:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@naamstudio.com';
```

---

## Backup & Restore Procedures

### Database Schema & Data Backup
Run the PostgreSQL pg_dump tool via Supabase CLI or SQL Editor:
```bash
supabase db dump -f backup_naam_studio.sql
```

### Restore Database
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f backup_naam_studio.sql
```
