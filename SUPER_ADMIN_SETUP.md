# Creating Super Admin Account - Complete Guide

## Updated Login Page
✅ **Store name now displays from database** - No longer hardcoded "Éclat & Soie"
✅ **Signup removed** - Login page only shows login form, no "Créer un compte" option
✅ **Logo displays** - Fetches logo from store_config if available

## Super Admin Account Details
- **Email**: roryinstaiphone@hotmail.com
- **Username**: raouia_makeup  
- **Password**: raouia123
- **Role**: admin (will NOT display in workers interface)

## How to Create the Super Admin Account

### Step 1: Create Auth User in Supabase
1. Go to your Supabase Dashboard
2. Click on **Authentication** → **Users**
3. Click **Add User** button (top right)
4. Enter:
   - Email: `roryinstaiphone@hotmail.com`
   - Password: `raouia123`
   - Check "Auto generate password" if you want to change it
5. Click **Create User**
6. **COPY the User ID** (UUID format like `550e8400-e29b-41d4-a716-446655440000`)

### Step 2: Create Profile in Database
1. Go to **SQL Editor** in Supabase
2. Open the file: `CREATE_SUPER_ADMIN.sql`
3. Replace `PUT_UUID_HERE` with the UUID you copied in Step 1
4. Run the SQL query
5. Verify it worked by checking the query response

### Example (After replacing UUID):
```sql
INSERT INTO public.profiles (
  id, 
  username, 
  full_name, 
  role, 
  phone, 
  address, 
  payment_type, 
  percentage
) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- Your actual UUID
  'raouia_makeup',
  'Raouia Admin',
  'admin',
  '',
  '',
  'month',
  NULL
);
```

## Testing
1. Go to login page
2. Login with:
   - Email: `roryinstaiphone@hotmail.com`
   - Password: `raouia123`
3. You should be logged in as admin

## Why This Account Won't Show in Workers Interface
- The role is set to `'admin'` not `'worker'`
- Components like `Employees.tsx` filter to show only workers
- You'll have full access to all admin features (Configuration, Dashboard, etc.)
- Workers won't see this account in their contact/team lists

## Security Notes
- Change the password after first login if needed
- The account is now visible in Supabase under Authentication > Users
- Only admin accounts can access the Configuration section

## File References
- Login file: [src/components/Login.tsx](src/components/Login.tsx)
- SQL setup: [CREATE_SUPER_ADMIN.sql](CREATE_SUPER_ADMIN.sql)
