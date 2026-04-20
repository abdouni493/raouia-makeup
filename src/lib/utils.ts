import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null): string {
  if (!value && value !== 0) return '0,00 DA';
  return new Intl.NumberFormat('fr-DZ', { 
    style: 'currency', 
    currency: 'DZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export async function fetchUserProfile(userId: string, maxRetries = 3) {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[FETCH PROFILE] Attempt ${attempt}/${maxRetries} for user: ${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, avatar_url, phone, address, payment_type, percentage, daily_rate, monthly_rate, created_at')
        .eq('id', userId);

      if (error) {
        console.error(`[FETCH PROFILE] Attempt ${attempt} error:`, error);
        lastError = error;
        
        // Log RLS policy errors specifically
        if (error.message && error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('policy')) {
          console.error('[FETCH PROFILE] ❌ RLS POLICY ERROR - Worker may not have permission to read profiles');
          console.error('[FETCH PROFILE] Solution: Apply FIX_WORKER_LOGIN.sql in Supabase SQL Editor');
        }
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          const waitTime = 500 * Math.pow(2, attempt - 1);
          console.log(`[FETCH PROFILE] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        continue;
      }

      // Handle empty result set - no profile found
      if (!data || data.length === 0) {
        console.warn(`[FETCH PROFILE] ❌ No profile found for user ${userId}`);
        return null;
      }

      if (data && data.length > 0) {
        console.log(`[FETCH PROFILE] ✅ Successfully fetched profile for user: ${data[0].username}`);
        return data[0];
      }
    } catch (err) {
      console.error(`[FETCH PROFILE] Attempt ${attempt} exception:`, err);
      lastError = err;
      
      if (attempt < maxRetries) {
        const waitTime = 500 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`[FETCH PROFILE] ❌ FAILED after ${maxRetries} attempts`);
  console.error('[FETCH PROFILE] Last error:', lastError);
  throw new Error(`Failed to fetch profile after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

