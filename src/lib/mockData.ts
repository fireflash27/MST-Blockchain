import { UserProfile, ScreeningRequest, ScreeningReport, AuditLog } from '../types/database';

// Fresh production state - starts empty so users create their authentic accounts via Email OTP
export const MOCK_USERS: UserProfile[] = [];

// Sample realistic fundus eye scans (high quality medical fundus photographs)
export const SAMPLE_FUNDUS_IMAGES = {
  leftEye1: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
  rightEye1: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
  leftEye2: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
  rightEye2: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  normalFundus: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
  glaucomatousFundus: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
};

export const MOCK_REPORTS: ScreeningReport[] = [];

export const MOCK_SCREENINGS: ScreeningRequest[] = [];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_sys_init',
    entity_type: 'blockchain_anchor',
    entity_id: 'mst_relayer_01',
    actor_id: '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F',
    actor_name: 'ASBridge Custodian Relayer (MST Chain)',
    action: 'Platform Cryptographic Engine Initialized on MST Testnet (Chain ID: 91562037)',
    metadata: {
      relayer_wallet: '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F',
      network: 'MST Testnet (Chain ID 91562037)',
      status: 'active'
    },
    created_at: new Date().toISOString()
  }
];
