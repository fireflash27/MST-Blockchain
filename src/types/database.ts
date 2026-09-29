export type UserRole = 'patient' | 'doctor' | 'hospital_admin';

export type ScreeningStatus = 
  | 'submitted' 
  | 'in_review' 
  | 'diagnosed' 
  | 'completed' 
  | 'urgent_referral';

export type PriorityLevel = 'routine' | 'elevated' | 'urgent';

export type GlaucomaDiagnosis = 
  | 'normal' 
  | 'glaucoma_suspect' 
  | 'open_angle_glaucoma' 
  | 'angle_closure_glaucoma' 
  | 'normal_tension_glaucoma' 
  | 'ocular_hypertension' 
  | 'advanced_glaucoma';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface MedicalHistory {
  familyGlaucoma: boolean;
  diabetes: boolean;
  hypertension: boolean;
  highIOP: boolean;
  steroidUse: boolean;
  pastEyeSurgery: boolean;
  otherConditions?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  medical_record_number?: string;
  emergency_contact?: string;
  hospital_name?: string;
  license_number?: string;
  specialization?: string;
  department?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScreeningRequest {
  id: string;
  reference_id: string;
  patient_id: string;
  doctor_id?: string;
  status: ScreeningStatus;
  priority: PriorityLevel;
  symptoms: string[];
  medical_history: MedicalHistory;
  patient_notes?: string;
  reported_iop_left?: number;
  reported_iop_right?: number;
  
  // High-Resolution Fundus / Retinal Images
  left_eye_image_url: string;
  right_eye_image_url: string;
  
  // Cryptographic Hashes (MST Blockchain Anchor Readiness)
  left_eye_image_hash: string;
  right_eye_image_hash: string;
  record_payload_hash: string;
  
  blockchain_anchor_status: 'pending_anchor' | 'anchored' | 'verified';
  blockchain_tx_hash?: string;
  blockchain_block_number?: number;
  blockchain_anchored_at?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined fields for UI convenience
  patient?: UserProfile;
  doctor?: UserProfile;
  report?: ScreeningReport;
}

export interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  eye: 'Left' | 'Right' | 'Both';
  duration: string;
}

export interface ScreeningReport {
  id: string;
  screening_id: string;
  doctor_id: string;
  diagnosis: GlaucomaDiagnosis;
  risk_level: RiskLevel;
  left_cup_to_disc_ratio: number;  // e.g. 0.35 - 0.90
  right_cup_to_disc_ratio: number;
  left_measured_iop?: number;      // mmHg
  right_measured_iop?: number;
  optic_disc_findings: string;
  retinal_nerve_fiber_layer_notes?: string;
  visual_field_recommendation?: string;
  recommendations: string;
  prescribed_medications: PrescriptionItem[];
  follow_up_timeline: string;
  is_urgent_referral: boolean;
  
  // Cryptographic Signature & Hash (For MST Blockchain Integrity)
  report_hash: string;
  doctor_signature_metadata?: {
    doctor_name: string;
    license: string;
    timestamp: string;
  };
  blockchain_tx_hash?: string;
  
  created_at: string;
  updated_at: string;
  doctor?: UserProfile;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  metadata?: Record<string, any>;
  created_at: string;
}
