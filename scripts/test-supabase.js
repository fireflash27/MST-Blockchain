import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_SYHdtj1XwaBUOUlg72VULp_fLhwDZMv';

console.log('\n======================================================');
console.log('       OcuTrust Supabase Storage & Database Test       ');
console.log('======================================================\n');

async function testSupabase() {
  console.log(`📡 Connecting to Supabase at: ${SUPABASE_URL}`);
  console.log(`🔑 Using Key: ${SUPABASE_KEY.slice(0, 20)}...`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Test Database Queries
  try {
    console.log('\n🔍 1. Testing Database Query on `public.profiles`...');
    const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
    if (pErr) {
      console.error('❌ Database Query Error:', pErr.message);
    } else {
      console.log(`✅ Profiles table reachable! Found ${profiles?.length || 0} records.`);
    }

    console.log('\n🔍 2. Testing `public.image_hash_registry` table...');
    const { data: hashes, error: hErr } = await supabase.from('image_hash_registry').select('*').limit(5);
    if (hErr) {
      console.error('❌ Image Hash Registry Error:', hErr.message);
    } else {
      console.log(`✅ Image Hash Registry reachable! Found ${hashes?.length || 0} hash mappings.`);
    }
  } catch (e) {
    console.error('❌ Database Connection Error:', e.message);
  }

  // 2. Test Storage Bucket Upload
  try {
    console.log('\n📦 3. Testing Supabase Storage Bucket (`retinal-images`)...');
    
    // Check if bucket exists
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
      console.error('❌ Storage Bucket Listing Error:', bErr.message);
    } else {
      const exists = buckets?.some(b => b.name === 'retinal-images' || b.id === 'retinal-images');
      console.log(`✅ Storage Service Online! Bucket 'retinal-images' status: ${exists ? 'EXISTS' : 'NOT FOUND (Please run schema.sql to create it)'}`);
    }

    // Try uploading a small test buffer
    const testHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    const testBuffer = Buffer.from('OcuTrust Test Retinal Image Payload ' + Date.now());
    const testPath = `test_patient/${testHash}.png`;

    console.log(`\n📤 4. Uploading Test File: ${testPath}`);
    const { data: uploadData, error: upErr } = await supabase.storage
      .from('retinal-images')
      .upload(testPath, testBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (upErr) {
      console.error('❌ Storage Upload Error:', upErr.message);
      console.log('💡 Tip: Make sure you ran the storage policy in Supabase SQL editor:');
      console.log("   INSERT INTO storage.buckets (id, name, public) VALUES ('retinal-images', 'retinal-images', true) ON CONFLICT (id) DO NOTHING;");
    } else {
      console.log('✅ File Uploaded Successfully to Supabase Storage!');
      const { data: urlData } = supabase.storage.from('retinal-images').getPublicUrl(testPath);
      console.log(`🔗 Public URL: ${urlData.publicUrl}`);

      // Test inserting into HashMap registry
      const { error: regErr } = await supabase.from('image_hash_registry').upsert({
        image_sha256_hash: testHash,
        storage_path: testPath,
        storage_bucket: 'retinal-images',
        public_url: urlData.publicUrl,
        mime_type: 'image/png',
        file_size_bytes: testBuffer.length
      });

      if (regErr) {
        console.error('⚠️ HashMap Registry insert error:', regErr.message);
      } else {
        console.log('🎉 HashMap mapping successfully recorded in PostgreSQL!');
      }
    }
  } catch (e) {
    console.error('❌ Storage Upload Exception:', e.message);
  }
}

testSupabase();
