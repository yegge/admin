import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djxxhvpkhfvbwxbdvxnx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeHhodnBraGZ2Ynd4YmR2eG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyOTU0MjksImV4cCI6MjA3Mjg3MTQyOX0.oLWmb4BuZi05hmvNDPQmUdw0jLdWLV92Bsu0OQhlXHY';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
