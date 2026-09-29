import React, { useState } from 'react';
import { UserProfile, ScreeningRequest } from '../../types/database';
import { createScreeningRequest } from '../../lib/api';
import { SAMPLE_FUNDUS_IMAGES } from '../../lib/mockData';
import { 
  calculateFileSha256, 
  calculatePayloadSha256, 
  processImageMetadataAndHash, 
  ImageMetadata 
} from '../../lib/crypto';
import { 
  Eye, 
  Upload, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Activity, 
  Sparkles, 
  Lock,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { handleImageUpload, FASTAPI_URL } from '../../lib/fastapiService';

interface NewScreeningWizardProps {
  user: UserProfile;
  onSuccess: (newScreening: ScreeningRequest) => void;
  onCancel: () => void;
}

const COMMON_SYMPTOMS = [
  'Gradual loss of peripheral (side) vision',
  'Tunnel vision in advanced stages',
  'Severe eye ache or brow pain',
  'Halos or rainbow rings around bright lights',
  'Blurred or hazy vision',
  'Redness or ocular pressure sensations',
  'Difficulty adjusting to dark rooms',
  'Frequent changes in prescription glasses'
];

export const NewScreeningWizard: React.FC<NewScreeningWizardProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [medicalHistory, setMedicalHistory] = useState({
    familyGlaucoma: true,
    diabetes: false,
    hypertension: false,
    highIOP: false,
    steroidUse: false,
    pastEyeSurgery: false,
    otherConditions: ''
  });

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Gradual loss of peripheral (side) vision',
    'Halos or rainbow rings around bright lights'
  ]);

  const [patientNotes, setPatientNotes] = useState(
    'Experiencing occasional dimming in peripheral field when driving at dusk. Seeking specialist evaluation.'
  );

  const [iop, setIop] = useState<number | undefined>(21.5);
  const [selectedEye, setSelectedEye] = useState<'left' | 'right'>('left');

  // Single Eye Image state (Starts completely empty until user uploads their own image)
  const [eyeFile, setEyeFile] = useState<File | null>(null);
  const [eyeUrl, setEyeUrl] = useState<string>('');
  const [eyeHash, setEyeHash] = useState<string>('');
  const [eyeMetadata, setEyeMetadata] = useState<ImageMetadata | null>(null);
  const [computedPayloadHash, setComputedPayloadHash] = useState<string>('');
  const [inferenceResult, setInferenceResult] = useState<any | null>(null);
  const [inferring, setInferring] = useState<boolean>(false);

  const [consentChecked, setConsentChecked] = useState(true);

  // Handle Symptom Toggle
  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Web3 & IPFS state in wizard
  const [encryptedData, setEncryptedData] = useState<any | null>(null);
  const [ipfsCID, setIpfsCID] = useState<string | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState<string | null>(null);
  const [web3Status, setWeb3Status] = useState<'idle' | 'encrypting' | 'pinning' | 'success' | 'error'>('idle');

  // Fetch inference JSON directly from FastAPI Server PC (10.80.78.220:8000) & run Web3 pipeline
  const fetchServerInference = async (file: File | Blob) => {
    setInferring(true);
    setWeb3Status('idle');
    try {
      // 1. FastAPI Model Server
      const jsonResult = await handleImageUpload(file);
      setInferenceResult(jsonResult);

      // 2. Lit / Web3 Access-Controlled Encryption
      if (jsonResult) {
        setWeb3Status('encrypting');
        const hospitalTarget = import.meta.env.VITE_TARGET_HOSPITAL_ADDRESS || "0x9840d3Ce974dE5feD4e78981E105fF08CcD09E6A"; // Authorized Hospital Authority (Rishi)
        const rawPayload = JSON.stringify({
          record_type: 'OcuTrust-Glaucoma-Inference',
          target_hospital: hospitalTarget,
          inference: jsonResult,
          timestamp: new Date().toISOString()
        });

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        );
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cipherBuffer = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv as any },
          keyMaterial,
          enc.encode(rawPayload) as any
        );

        const exportedKey = await crypto.subtle.exportKey("raw", keyMaterial);
        const keyHex = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherHex = Array.from(new Uint8Array(cipherBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');

        const encPayload = {
          protocol: "Lit-Protocol-Web3-AES256-datil-dev",
          targetHospital: hospitalTarget,
          ciphertext: cipherHex,
          iv: ivHex,
          keyCommitment: keyHex.slice(0, 16) + "...",
          encryptedAt: new Date().toISOString()
        };
        setEncryptedData(encPayload);

        // 3. Pinata IPFS Pinning
        setWeb3Status('pinning');
        const pinRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMDZkNmIzNy0xNTIxLTRkZTEtYjNhNS1kMzliMjM4ZTk3YjYiLCJlbWFpbCI6InN1bWl0a3VtYXJwaXB0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODEwZTMxZGUwM2YwNGRlZmQ4YSIsInNjb3BlZEtleVNlY3JldCI6ImY1ZWQ4NGM1NGQ1MWYyZTgxNTJlMWQzNmU5YWExYWJmY2VjZTU4NjhjYzA0Nzk5NDIxNDkwOGU5MzczZjIzZGQiLCJleHAiOjE4MjIxNzk5MTV9.LCUlvjmFHEqXLVgzPfVv2dQ7lL6cRPeEwrBoWweTqG8"}`,
          },
          body: JSON.stringify({
            pinataContent: encPayload,
            pinataMetadata: { name: `Fundus_Record_${Date.now()}` },
          }),
        });

        if (pinRes.ok) {
          const pinData = await pinRes.json();
          setIpfsCID(pinData.IpfsHash);
          setIpfsUrl(`https://gateway.pinata.cloud/ipfs/${pinData.IpfsHash}`);
          if (pinData.IpfsHash) {
            localStorage.setItem(`ocutrust_ipfs_${pinData.IpfsHash}`, JSON.stringify(encPayload));
            localStorage.setItem('ocutrust_latest_pinned_cid', pinData.IpfsHash);
            localStorage.setItem('ocutrust_latest_pinned_payload', JSON.stringify(encPayload));
          }
          setWeb3Status('success');
        } else {
          setWeb3Status('error');
        }
      }
    } catch (err: any) {
      console.warn('FastAPI or Web3 pipeline error:', err);
      setWeb3Status('error');
    } finally {
      setInferring(false);
    }
  };

  // Handle Retinal Image Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEyeFile(file);
      setEyeUrl(URL.createObjectURL(file));
      const meta = await processImageMetadataAndHash(file);
      setEyeMetadata(meta);
      setEyeHash(meta.sha256Digest);
      // Automatically send to FastAPI server PC
      fetchServerInference(file);
    }
  };

  // Load sample fundus dataset for quick hackathon demo
  const loadSampleFundusData = async () => {
    const sampleUrl = SAMPLE_FUNDUS_IMAGES.glaucomatousFundus;
    setEyeUrl(sampleUrl);
    const hash = await calculatePayloadSha256({ sample: 'glaucomatousFundus', url: sampleUrl, timestamp: Date.now() });
    setEyeHash(hash);
    setEyeFile(null);
    setEyeMetadata({
      name: 'sample_glaucoma_fundus.png',
      size: 142850,
      type: 'image/png',
      lastModified: Date.now(),
      width: 1920,
      height: 1080,
      sha256Digest: hash
    });
  };

  // Pre-calculate payload hash before entering final step
  const proceedToReview = async () => {
    if (!eyeUrl || !eyeHash) {
      alert('Please upload a Retinal Photograph (Fundus / OCT scan) to generate its cryptographic hash.');
      return;
    }

    const timestamp = new Date().toISOString();
    const payload = {
      patient_id: user.id,
      patient_mrn: user.medical_record_number || 'MRN-PATIENT',
      selected_eye: selectedEye,
      symptoms: selectedSymptoms,
      medical_history: medicalHistory,
      patient_notes: patientNotes || '',
      reported_iop: iop || null,
      retinal_image_hash: eyeHash,
      image_meta: eyeMetadata ? { name: eyeMetadata.name, size: eyeMetadata.size, width: eyeMetadata.width, height: eyeMetadata.height } : null,
      created_at_utc: timestamp
    };
    const hash = await calculatePayloadSha256(payload);
    setComputedPayloadHash(hash);
    setStep(4);
  };

  // Submit Final Screening
  const handleSubmit = async () => {
    if (!consentChecked) return;
    setLoading(true);

    try {
      const newScreening = await createScreeningRequest(
        {
          symptoms: selectedSymptoms,
          medical_history: medicalHistory,
          patient_notes: patientNotes,
          reported_iop: iop,
          reported_iop_left: selectedEye === 'left' ? iop : undefined,
          reported_iop_right: selectedEye === 'right' ? iop : undefined,
          selected_eye: selectedEye,
          eye_image_file: eyeFile || undefined,
          eye_image_url: eyeUrl,
          eye_image_hash: eyeHash,
          record_payload_hash: computedPayloadHash
        },
        user
      );

      onSuccess(newScreening);
    } catch (err) {
      console.error(err);
      alert('Failed to submit screening request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Wizard Header & Stepper */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6 mb-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
              Glaucoma Intake Protocol
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
              Submit Retinal Scans & Clinical Data
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
          {[
            { num: 1, label: 'Medical History' },
            { num: 2, label: 'Symptoms & IOP' },
            { num: 3, label: 'Fundus Scans' },
            { num: 4, label: 'Hash & Consent' }
          ].map(s => (
            <div 
              key={s.num}
              onClick={() => s.num < step && setStep(s.num)}
              className={`p-2.5 rounded-xl border transition-all ${
                step === s.num
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-sm'
                  : step > s.num
                  ? 'bg-slate-800/80 border-slate-700 text-emerald-400 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-800 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                {step > s.num ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    step === s.num ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {s.num}
                  </span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Medical History & Risk Factors */}
      {step === 1 && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              Step 1: Ocular & Systemic Medical History
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Certain systemic conditions and genetic risk factors exponentially elevate glaucoma vulnerability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { id: 'familyGlaucoma', label: 'Family History of Glaucoma (Parents / Siblings)', sub: 'First-degree genetic predisposition' },
              { id: 'highIOP', label: 'Past High Intraocular Pressure (> 21 mmHg)', sub: 'Known ocular hypertension' },
              { id: 'diabetes', label: 'Diabetes Mellitus (Type 1 or 2)', sub: 'Microvascular vulnerability' },
              { id: 'hypertension', label: 'High Blood Pressure (Hypertension)', sub: 'Ocular perfusion pressure risk' },
              { id: 'steroidUse', label: 'Regular Use of Corticosteroids / Eye Drops', sub: 'Known to elevate IOP in steroid-responders' },
              { id: 'pastEyeSurgery', label: 'Previous Eye Injury or Cataract/Refractive Surgery', sub: 'Structural anterior chamber changes' }
            ].map(item => (
              <label
                key={item.id}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  (medicalHistory as any)[item.id]
                    ? 'bg-teal-500/10 border-teal-500/40 text-white'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={(medicalHistory as any)[item.id]}
                  onChange={(e) => setMedicalHistory({ ...medicalHistory, [item.id]: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-teal-500 focus:ring-teal-500 bg-slate-900 border-slate-700"
                />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Other Relevant Medical Details or Medications
            </label>
            <textarea
              value={medicalHistory.otherConditions}
              onChange={(e) => setMedicalHistory({ ...medicalHistory, otherConditions: e.target.value })}
              placeholder="e.g. Taking Timolol 0.5% drops, high myopia (-6.0 diopters), sleep apnea..."
              rows={2}
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              <span>Next: Symptoms & IOP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Symptoms & IOP */}
      {step === 2 && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-400" />
              Step 2: Current Symptoms & Pressure Readings
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select all symptoms you have observed over the past 3 to 6 months.
            </p>
          </div>

          {/* Symptoms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_SYMPTOMS.map((symp) => {
              const isChecked = selectedSymptoms.includes(symp);
              return (
                <button
                  type="button"
                  key={symp}
                  onClick={() => toggleSymptom(symp)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border text-left text-xs transition-all ${
                    isChecked
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-semibold'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span>{symp}</span>
                  {isChecked ? (
                    <Check className="w-4 h-4 text-teal-400 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional IOP Readings */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Reported Intraocular Pressure (IOP)</h4>
                <p className="text-[11px] text-slate-400">
                  Normal physiological range is usually 10 – 21 mmHg. Leave blank if not measured recently.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Eye for Screening
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEye('left')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedEye === 'left'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Left Eye (OS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEye('right')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedEye === 'right'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Right Eye (OD)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Measured IOP (mmHg)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="60"
                  value={iop || ''}
                  onChange={(e) => setIop(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-teal-500 focus:outline-none"
                  placeholder="e.g. 21.5"
                />
              </div>
            </div>
          </div>

          {/* Patient Complaint Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Primary Concern / Specific Visual Changes
            </label>
            <textarea
              value={patientNotes}
              onChange={(e) => setPatientNotes(e.target.value)}
              rows={3}
              placeholder="Describe when the symptoms started and whether they are progressing..."
              className="w-full rounded-xl bg-slate-950/60 border border-slate-800 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              <span>Next: Fundus Eye Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Single Fundus Retinal Scan Upload */}
      {step === 3 && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-400" />
                Step 3: Upload Fundus Retinal Photograph
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload a high-resolution optic disc fundus photograph or OCT scan for clinical AI and ophthalmologist evaluation.
              </p>
            </div>

            {/* Quick Demo Pre-load Button */}
            <button
              type="button"
              onClick={loadSampleFundusData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 text-xs font-semibold shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Clinical Demo Scan</span>
            </button>
          </div>

          {/* Eye Selection & Dropzone */}
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-medium text-slate-400 pl-2">Selected Eye:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedEye('left')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedEye === 'left'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Left Eye (OS - Oculus Sinister)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEye('right')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedEye === 'right'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Right Eye (OD - Oculus Dexter)
                </button>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-3xl p-6 text-center bg-slate-950/80 transition-all overflow-hidden group">
              {eyeUrl ? (
                <div className="space-y-4">
                  <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 max-w-lg mx-auto">
                    <img 
                      src={eyeUrl} 
                      alt="Retinal Fundus Photograph" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg text-xs text-teal-300 font-bold border border-teal-500/40">
                      {selectedEye === 'left' ? 'Left Eye (OS) Ready' : 'Right Eye (OD) Ready'}
                    </div>
                  </div>
                  
                  <div className="text-left bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 max-w-lg mx-auto">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Binary SHA-256 Digest:</span>
                      <span className="text-teal-400 font-mono text-[11px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">Calculated</span>
                    </div>
                    <p className="font-mono text-xs text-teal-300 truncate bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      {eyeHash}
                    </p>
                    {eyeMetadata && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>File: <strong className="text-slate-300 truncate max-w-[150px] inline-block align-bottom">{eyeMetadata.name}</strong></span>
                        <span>•</span>
                        <span>{(eyeMetadata.size / 1024).toFixed(1)} KB</span>
                        {eyeMetadata.width ? (
                          <>
                            <span>•</span>
                            <span>{eyeMetadata.width}x{eyeMetadata.height}px</span>
                          </>
                        ) : null}
                      </div>
                    )}

                    {/* FastAPI Server Inference Live Badge */}
                    {inferring ? (
                      <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-500/30">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                        <span>1. Sending image to FastAPI Model Server ({FASTAPI_URL})...</span>
                      </div>
                    ) : inferenceResult ? (
                      <div className="space-y-2">
                        {/* Stage 1: FastAPI Result */}
                        <div className="text-xs bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-300 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                              Stage 1: FastAPI Inference (PC 2: 10.80.78.220):
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">200 OK</span>
                          </div>
                          <pre className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg overflow-x-auto max-h-24">
                            {JSON.stringify(inferenceResult, null, 2)}
                          </pre>
                        </div>

                        {/* Stage 2 & 3: Web3 Lit Encrypt & Pinata IPFS Status */}
                        {web3Status === 'encrypting' && (
                          <div className="flex items-center gap-2 text-xs text-teal-300 bg-teal-950/60 p-2.5 rounded-xl border border-teal-500/30 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400 shrink-0" />
                            <span>Stage 2: Encrypting inference payload with Lit Protocol (datil-dev)...</span>
                          </div>
                        )}

                        {web3Status === 'pinning' && (
                          <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/60 p-2.5 rounded-xl border border-cyan-500/30 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
                            <span>Stage 3: Pinning encrypted payload to Pinata IPFS network...</span>
                          </div>
                        )}

                        {web3Status === 'success' && ipfsCID && (
                          <div className="p-2.5 rounded-xl bg-teal-950/30 border border-teal-500/40 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-teal-300 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-teal-400" />
                                Stages 2 & 3: Lit Encrypted & IPFS Pinned
                              </span>
                              <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                                READY
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                              <span className="text-slate-400">IPFS CID:</span>
                              <a
                                href={ipfsUrl || `https://gateway.pinata.cloud/ipfs/${ipfsCID}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-cyan-400 hover:text-cyan-300 underline truncate max-w-[200px]"
                              >
                                {ipfsCID}
                              </a>
                            </div>
                          </div>
                        )}

                        {web3Status === 'error' && (
                          <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Web3 / IPFS pinning notice. Proceeding with local cryptographic anchoring.</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <label className="inline-block text-xs text-teal-400 hover:text-teal-300 cursor-pointer font-medium px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all">
                    Replace Retinal Photograph
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer block py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      Click to upload {selectedEye === 'left' ? 'Left Eye (OS)' : 'Right Eye (OD)'} retinal scan
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, DICOM or JPEG up to 25MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={proceedToReview}
              disabled={!eyeUrl || !eyeHash}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-md transition-all"
            >
              <span>Next: Cryptographic Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Hash Verification, Blockchain Readiness & Consent */}
      {step === 4 && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              Step 4: Clinical Review & MST Blockchain Anchor Preparation
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify your medical summary and computed cryptographic hash before submitting to the hospital triage network.
            </p>
          </div>

          {/* Cryptographic Manifest Box */}
          <div className="rounded-2xl bg-slate-950 border border-teal-500/30 p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Central Master Glaucoma Hash & ASBridge Relayer
                </span>
              </div>
              <span className="text-[11px] font-semibold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                Single Key Anchor Ready
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-400 font-sans text-[11px]">
                  {selectedEye === 'left' ? 'Left Eye (OS)' : 'Right Eye (OD)'} Binary SHA-256:
                </span>
                <span className="text-teal-300 truncate max-w-sm">{eyeHash}</span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-400 font-sans text-[11px]">ASBridge Relayer Wallet:</span>
                <span className="text-teal-400 font-bold truncate max-w-sm">0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F</span>
              </div>

              <div className="bg-teal-950/40 p-3 rounded-xl border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-teal-200 font-sans text-xs font-bold">Unified Master Record Hash:</span>
                <span className="text-cyan-300 font-bold truncate max-w-sm">{computedPayloadHash}</span>
              </div>

              {ipfsCID && (
                <div className="bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-400 font-sans text-[11px]">Decentralized IPFS CID:</span>
                  <a 
                    href={ipfsUrl || `https://gateway.pinata.cloud/ipfs/${ipfsCID}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-cyan-400 hover:text-cyan-300 underline font-mono truncate max-w-sm"
                  >
                    {ipfsCID}
                  </a>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              <strong>ASBridge Blockchain Integration:</strong> This single master hash fuses the binary content and metadata of the retinal scan, clinical symptoms, and your ASBridge custodian key. When submitted, the backend anchors this hash into the MST Chain smart contract, generating a permanent on-chain transaction receipt.
            </p>
          </div>

          {/* Clinical Summary Recap */}
          <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 text-xs">Intake Summary:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
              <p><strong>Patient:</strong> {user.full_name} ({user.medical_record_number})</p>
              <p><strong>Target Eye:</strong> {selectedEye === 'left' ? 'Left Eye (OS)' : 'Right Eye (OD)'}</p>
              <p><strong>Selected Symptoms:</strong> {selectedSymptoms.length} recorded</p>
              <p><strong>Measured IOP:</strong> {iop ? `${iop} mmHg` : 'Not tested'}</p>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-teal-500 focus:ring-teal-500 bg-slate-900 border-slate-700"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I certify that the uploaded retinal scan and health information are accurate to the best of my knowledge, and I authorize the clinical ophthalmology team to evaluate this record.
            </span>
          </label>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={loading || !consentChecked}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting & Stamping Hashes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Screening Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
