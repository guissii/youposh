import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", supabaseUrl);
console.log("KEY LENGTH:", supabaseServiceKey?.length);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Uploading...");
    let { data, error } = await supabase.storage.from('uploads').upload('test/test3.txt', 'hello', { upsert: true });
    if (error) {
        console.error("ERROR:", error.message);
        console.error("FULL ERROR:", error);
    } else {
        console.log("SUCCESS:", data);
    }
}

run();
