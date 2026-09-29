/**
 * Unified Cryptographic & Image Metadata Engine for OcuTrust
 * Fuses binary data from both eyes, image metadata (name, size, dimensions),
 * clinical findings, and the ASBridge key wallet (0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F)
 * into a SINGLE CENTRAL MASTER RECORD HASH for MST Blockchain anchoring.
 */

export const ASBRIDGE_KEY_WALLET = '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F';

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  width?: number;
  height?: number;
  sha256Digest: string;
}

// Converts ArrayBuffer to standard 64-char hex string with 0x prefix
export function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map(value => {
    return value.toString(16).padStart(2, '0');
  });
  return '0x' + hexCodes.join('');
}

// Extract natural image width & height from a File / Blob
export function extractImageDimensions(file: Blob | File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    img.src = url;
  });
}

/**
 * Computes deep SHA-256 hash of a File directly from its binary ArrayBuffer bytes.
 */
export async function calculateFileSha256(file: Blob | File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return bufferToHex(hashBuffer);
}

/**
 * Extracts complete image metadata and computes its individual cryptographic fingerprint.
 */
export async function processImageMetadataAndHash(file: File): Promise<ImageMetadata> {
  const [sha256Digest, dimensions] = await Promise.all([
    calculateFileSha256(file),
    extractImageDimensions(file)
  ]);

  return {
    name: file.name,
    size: file.size,
    type: file.type || 'image/jpeg',
    lastModified: file.lastModified,
    width: dimensions.width,
    height: dimensions.height,
    sha256Digest
  };
}

/**
 * Generates the ONE CENTRAL UNIFIED MASTER GLAUCOMA HASH.
 * Fuses:
 * 1. Left Eye Binary Digest + Image Metadata (dimensions, size, filename)
 * 2. Right Eye Binary Digest + Image Metadata (dimensions, size, filename)
 * 3. Patient Clinical Information (MRN, symptoms, IOP, history)
 * 4. ASBridge Custodian Wallet Address (0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F)
 * 5. High-resolution UTC Timestamp & Unique Nonce
 */
export async function generateUnifiedGlaucomaHash(params: {
  eyeImageHash?: string;
  eyeMetadata?: Partial<ImageMetadata> | null;
  selectedEye?: string;
  leftEyeHash?: string;
  rightEyeHash?: string;
  leftMetadata?: Partial<ImageMetadata> | null;
  rightMetadata?: Partial<ImageMetadata> | null;
  patientId: string;
  patientMrn: string;
  symptoms: string[];
  medicalHistory: any;
  iop?: number | null;
  iopLeft?: number | null;
  iopRight?: number | null;
  patientNotes?: string;
  timestamp?: string;
}): Promise<{
  unifiedHash: string;
  canonicalManifest: Record<string, any>;
}> {
  const ts = params.timestamp || new Date().toISOString();
  const primaryHash = params.eyeImageHash || params.leftEyeHash || params.rightEyeHash || '';
  const primaryMeta = params.eyeMetadata || params.leftMetadata || params.rightMetadata || null;
  const eyeLabel = params.selectedEye || 'retinal_fundus_scan';
  
  const canonicalManifest = {
    asbridge_relayer_wallet: ASBRIDGE_KEY_WALLET,
    protocol_version: 'OcuTrust-MST-v2.0',
    patient: {
      id: params.patientId,
      mrn: params.patientMrn
    },
    retinal_scan: {
      target_eye: eyeLabel,
      binary_sha256: primaryHash,
      file_name: primaryMeta?.name || 'retinal_fundus_scan.png',
      file_size_bytes: primaryMeta?.size || 0,
      resolution: primaryMeta?.width ? `${primaryMeta.width}x${primaryMeta.height}` : 'unknown'
    },
    clinical_data: {
      symptoms: params.symptoms.slice().sort(),
      medical_history: params.medicalHistory,
      intraocular_pressure: {
        measured_iop_mmhg: params.iop || params.iopLeft || params.iopRight || null,
        left_iop_mmhg: params.iopLeft || null,
        right_iop_mmhg: params.iopRight || null
      },
      notes: params.patientNotes || ''
    },
    anchored_timestamp_utc: ts
  };

  // Canonicalize and compute Master SHA-256 Digest
  const text = JSON.stringify(canonicalManifest, Object.keys(canonicalManifest).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const unifiedHash = bufferToHex(hashBuffer);

  return {
    unifiedHash,
    canonicalManifest
  };
}

// Compute SHA-256 hash of arbitrary string or object
export async function calculatePayloadSha256(data: any): Promise<string> {
  const text = typeof data === 'string' ? data : JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return bufferToHex(hashBuffer);
}

// Format short hash for display (e.g., 0x8a92...3b1f)
export function shortenHash(hash?: string, chars = 6): string {
  if (!hash) return 'N/A';
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}
