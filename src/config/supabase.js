import { createClient } from '@supabase/supabase-js';
import config from './index.js';

const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export default supabase; 