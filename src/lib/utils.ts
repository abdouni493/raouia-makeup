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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, role, avatar_url, phone, address, payment_type, percentage, created_at')
        .eq('id', userId);

      if (error) {
        console.warn(`Attempt ${attempt}: Profile fetch error:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
        continue;
      }

      // Handle empty result set - no profile found
      if (!data || data.length === 0) {
        console.warn(`No profile found for user ${userId}`);
        return null;
      }

      if (data && data.length > 0) {
        return data[0];
      }
    } catch (err) {
      console.warn(`Attempt ${attempt}: Profile fetch exception:`, err);
      lastError = err;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  throw new Error(`Failed to fetch profile after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
}

