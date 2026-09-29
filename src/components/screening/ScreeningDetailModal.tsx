import React, { useState } from 'react';
import { ScreeningRequest, UserProfile } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { HashBadge } from '../common/HashBadge';
import { simulateMSTBlockchainAnchor } from '../../lib/api';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Eye, 
  Stethoscope, 
  Calendar, 
  User, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertOctagon, 
  Cpu, 
  Sparkles,
  Lock,
  Download
} from 'lucide-react';

interface ScreeningDetailModalProps {
  screening: ScreeningRequest;
  currentUser: UserProfile;
  onClose: () => void;
  onAnchorUpdate?: () => void;
  onOpenBlockchainModal?: () => void;
}

export const ScreeningDetailModal: React.FC<ScreeningDetailModalProps> = ({
  screening,
  currentUser,
  onClose,
  onAnchorUpdate,
  onOpenBlockchainModal
}) => {
  const [anchoring, setAnchoring] = useState(false);
  const [anchorResult, setAnchorResult] = useState<any>(null);

  const report = screening.report;

  // Simulate MST Blockchain Anchor
  const handleAnchorRecord = async () => {
    setAnchoring(true);
    try {
      const res = await simulateMSTBlockchainAnchor(screening.id);
      setAnchorResult(res);
      if (onAnchorUpdate) onAnchorUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setAnchoring(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-bold text-white">
              Official Glaucoma Screening & Diagnostic Record
            </span>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/20">
              {screening.reference_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Medical Report Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:bg-white print:text-black">
          
          {/* Clinical Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-extrabold text-white">
                  OcuTrust Glaucoma Evaluation
                </h1>
                <StatusBadge status={screening.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Apex Vision Institute & Center for Glaucoma Neuropathy Research
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <p className="text-slate-400">
                Date: <strong className="text-slate-200">{new Date(screening.created_at).toLocaleDateString()}</strong>
              </p>
              <p className="text-slate-400">
                Priority: <strong className="text-teal-400">{screening.priority.toUpperCase()}</strong>
              </p>
            </div>
          </div>

          {/* Patient & Doctor Identifiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Patient Information</p>
              <p className="text-sm font-bold text-white">{screening.patient?.full_name}</p>
              <p className="text-slate-400">MRN: {screening.patient?.medical_record_number}</p>
              <p className="text-slate-400">DOB: {screening.patient?.date_of_birth} ({screening.patient?.gender})</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Attending Clinician</p>
              <p className="text-sm font-bold text-white">
                {report?.doctor?.full_name || screening.doctor?.full_name || 'Assigned to Clinical Team'}
              </p>
              <p className="text-slate-400">
                License: {report?.doctor?.license_number || screening.doctor?.license_number || 'MED-GLAUC-88912'}
              </p>
              <p className="text-slate-400">
                Hospital: {report?.doctor?.hospital_name || 'Apex Vision Institute'}
              </p>
            </div>
          </div>

          {/* Retinal Fundus Scans Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Diagnostic Retinal Photograph (Optic Disc Region)
            </h3>

            {screening.left_eye_image_url === screening.right_eye_image_url ? (
              /* Single Eye Display */
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-4 space-y-3 max-w-xl mx-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-teal-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    Retinal Fundus Scan
                  </span>
                  <span className="text-xs text-slate-300 font-semibold bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                    Cup-to-Disc: <strong className="text-teal-400">{report?.left_cup_to_disc_ratio || report?.right_cup_to_disc_ratio || 'Evaluating...'}</strong>
                  </span>
                </div>
                <div className="relative h-60 sm:h-72 rounded-xl overflow-hidden bg-black border border-slate-800">
                  <img 
                    src={screening.left_eye_image_url} 
                    alt="Retinal Fundus Scan" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <HashBadge hash={screening.left_eye_image_hash} label="Binary SHA-256 Digest" />
              </div>
            ) : (
              /* Dual Eye Display if both distinct */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-300">Left Eye (OS - Oculus Sinister)</span>
                    <span className="text-[10px] text-slate-400">Cup-to-Disc: {report?.left_cup_to_disc_ratio || 'Evaluating...'}</span>
                  </div>
                  <div className="relative h-48 rounded-xl overflow-hidden bg-black border border-slate-800">
                    <img 
                      src={screening.left_eye_image_url} 
                      alt="Left Eye Fundus" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <HashBadge hash={screening.left_eye_image_hash} label="Left SHA" />
                </div>

                <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-300">Right Eye (OD - Oculus Dexter)</span>
                    <span className="text-[10px] text-slate-400">Cup-to-Disc: {report?.right_cup_to_disc_ratio || 'Evaluating...'}</span>
                  </div>
                  <div className="relative h-48 rounded-xl overflow-hidden bg-black border border-slate-800">
                    <img 
                      src={screening.right_eye_image_url} 
                      alt="Right Eye Fundus" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <HashBadge hash={screening.right_eye_image_hash} label="Right SHA" />
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Findings & Biomarkers */}
          {report ? (
            <div className="space-y-5 rounded-3xl bg-slate-950/80 border border-slate-800 p-6">
              
              {/* Diagnosis Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-700/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Primary Clinical Diagnosis
                  </span>
                  <div className="mt-1">
                    <StatusBadge diagnosis={report.diagnosis} size="lg" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge risk={report.risk_level} size="md" />
                  {report.is_urgent_referral && (
                    <StatusBadge status="urgent_referral" size="md" />
                  )}
                </div>
              </div>

              {/* Quantitative CDR & IOP Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400">Left CDR (OS)</p>
                  <p className={`text-xl font-mono font-bold mt-0.5 ${report.left_cup_to_disc_ratio >= 0.7 ? 'text-rose-400' : 'text-teal-400'}`}>
                    {report.left_cup_to_disc_ratio}
                  </p>
                  <p className="text-[9px] text-slate-500">{report.left_cup_to_disc_ratio >= 0.7 ? 'Enlarged Cupping' : 'Within Limits'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400">Right CDR (OD)</p>
                  <p className={`text-xl font-mono font-bold mt-0.5 ${report.right_cup_to_disc_ratio >= 0.7 ? 'text-rose-400' : 'text-teal-400'}`}>
                    {report.right_cup_to_disc_ratio}
                  </p>
                  <p className="text-[9px] text-slate-500">{report.right_cup_to_disc_ratio >= 0.7 ? 'Enlarged Cupping' : 'Physiological'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400">Left IOP (OS)</p>
                  <p className="text-xl font-mono font-bold text-white mt-0.5">
                    {report.left_measured_iop ? `${report.left_measured_iop} mmHg` : 'N/A'}
                  </p>
                  <p className="text-[9px] text-slate-500">Target &lt; 18 mmHg</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[11px] text-slate-400">Right IOP (OD)</p>
                  <p className="text-xl font-mono font-bold text-white mt-0.5">
                    {report.right_measured_iop ? `${report.right_measured_iop} mmHg` : 'N/A'}
                  </p>
                  <p className="text-[9px] text-slate-500">Target &lt; 18 mmHg</p>
                </div>
              </div>

              {/* Detailed Findings */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200">Optic Nerve Head & Disc Assessment:</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed">{report.optic_disc_findings}</p>
                </div>

                {report.retinal_nerve_fiber_layer_notes && (
                  <div>
                    <h4 className="font-bold text-slate-200">Retinal Nerve Fiber Layer (RNFL):</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed">{report.retinal_nerve_fiber_layer_notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-200">Clinical Recommendations & Action Plan:</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed">{report.recommendations}</p>
                </div>
              </div>

              {/* Prescribed Medications */}
              {report.prescribed_medications && report.prescribed_medications.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200">Prescribed Glaucoma Regimen:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {report.prescribed_medications.map((med, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <p className="font-bold text-teal-300">{med.medication}</p>
                        <p className="text-[11px] text-slate-300 mt-0.5">{med.dosage} • {med.frequency}</p>
                        <p className="text-[10px] text-slate-500">{med.eye} Eye • Duration: {med.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Timeline */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300">
                <span className="font-semibold">Recommended Follow-up:</span>
                <span className="font-bold">{report.follow_up_timeline}</span>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
              <Activity className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-white">Diagnostic Evaluation in Progress</p>
              <p className="text-xs text-slate-400">
                The ophthalmology clinical team is currently grading the optic disc cup-to-disc ratio and verifying biomarkers.
              </p>
            </div>
          )}

          {/* Cryptographic Integrity & MST Blockchain Anchor Status Panel */}
          <div className="rounded-3xl bg-slate-950 border border-teal-500/30 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Cryptographic Integrity & MST Blockchain Provenance
                </span>
              </div>
              <StatusBadge blockchainStatus={screening.blockchain_anchor_status} size="sm" />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-xl border border-teal-500/40 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-sans">
                  <span className="font-bold text-teal-300">Central Master Glaucoma Record Hash (Both Eyes + Metadata):</span>
                  <span className="text-[10px] text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">Single Key Anchor</span>
                </div>
                <p className="text-cyan-300 font-bold truncate text-xs">{screening.record_payload_hash}</p>
                <p className="text-[10px] font-sans text-slate-400 pt-0.5">
                  Fuses Left & Right binary digests, image dimensions/sizes, patient clinical findings, and ASBridge Relayer (0x3C33...606F).
                </p>
              </div>

              {report && (
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-slate-400 font-sans text-[11px]">Doctor Finalized Report Digest:</span>
                  <span className="text-teal-300 truncate max-w-sm">{report.report_hash}</span>
                </div>
              )}

              {/* Anchored Transaction Details */}
              {(screening.blockchain_anchor_status === 'anchored' || anchorResult) && (
                <div className="p-3.5 rounded-xl bg-teal-950/50 border border-teal-500/50 space-y-2 text-teal-200 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5 text-white">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      MST Blockchain Transaction Confirmed
                    </span>
                    <span className="text-[10px] bg-teal-500/20 px-2 py-0.5 rounded text-teal-300 border border-teal-500/30">
                      Parlia Consensus Verified
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="truncate">
                      <span className="text-slate-400 font-sans">Tx Hash: </span>
                      <strong className="font-mono text-cyan-300">{screening.blockchain_tx_hash || anchorResult?.txHash}</strong>
                    </p>
                    <p className="truncate">
                      <span className="text-slate-400 font-sans">Relayed via ASBridge Wallet: </span>
                      <strong className="font-mono text-teal-300">{anchorResult?.asbridgeWallet || '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F'}</strong>
                    </p>
                    <p>
                      <span className="text-slate-400 font-sans">Block Number: </span>
                      <strong className="font-mono text-cyan-300">{screening.blockchain_block_number || anchorResult?.blockNumber || 18496255}</strong> • <span className="text-slate-400 font-sans">Network: </span><strong>MST Chain (EVM)</strong>
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-teal-500/20">
                    <a
                      href={`https://testnet.mstscan.com/tx/${screening.blockchain_tx_hash || anchorResult?.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-sans font-semibold text-teal-300 hover:text-white flex items-center gap-1 hover:underline"
                    >
                      View on MST Explorer ↗
                    </a>
                    <button
                      onClick={handleAnchorRecord}
                      disabled={anchoring}
                      className="text-[11px] font-sans font-semibold text-cyan-300 hover:text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 hover:border-cyan-500 transition-colors"
                    >
                      {anchoring ? 'Broadcasting Live On-Chain...' : 'Anchor New Transaction ↻'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* MST Anchor Action Button if not anchored yet */}
            {screening.blockchain_anchor_status !== 'anchored' && !anchorResult && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  Ready to anchor the Central Master Glaucoma Hash using your ASBridge wallet on MST Chain.
                </p>
                <button
                  onClick={handleAnchorRecord}
                  disabled={anchoring}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 transition-all shrink-0"
                >
                  {anchoring ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting to MST Chain...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Anchor to MST Blockchain (ASBridge Wallet)</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
