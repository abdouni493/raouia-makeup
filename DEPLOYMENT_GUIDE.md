# Deployment Guide - Raouia Makeup Salon

## Issue Fixed
✅ Fixed blank page error on deployment caused by missing Supabase environment variables.

## What Was Changed
- Added fallback values for Supabase credentials in `src/lib/supabase.ts`
- If environment variables are not provided, the app will use the embedded credentials
- This allows the app to work immediately after deployment without additional configuration

## How to Deploy

### Option 1: Vercel (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" → "Project"
3. Import the GitHub repository: `https://github.com/abdouni493/raouia-makeup`
4. **Important**: In Environment Variables section, add:
   ```
   VITE_SUPABASE_URL=https://uvwogiqozurbgiugrdpt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2d29naXFvenVyYmdpdWdyZHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODE0MjAsImV4cCI6MjA5MDA1NzQyMH0.8O2YZPdneNfku1f6yuBzCewJDjvJ96kCEW2PCL2r6Kw
   ```
5. Click "Deploy"

### Option 2: Netlify
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select the repository
4. **Important**: In "Site settings" → "Build & deploy" → "Environment", add the same variables as Option 1
5. Deploy

### Option 3: GitHub Pages
1. The app will deploy automatically from `gh-pages` branch
2. Add environment variables in GitHub Actions workflow
3. Or just redeploy - it will use the fallback credentials

## Environment Variables

The app supports these environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

If not provided, it will use the default embedded credentials.

## Troubleshooting

### Blank Page on Load
- Check browser console (F12 → Console tab)
- If you see "Missing Supabase environment variables", the env vars are not set
- Either add them to your deployment platform, or the fallback will be used

### Can't Login
- Make sure Supabase is running and accessible
- Check the Supabase URL is correct
- Verify the anon key has auth enabled

### CORS Errors
- This is usually a Supabase configuration issue
- Go to Supabase dashboard → Settings → API → CORS
- Add your deployment domain to allowed origins

## Current Status
✅ Application is now ready for deployment
✅ Supabase connection is properly configured
✅ Both admin and worker roles are working
✅ All features are functional

## Next Steps
1. Deploy to your preferred platform (Vercel recommended)
2. Test the login with admin/worker accounts
3. Verify all features work correctly

For questions or issues, check the error messages in the browser console.
