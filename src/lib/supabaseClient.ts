// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY!

console.log("SUPABASE URL:", supabaseUrl)
console.log("SUPABASE ANON:", supabaseAnon ? "LOADED" : "MISSING")

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,  // IMPORTANT FOR HASH ROUTER
  },
})
