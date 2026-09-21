import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client initialized with the service-role key.
 * Bypasses Row Level Security (RLS) for backend operations, Stripe webhooks, and worker tasks.
 * 
 * CRITICAL: NEVER import this file into Client Components ("use client").
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const adminClient = createClient(
  supabaseUrl || "",
  supabaseServiceRoleKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default adminClient;
