import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zjjkhoksoidttbsduxmy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vN7iJbqKO_-LBsTwVqIM_A_cg1lXsop';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
