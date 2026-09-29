import { supabase, isSupabaseConfigured } from './supabase';
import { 
  UserProfile, 
  ScreeningRequest, 
  ScreeningReport, 
  AuditLog, 
  UserRole,
  GlaucomaDiagnosis,
  RiskLevel
} from '../types/database';
import { 
  MOCK_USERS, 
  MOCK_SCREENINGS, 
  MOCK_REPORTS, 
  MOCK_AUDIT_LOGS 
} from './mockData';
import { 
  calculateFileSha256, 
  calculatePayloadSha256, 
  generateUnifiedGlaucomaHash,
  ASBRIDGE_KEY_WALLET 
} from './crypto';
import { relayAnchorToMST } from './mstRelayer';

// Local storage keys for persistent demo state
const LS_CURRENT_USER_KEY = 'ocutrust_current_user';
const LS_ALL_USERS_KEY = 'ocutrust_all_users';
const LS_SCREENINGS_KEY = 'ocutrust_screenings';
const LS_REPORTS_KEY = 'ocutrust_reports';
const LS_AUDIT_KEY = 'ocutrust_audit_logs';

function getLocalUsers(): UserProfile[] {
  const data = localStorage.getItem(LS_ALL_USERS_KEY);
  if (!data) {
    localStorage.setItem(LS_ALL_USERS_KEY, JSON.stringify([]));
    return [];
  }
  return JSON.parse(data);
}

function saveLocalUsers(users: UserProfile[]) {
  localStorage.setItem(LS_ALL_USERS_KEY, JSON.stringify(users));
}

// -------------------------------------------------------------
// OTP & EMAIL AUTHENTICATION SERVICES
// -------------------------------------------------------------

interface StoredOTP {
  email: string;
  code: string;
  role: UserRole;
  profileData: any;
  expiresAt: number;
}

const LS_OTP_STORE_KEY = 'ocutrust_pending_otp';

export async function sendEmailOTP(params: {
  email: string;
  role: UserRole;
  profileData?: any;
}): Promise<{ success: boolean; code: string; message: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();
  
  // Generate secure 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  const otpData: StoredOTP = {
    email: normalizedEmail,
    code,
    role: params.role,
    profileData: params.profileData || {},
    expiresAt
  };

  sessionStorage.setItem(LS_OTP_STORE_KEY, JSON.stringify(otpData));

  // If Supabase is connected with SMTP, trigger Supabase OTP
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          data: {
            role: params.role,
            ...params.profileData
          }
        }
      });
    } catch (e) {
      console.warn('Supabase OTP fallback to local cryptographic OTP engine', e);
    }
  }

  addLocalAuditLog({
    entity_type: 'user_profile',
    entity_id: normalizedEmail,
    actor_id: normalizedEmail,
    actor_name: `${params.profileData?.fullName || normalizedEmail} (${params.role.toUpperCase()})`,
    action: `Requested Email OTP Verification Code for ${params.role.toUpperCase()} Portal`,
    metadata: { email: normalizedEmail, role: params.role }
  });

  return {
    success: true,
    code,
    message: `Verification code sent to ${normalizedEmail}`
  };
}

export async function verifyEmailOTP(params: {
  email: string;
  otp: string;
}): Promise<UserProfile> {
  const normalizedEmail = params.email.trim().toLowerCase();
  const storedStr = sessionStorage.getItem(LS_OTP_STORE_KEY);
  
  if (!storedStr) {
    throw new Error('No pending verification code found. Please request a new OTP.');
  }

  const stored: StoredOTP = JSON.parse(storedStr);

  if (stored.email !== normalizedEmail) {
    throw new Error('Email address mismatch. Please request a new OTP.');
  }

  if (Date.now() > stored.expiresAt) {
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (stored.code !== params.otp.trim()) {
    throw new Error('Invalid verification code. Please check the 6-digit code and try again.');
  }

  // OTP verified successfully! Create or retrieve user
  const users = getLocalUsers();
  let user = users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    const isDoctor = stored.role === 'doctor' || stored.role === 'hospital_admin';
    const profile = stored.profileData || {};

    user = {
      id: `usr_${isDoctor ? 'doc' : 'pat'}_${Date.now()}`,
      email: normalizedEmail,
      role: stored.role,
      full_name: profile.fullName || (isDoctor ? 'Dr. Clinician, MD' : 'Registered Patient'),
      phone: profile.phone,
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      medical_record_number: !isDoctor ? `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      hospital_name: isDoctor ? (profile.hospitalName || 'Apex Vision Institute') : undefined,
      license_number: isDoctor ? (profile.licenseNumber || `MED-GLAUC-${Math.floor(10000 + Math.random() * 90000)}`) : undefined,
      specialization: isDoctor ? (profile.specialization || 'Glaucoma & Retinal Diagnostics') : undefined,
      department: isDoctor ? (profile.department || 'Ophthalmology Clinical Care') : undefined,
      created_at: new Date().toISOString()
    };

    users.push(user);
    saveLocalUsers(users);
  }

  // Clear pending OTP
  sessionStorage.removeItem(LS_OTP_STORE_KEY);

  // Set active session
  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(user));

  addLocalAuditLog({
    entity_type: 'user_profile',
    entity_id: user.id,
    actor_id: user.id,
    actor_name: `${user.full_name} (${user.role.toUpperCase()})`,
    action: `Email OTP Verified Successfully — User Authenticated into ${user.role.toUpperCase()} Portal`,
    metadata: {
      email: user.email,
      role: user.role,
      mrn: user.medical_record_number,
      license: user.license_number
    }
  });

  return user;
}

// Helper to initialize local storage data
function getLocalScreenings(): ScreeningRequest[] {
  const data = localStorage.getItem(LS_SCREENINGS_KEY);
  if (!data) {
    localStorage.setItem(LS_SCREENINGS_KEY, JSON.stringify(MOCK_SCREENINGS));
    return MOCK_SCREENINGS;
  }
  return JSON.parse(data);
}

function saveLocalScreenings(screenings: ScreeningRequest[]) {
  localStorage.setItem(LS_SCREENINGS_KEY, JSON.stringify(screenings));
}

function getLocalReports(): ScreeningReport[] {
  const data = localStorage.getItem(LS_REPORTS_KEY);
  if (!data) {
    localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(MOCK_REPORTS));
    return MOCK_REPORTS;
  }
  return JSON.parse(data);
}

function saveLocalReports(reports: ScreeningReport[]) {
  localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(reports));
}

function getLocalAuditLogs(): AuditLog[] {
  const data = localStorage.getItem(LS_AUDIT_KEY);
  if (!data) {
    localStorage.setItem(LS_AUDIT_KEY, JSON.stringify(MOCK_AUDIT_LOGS));
    return MOCK_AUDIT_LOGS;
  }
  return JSON.parse(data);
}

function addLocalAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
  const logs = getLocalAuditLogs();
  const newLog: AuditLog = {
    ...log,
    id: `log_${Date.now()}`,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(LS_AUDIT_KEY, JSON.stringify([newLog, ...logs]));
}

// -------------------------------------------------------------
// AUTHENTICATION & PROFILE SERVICES
// -------------------------------------------------------------

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error || !data) return null;
      return data as UserProfile;
    } catch {
      // Fallback
    }
  }

  // Local demo fallback
  const stored = localStorage.getItem(LS_CURRENT_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  
  return null;
}

export async function loginUser(params: {
  email: string;
  password?: string;
  role?: UserRole;
}): Promise<UserProfile> {
  const users = getLocalUsers();
  const normalizedEmail = params.email.trim().toLowerCase();
  
  let match = users.find(u => u.email.toLowerCase() === normalizedEmail);
  
  if (!match) {
    // If logging in with a new email in demo mode, create the account
    const newId = `usr_${Date.now()}`;
    const role = params.role || (normalizedEmail.includes('doc') || normalizedEmail.includes('dr') ? 'doctor' : 'patient');
    const fullName = normalizedEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const newUser: UserProfile = {
      id: newId,
      email: normalizedEmail,
      role: role as UserRole,
      full_name: role === 'doctor' ? `Dr. ${fullName}, MD` : fullName,
      medical_record_number: role === 'patient' ? `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      hospital_name: role === 'doctor' ? 'Apex Vision Institute' : undefined,
      specialization: role === 'doctor' ? 'Glaucoma & Anterior Segment' : undefined,
      license_number: role === 'doctor' ? `MED-GLAUC-${Math.floor(10000 + Math.random() * 90000)}` : undefined,
      created_at: new Date().toISOString()
    };
    
    users.push(newUser);
    saveLocalUsers(users);
    match = newUser;
  }

  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(match));
  
  addLocalAuditLog({
    entity_type: 'user_profile',
    entity_id: match.id,
    actor_id: match.id,
    actor_name: `${match.full_name} (${match.role.toUpperCase()})`,
    action: `User Successfully Authenticated (${match.role.toUpperCase()} Portal)`,
    metadata: {
      email: match.email,
      role: match.role
    }
  });

  return match;
}

export async function registerPatient(params: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContact?: string;
}): Promise<UserProfile> {
  const users = getLocalUsers();
  const normalizedEmail = params.email.trim().toLowerCase();

  const newPatient: UserProfile = {
    id: `usr_pat_${Date.now()}`,
    email: normalizedEmail,
    role: 'patient',
    full_name: params.fullName.trim(),
    phone: params.phone,
    date_of_birth: params.dateOfBirth,
    gender: params.gender as any,
    medical_record_number: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    emergency_contact: params.emergencyContact,
    created_at: new Date().toISOString()
  };

  users.push(newPatient);
  saveLocalUsers(users);
  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(newPatient));

  addLocalAuditLog({
    entity_type: 'user_profile',
    entity_id: newPatient.id,
    actor_id: newPatient.id,
    actor_name: `${newPatient.full_name} (Patient)`,
    action: 'Registered New Patient Account & Medical Record Number',
    metadata: {
      mrn: newPatient.medical_record_number,
      email: newPatient.email
    }
  });

  return newPatient;
}

export async function registerDoctor(params: {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  hospitalName: string;
  licenseNumber: string;
  specialization: string;
  department?: string;
}): Promise<UserProfile> {
  const users = getLocalUsers();
  const normalizedEmail = params.email.trim().toLowerCase();

  const newDoctor: UserProfile = {
    id: `usr_doc_${Date.now()}`,
    email: normalizedEmail,
    role: 'doctor',
    full_name: params.fullName.startsWith('Dr.') ? params.fullName : `Dr. ${params.fullName}`,
    phone: params.phone,
    hospital_name: params.hospitalName,
    license_number: params.licenseNumber,
    specialization: params.specialization,
    department: params.department || 'Ophthalmology & Glaucoma Diagnostics',
    created_at: new Date().toISOString()
  };

  users.push(newDoctor);
  saveLocalUsers(users);
  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(newDoctor));

  addLocalAuditLog({
    entity_type: 'user_profile',
    entity_id: newDoctor.id,
    actor_id: newDoctor.id,
    actor_name: `${newDoctor.full_name} (Clinician)`,
    action: 'Registered Clinician Profile with Medical Verification Credentials',
    metadata: {
      hospital: newDoctor.hospital_name,
      license: newDoctor.license_number,
      specialization: newDoctor.specialization
    }
  });

  return newDoctor;
}

export async function logoutUser(): Promise<void> {
  const current = await getCurrentUser();
  if (current) {
    addLocalAuditLog({
      entity_type: 'user_profile',
      entity_id: current.id,
      actor_id: current.id,
      actor_name: `${current.full_name} (${current.role})`,
      action: 'User Logged Out of Session'
    });
  }

  localStorage.removeItem(LS_CURRENT_USER_KEY);
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {}
  }
}

export async function switchDemoUser(role: UserRole, index = 0): Promise<UserProfile> {
  const allUsers = getLocalUsers();
  const roleUsers = allUsers.filter(u => u.role === role);
  const selected = roleUsers[index] || roleUsers[0] || MOCK_USERS[0];
  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(selected));
  return selected;
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getCurrentUser();
  if (!current) throw new Error('No active user');

  const updated: UserProfile = {
    ...current,
    ...profile,
    updated_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    await supabase.from('profiles').update(profile).eq('id', current.id);
  }

  const allUsers = getLocalUsers().map(u => u.id === current.id ? updated : u);
  saveLocalUsers(allUsers);
  localStorage.setItem(LS_CURRENT_USER_KEY, JSON.stringify(updated));
  return updated;
}

// -------------------------------------------------------------
// SCREENING REQUESTS SERVICES
// -------------------------------------------------------------

export interface CreateScreeningPayload {
  symptoms: string[];
  medical_history: any;
  patient_notes?: string;
  reported_iop?: number;
  reported_iop_left?: number;
  reported_iop_right?: number;
  selected_eye?: 'left' | 'right' | 'both';
  eye_image_file?: File | Blob;
  eye_image_url?: string;
  eye_image_hash?: string;
  left_eye_image_file?: File | Blob;
  right_eye_image_file?: File | Blob;
  left_eye_image_url?: string;
  right_eye_image_url?: string;
  left_eye_image_hash?: string;
  right_eye_image_hash?: string;
  record_payload_hash?: string;
}

/**
 * Uploads retinal image directly to Supabase Storage Bucket and saves
 * its hash-to-URL reference into the image_hash_registry table (HashMap).
 */
export async function uploadImageWithHashMap(params: {
  file: File | Blob;
  imageHash: string;
  patientId: string;
  side: 'left' | 'right' | 'retinal';
}): Promise<string> {
  const ext = (params.file as File).name?.split('.').pop() || 'png';
  const filePath = `${params.patientId}/${params.side}_${params.imageHash}.${ext}`;

  if (isSupabaseConfigured && supabase) {
    try {
      console.log(`📤 [Supabase Storage] Uploading ${params.side} retinal image to bucket 'retinal-images' at path: ${filePath}`);
      
      const { error: uploadError } = await supabase.storage
        .from('retinal-images')
        .upload(filePath, params.file, {
          contentType: (params.file as File).type || 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ [Supabase Storage Error]:`, uploadError.message || uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('retinal-images')
          .getPublicUrl(filePath);

        const cdnUrl = publicUrlData.publicUrl;
        console.log(`✅ [Supabase Storage] Upload Success! CDN URL: ${cdnUrl}`);

        // Register in image_hash_registry HashMap table
        const { error: dbError } = await supabase.from('image_hash_registry').upsert({
          image_sha256_hash: params.imageHash,
          storage_path: filePath,
          storage_bucket: 'retinal-images',
          public_url: cdnUrl,
          mime_type: (params.file as File).type || 'image/png',
          file_size_bytes: (params.file as File).size || 0,
          patient_id: params.patientId
        });

        if (dbError) {
          console.error(`⚠️ [Supabase DB HashMap Error]:`, dbError.message || dbError);
        } else {
          console.log(`✅ [Supabase HashMap] Successfully registered hash ${params.imageHash} ➔ ${cdnUrl}`);
        }

        return cdnUrl;
      }
    } catch (e: any) {
      console.error('⚠️ [Supabase Storage Exception]:', e.message || e);
    }
  } else {
    console.log('ℹ️ [Storage Notice]: Running in local object mode. Set VITE_SUPABASE_URL in .env for remote storage.');
  }

  // Fallback to local Object URL
  return URL.createObjectURL(params.file);
}

export async function createScreeningRequest(
  payload: CreateScreeningPayload, 
  user: UserProfile
): Promise<ScreeningRequest> {
  // 1. Calculate image hashes from real files if provided (single eye or pair)
  const singleEyeFile = payload.eye_image_file || payload.left_eye_image_file || payload.right_eye_image_file;
  const singleEyeHash = payload.eye_image_hash || payload.left_eye_image_hash || payload.right_eye_image_hash;
  const singleEyeUrl = payload.eye_image_url || payload.left_eye_image_url || payload.right_eye_image_url;

  let leftHash = payload.left_eye_image_hash || singleEyeHash || '';
  let rightHash = payload.right_eye_image_hash || singleEyeHash || '';
  let leftUrl = payload.left_eye_image_url || singleEyeUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';
  let rightUrl = payload.right_eye_image_url || singleEyeUrl || 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80';

  if (payload.eye_image_file) {
    const computedHash = await calculateFileSha256(payload.eye_image_file);
    const uploadedUrl = await uploadImageWithHashMap({
      file: payload.eye_image_file,
      imageHash: computedHash,
      patientId: user.id,
      side: 'retinal'
    });
    leftHash = computedHash;
    rightHash = computedHash;
    leftUrl = uploadedUrl;
    rightUrl = uploadedUrl;
  } else {
    if (payload.left_eye_image_file) {
      leftHash = await calculateFileSha256(payload.left_eye_image_file);
      leftUrl = await uploadImageWithHashMap({
        file: payload.left_eye_image_file,
        imageHash: leftHash,
        patientId: user.id,
        side: 'left'
      });
    } else if (!leftHash) {
      leftHash = await calculatePayloadSha256({ url: leftUrl, nonce: Date.now() + '-left' });
    }

    if (payload.right_eye_image_file) {
      rightHash = await calculateFileSha256(payload.right_eye_image_file);
      rightUrl = await uploadImageWithHashMap({
        file: payload.right_eye_image_file,
        imageHash: rightHash,
        patientId: user.id,
        side: 'right'
      });
    } else if (!rightHash) {
      rightHash = leftHash || await calculatePayloadSha256({ url: rightUrl, nonce: Date.now() + '-right' });
    }
  }

  // 2. Determine urgency priority
  const hasHighSymptoms = payload.symptoms.some(s => 
    s.toLowerCase().includes('severe') || 
    s.toLowerCase().includes('halos') || 
    s.toLowerCase().includes('peripheral vision loss')
  );
  const userIop = payload.reported_iop || payload.reported_iop_left || payload.reported_iop_right;
  const hasHighIOP = userIop && userIop > 22;
  const priority = (hasHighSymptoms || hasHighIOP) ? 'urgent' : 'routine';

  // 3. Calculate the ONE CENTRAL UNIFIED MASTER GLAUCOMA HASH
  const timestamp = new Date().toISOString();
  
  let recordPayloadHash = payload.record_payload_hash;
  if (!recordPayloadHash) {
    const { unifiedHash } = await generateUnifiedGlaucomaHash({
      eyeImageHash: leftHash || rightHash,
      selectedEye: payload.selected_eye || 'retinal_fundus_scan',
      leftEyeHash: leftHash,
      rightEyeHash: rightHash,
      patientId: user.id,
      patientMrn: user.medical_record_number || 'MRN-PATIENT',
      symptoms: payload.symptoms,
      medicalHistory: payload.medical_history,
      iop: userIop,
      iopLeft: payload.reported_iop_left || userIop,
      iopRight: payload.reported_iop_right || userIop,
      patientNotes: payload.patient_notes,
      timestamp
    });
    recordPayloadHash = unifiedHash;
  }

  const refNumber = `GLA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newRequest: ScreeningRequest = {
    id: `scr_${Date.now()}_${Math.floor(Math.random()*1000)}`,
    reference_id: refNumber,
    patient_id: user.id,
    status: 'submitted',
    priority: priority as any,
    symptoms: payload.symptoms,
    medical_history: payload.medical_history,
    patient_notes: payload.patient_notes,
    reported_iop_left: payload.reported_iop_left,
    reported_iop_right: payload.reported_iop_right,
    left_eye_image_url: leftUrl,
    right_eye_image_url: rightUrl,
    left_eye_image_hash: leftHash,
    right_eye_image_hash: rightHash,
    record_payload_hash: recordPayloadHash,
    blockchain_anchor_status: 'pending_anchor',
    created_at: timestamp,
    updated_at: timestamp,
    patient: user
  };

  // If Supabase is configured, push to database
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('screening_requests').insert({
        reference_id: newRequest.reference_id,
        patient_id: newRequest.patient_id,
        status: newRequest.status,
        priority: newRequest.priority,
        symptoms: newRequest.symptoms,
        medical_history: newRequest.medical_history,
        patient_notes: newRequest.patient_notes,
        reported_iop_left: newRequest.reported_iop_left,
        reported_iop_right: newRequest.reported_iop_right,
        left_eye_image_url: newRequest.left_eye_image_url,
        right_eye_image_url: newRequest.right_eye_image_url,
        left_eye_image_hash: newRequest.left_eye_image_hash,
        right_eye_image_hash: newRequest.right_eye_image_hash,
        record_payload_hash: newRequest.record_payload_hash,
        blockchain_anchor_status: 'pending_anchor'
      });
    } catch (e) {
      console.warn('Supabase insert failed, fallback to local storage', e);
    }
  }

  // Persist locally
  const currentList = getLocalScreenings();
  saveLocalScreenings([newRequest, ...currentList]);

  // Log audit trail
  addLocalAuditLog({
    entity_type: 'screening_request',
    entity_id: newRequest.id,
    actor_id: user.id,
    actor_name: `${user.full_name} (${user.role})`,
    action: 'Submitted New Screening Request & Scans',
    metadata: {
      reference_id: newRequest.reference_id,
      record_hash: newRequest.record_payload_hash,
      priority: newRequest.priority
    }
  });

  return newRequest;
}

export async function getScreenings(user: UserProfile): Promise<ScreeningRequest[]> {
  const allScreenings = getLocalScreenings();
  const allReports = getLocalReports();

  // Attach reports and patient profiles
  const enriched = allScreenings.map(scr => {
    const report = allReports.find(r => r.screening_id === scr.id);
    const patient = MOCK_USERS.find(u => u.id === scr.patient_id) || scr.patient;
    const doctor = MOCK_USERS.find(u => u.id === scr.doctor_id);
    return { ...scr, report, patient, doctor };
  });

  if (user.role === 'patient') {
    return enriched.filter(s => s.patient_id === user.id);
  }
  // Clinicians & Hospital Admins can view all screening requests
  return enriched;
}

export async function getScreeningById(id: string): Promise<ScreeningRequest | null> {
  const allScreenings = getLocalScreenings();
  const allReports = getLocalReports();
  const scr = allScreenings.find(s => s.id === id || s.reference_id === id);
  if (!scr) return null;

  const report = allReports.find(r => r.screening_id === scr.id);
  const patient = MOCK_USERS.find(u => u.id === scr.patient_id) || scr.patient;
  const doctor = MOCK_USERS.find(u => u.id === scr.doctor_id);

  return { ...scr, report, patient, doctor };
}

// -------------------------------------------------------------
// DOCTOR CLINICAL DIAGNOSIS & REPORT SUBMISSION
// -------------------------------------------------------------

export interface SubmitDiagnosisPayload {
  screening_id: string;
  diagnosis: GlaucomaDiagnosis;
  risk_level: RiskLevel;
  left_cup_to_disc_ratio: number;
  right_cup_to_disc_ratio: number;
  left_measured_iop?: number;
  right_measured_iop?: number;
  optic_disc_findings: string;
  retinal_nerve_fiber_layer_notes?: string;
  visual_field_recommendation?: string;
  recommendations: string;
  prescribed_medications: any[];
  follow_up_timeline: string;
  is_urgent_referral: boolean;
}

export async function submitScreeningReport(
  payload: SubmitDiagnosisPayload,
  doctor: UserProfile
): Promise<ScreeningReport> {
  // 1. Calculate canonical report hash for doctor's clinical evaluation
  const reportPayload = {
    screening_id: payload.screening_id,
    doctor_id: doctor.id,
    doctor_license: doctor.license_number,
    diagnosis: payload.diagnosis,
    risk_level: payload.risk_level,
    left_cdr: payload.left_cup_to_disc_ratio,
    right_cdr: payload.right_cup_to_disc_ratio,
    findings: payload.optic_disc_findings,
    recommendations: payload.recommendations,
    prescriptions: payload.prescribed_medications,
    timestamp: new Date().toISOString()
  };

  const reportHash = await calculatePayloadSha256(reportPayload);

  const newReport: ScreeningReport = {
    id: `rep_${Date.now()}`,
    screening_id: payload.screening_id,
    doctor_id: doctor.id,
    diagnosis: payload.diagnosis,
    risk_level: payload.risk_level,
    left_cup_to_disc_ratio: payload.left_cup_to_disc_ratio,
    right_cup_to_disc_ratio: payload.right_cup_to_disc_ratio,
    left_measured_iop: payload.left_measured_iop,
    right_measured_iop: payload.right_measured_iop,
    optic_disc_findings: payload.optic_disc_findings,
    retinal_nerve_fiber_layer_notes: payload.retinal_nerve_fiber_layer_notes,
    visual_field_recommendation: payload.visual_field_recommendation,
    recommendations: payload.recommendations,
    prescribed_medications: payload.prescribed_medications,
    follow_up_timeline: payload.follow_up_timeline,
    is_urgent_referral: payload.is_urgent_referral,
    report_hash: reportHash,
    doctor_signature_metadata: {
      doctor_name: doctor.full_name,
      license: doctor.license_number || 'MED-VERIFIED',
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    doctor
  };

  // Save report
  const reports = getLocalReports();
  saveLocalReports([newReport, ...reports]);

  // Update screening request status to 'diagnosed' or 'urgent_referral'
  const screenings = getLocalScreenings();
  const updatedScreenings = screenings.map(s => {
    if (s.id === payload.screening_id) {
      return {
        ...s,
        doctor_id: doctor.id,
        status: (payload.is_urgent_referral ? 'urgent_referral' : 'diagnosed') as any,
        updated_at: new Date().toISOString()
      };
    }
    return s;
  });
  saveLocalScreenings(updatedScreenings);

  // Log audit
  addLocalAuditLog({
    entity_type: 'screening_report',
    entity_id: newReport.id,
    actor_id: doctor.id,
    actor_name: `${doctor.full_name} (Doctor)`,
    action: `Finalized Glaucoma Diagnostic Report [${payload.diagnosis.toUpperCase()}]`,
    metadata: {
      screening_id: payload.screening_id,
      risk_level: payload.risk_level,
      report_hash: reportHash,
      left_cdr: payload.left_cup_to_disc_ratio,
      right_cdr: payload.right_cup_to_disc_ratio
    }
  });

  return newReport;
}

// -------------------------------------------------------------
// BLOCKCHAIN PREVIEW & ANCHOR SIMULATION (MST LAYER INTEGRATION)
// -------------------------------------------------------------

export interface BlockchainAnchorSimulationResult {
  txHash: string;
  blockNumber: number;
  anchoredAt: string;
  network: string;
  contractAddress: string;
  verifiedRecordHash: string;
  isLiveOnChain?: boolean;
}

export async function simulateMSTBlockchainAnchor(
  screeningId: string
): Promise<BlockchainAnchorSimulationResult> {
  const screenings = getLocalScreenings();
  const scr = screenings.find(s => s.id === screeningId);
  const reports = getLocalReports();
  const report = reports.find(r => r.screening_id === screeningId);

  const recordHash = scr?.record_payload_hash || '0x' + Array.from({length: 64}, () => '0').join('');
  const leftHash = scr?.left_eye_image_hash || '0x' + Array.from({length: 64}, () => '0').join('');
  const rightHash = scr?.right_eye_image_hash || '0x' + Array.from({length: 64}, () => '0').join('');
  const reportHash = report?.report_hash;

  // Execute relayer anchoring for the One Central Unified Record Hash
  const relayResult = await relayAnchorToMST({
    unifiedRecordHash: recordHash
  });

  const updated = screenings.map(s => {
    if (s.id === screeningId) {
      return {
        ...s,
        blockchain_anchor_status: 'anchored' as const,
        blockchain_tx_hash: relayResult.txHash,
        blockchain_block_number: relayResult.blockNumber,
        blockchain_anchored_at: relayResult.anchoredAt
      };
    }
    return s;
  });
  saveLocalScreenings(updated);

  // If Supabase is connected, update PostgreSQL record
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('screening_requests').update({
        blockchain_anchor_status: 'anchored',
        blockchain_tx_hash: relayResult.txHash,
        blockchain_block_number: relayResult.blockNumber,
        blockchain_anchored_at: relayResult.anchoredAt
      }).eq('id', screeningId);
    } catch (e) {
      console.warn('Supabase anchor update failed:', e);
    }
  }

  addLocalAuditLog({
    entity_type: 'blockchain_anchor',
    entity_id: screeningId,
    action: `Anchored Record Hash to ${relayResult.network}`,
    metadata: {
      tx_hash: relayResult.txHash,
      block_number: relayResult.blockNumber,
      record_hash: relayResult.unifiedRecordHash,
      network: relayResult.network,
      asbridge_wallet: relayResult.asbridgeWallet,
      is_live: relayResult.isLiveOnChain ? 'true' : 'simulated'
    }
  });

  return {
    txHash: relayResult.txHash,
    blockNumber: relayResult.blockNumber,
    anchoredAt: relayResult.anchoredAt,
    network: relayResult.network,
    contractAddress: relayResult.contractAddress,
    verifiedRecordHash: relayResult.unifiedRecordHash,
    isLiveOnChain: relayResult.isLiveOnChain
  };
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return getLocalAuditLogs();
}
