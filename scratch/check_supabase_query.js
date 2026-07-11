import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rxgrxjlyrfzojvirkhdc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || '...'; // I will use db.js with env

// I should just use the src/lib/db.js but wait, I can just query via postgres directly.
