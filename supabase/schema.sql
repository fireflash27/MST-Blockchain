-- =====================================================================
-- OcuTrust: Complete Supabase Database & Storage Migration Script
-- Run this entire script in Supabase SQL Editor (Ctrl+A -> Run)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'hospital_admin')),
    full_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    medical_record_number TEXT UNIQUE,
    emergency_contact TEXT,
    hospital_name TEXT,
    license_number TEXT,
    specialization TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. SCREENING REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.screening_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_id TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'in_review', 'diagnosed', 'completed', 'urgent_referral')
    ),
    priority TEXT NOT NULL DEFAULT 'routine' CHECK (
        priority IN ('routine', 'elevated', 'urgent')
    ),
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    medical_history JSONB NOT NULL DEFAULT '{}'::jsonb,
    patient_notes TEXT,
    reported_iop_left NUMERIC(4, 1),
    reported_iop_right NUMERIC(4, 1),
    left_eye_image_url TEXT NOT NULL,
    right_eye_image_url TEXT NOT NULL,
    left_eye_image_hash TEXT NOT NULL,
    right_eye_image_hash TEXT NOT NULL,
    record_payload_hash TEXT NOT NULL,
    blockchain_anchor_status TEXT NOT NULL DEFAULT 'pending_anchor' CHECK (
        blockchain_anchor_status IN ('pending_anchor', 'anchored', 'verified')
    ),
    blockchain_tx_hash TEXT,
    blockchain_block_number BIGINT,
    blockchain_anchored_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. CLINICAL DIAGNOSTIC REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.screening_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    screening_id UUID NOT NULL UNIQUE REFERENCES public.screening_requests(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    diagnosis TEXT NOT NULL CHECK (
        diagnosis IN (
            'normal', 'glaucoma_suspect', 'open_angle_glaucoma', 
            'angle_closure_glaucoma', 'normal_tension_glaucoma', 
            'ocular_hypertension', 'advanced_glaucoma'
        )
    ),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    left_cup_to_disc_ratio NUMERIC(3, 2) NOT NULL,
    right_cup_to_disc_ratio NUMERIC(3, 2) NOT NULL,
    left_measured_iop NUMERIC(4, 1),
    right_measured_iop NUMERIC(4, 1),
    optic_disc_findings TEXT NOT NULL,
    retinal_nerve_fiber_layer_notes TEXT,
    visual_field_recommendation TEXT,
    recommendations TEXT NOT NULL,
    prescribed_medications JSONB DEFAULT '[]'::jsonb,
    follow_up_timeline TEXT NOT NULL,
    is_urgent_referral BOOLEAN DEFAULT FALSE,
    report_hash TEXT NOT NULL,
    doctor_signature_metadata JSONB,
    blockchain_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor_id TEXT,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. DEDICATED IMAGE HASHMAP REGISTRY TABLE
CREATE TABLE IF NOT EXISTS public.image_hash_registry (
    image_sha256_hash TEXT PRIMARY KEY,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'retinal-images',
    public_url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screening_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_hash_registry ENABLE ROW LEVEL SECURITY;

-- 8. TABLE ACCESS POLICIES
DROP POLICY IF EXISTS "Allow all profiles access" ON public.profiles;
CREATE POLICY "Allow all profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all screening access" ON public.screening_requests;
CREATE POLICY "Allow all screening access" ON public.screening_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all reports access" ON public.screening_reports;
CREATE POLICY "Allow all reports access" ON public.screening_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all audit logs access" ON public.audit_logs;
CREATE POLICY "Allow all audit logs access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all image hash registry access" ON public.image_hash_registry;
CREATE POLICY "Allow all image hash registry access" ON public.image_hash_registry FOR ALL USING (true) WITH CHECK (true);

-- 9. SUPABASE STORAGE BUCKET CONFIGURATION
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('retinal-images', 'retinal-images', true, null, null)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 10. STORAGE BUCKET ACCESS POLICIES
DROP POLICY IF EXISTS "Allow public all" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon all" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated all" ON storage.objects;
DROP POLICY IF EXISTS "Allow all uploads to retinal-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow all reads from retinal-images" ON storage.objects;

CREATE POLICY "Allow public all" 
ON storage.objects FOR ALL 
TO public 
USING (bucket_id = 'retinal-images') 
WITH CHECK (bucket_id = 'retinal-images');

CREATE POLICY "Allow anon all" 
ON storage.objects FOR ALL 
TO anon 
USING (bucket_id = 'retinal-images') 
WITH CHECK (bucket_id = 'retinal-images');

CREATE POLICY "Allow authenticated all" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'retinal-images') 
WITH CHECK (bucket_id = 'retinal-images');
