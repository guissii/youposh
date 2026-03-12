import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

// First without global headers
const supabase1 = createClient(supabaseUrl, supabaseServiceKey);

// Second with global headers like upload.ts
const supabase2 = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${supabaseServiceKey}` } }
});

async function run() {
    console.log("Testing with supabase1 (default config)...");
    let { data: d1, error: e1 } = await supabase1.storage.from('uploads').upload('test/test.txt', 'hello world', { upsert: true });
    if (e1) console.error("Error 1:", e1.message);
    else console.log("Success 1");

    console.log("\nTesting with supabase2 (upload.ts config)...");
    let { data: d2, error: e2 } = await supabase2.storage.from('uploads').upload('test/test2.txt', 'hello world', { upsert: true });
    if (e2) console.error("Error 2:", e2.message);
    else console.log("Success 2");
}

run();
