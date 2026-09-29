import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Key, 
  Building2,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { useWeb3Permissions } from '../../lib/useWeb3Permissions';
import { ScreeningRequest } from '../../types/database';
import { shortenHash } from '../../lib/crypto';

interface Web3PermissionManagerModalProps {
  screening: ScreeningRequest;
  onClose: () => void;
}

const KNOWN_HOSPITALS = [
  { name: 'Apex Vision Institute & Glaucoma Center', address: '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F' },
  { name: 'National Ophthalmic Specialty Clinic', address: '0x71C8366420A0926718E2A3f8D658E050c23F27e8' },
  { name: 'Metropolitan Eye & Retinal Foundation', address: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30' }
];

export const Web3PermissionManagerModal: React.FC<Web3PermissionManagerModalProps> = ({
  screening,
  onClose
}) => {
  const {
    contractAddress,
    account,
    loading,
    txHash,
    error,
    connectWallet,
    checkAccess,
    grantHospitalAccess,
    revokeHospitalAccess
  } = useWeb3Permissions();

  const [selectedHospital, setSelectedHospital] = useState<string>(KNOWN_HOSPITALS[0].address);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const targetAddress = customAddress.trim() || selectedHospital;

  // Check access for all known hospitals + custom address
  const refreshPermissions = async () => {
    setChecking(true);
    const results: Record<string, boolean> = {};
    for (const hosp of KNOWN_HOSPITALS) {
      const has = await checkAccess(screening.reference_id, hosp.address);
      results[hosp.address] = has;
    }
    if (customAddress.trim() && customAddress.startsWith('0x')) {
      const has = await checkAccess(screening.reference_id, customAddress.trim());
      results[customAddress.trim()] = has;
    }
    setAccessMap(results);
    setChecking(false);
  };

  useEffect(() => {
    connectWallet();
    refreshPermissions();
  }, [screening.reference_id]);

  const handleGrant = async () => {
    setActionSuccess(null);
    if (!targetAddress || !targetAddress.startsWith('0x')) {
      alert('Please select or enter a valid 0x Ethereum hospital address.');
      return;
    }
    const res = await grantHospitalAccess(screening.reference_id, targetAddress);
    if (res.success) {
      setActionSuccess(`Access successfully granted on-chain to ${shortenHash(targetAddress)}!`);
      await refreshPermissions();
    }
  };

  const handleRevoke = async () => {
    setActionSuccess(null);
    if (!targetAddress || !targetAddress.startsWith('0x')) {
      alert('Please select or enter a valid 0x Ethereum hospital address.');
      return;
    }
    const res = await revokeHospitalAccess(screening.reference_id, targetAddress);
    if (res.success) {
      setActionSuccess(`Access revoked on-chain for ${shortenHash(targetAddress)}!`);
      await refreshPermissions();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
              <Key className="w-3.5 h-3.5 text-teal-400" />
              <span>Web3 Permission Registry (MST Chain)</span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Clinical Record Access Control
            </h2>
            <p className="text-xs text-slate-400">
              Manage cryptographic permission rights on Smart Contract <span className="font-mono text-teal-400">{shortenHash(contractAddress, 4)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Overview Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Record Reference ID: <strong className="text-teal-300 font-mono">{screening.reference_id}</strong></p>
              <p className="text-slate-400 text-[11px] truncate max-w-sm">
                Master Hash: {shortenHash(screening.record_payload_hash, 6)}
              </p>
            </div>
          </div>

          <button
            onClick={refreshPermissions}
            disabled={checking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Querying Chain...' : 'Refresh Access'}</span>
          </button>
        </div>

        {/* Known Hospital Access Registry */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-400" />
            Hospital & Clinic Permissions Status
          </h3>

          <div className="grid grid-cols-1 gap-2.5">
            {KNOWN_HOSPITALS.map((hosp) => {
              const hasAccess = accessMap[hosp.address] || false;
              const isSelected = selectedHospital === hosp.address && !customAddress.trim();

              return (
                <div
                  key={hosp.address}
                  onClick={() => {
                    setSelectedHospital(hosp.address);
                    setCustomAddress('');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-teal-950/30 border-teal-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 text-xs">{hosp.name}</span>
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Access Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">
                          <Lock className="w-3 h-3" />
                          No Access
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-slate-400">{hosp.address}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                      isSelected ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Hospital Address Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Or Grant / Revoke Access to a Custom Hospital Wallet Address:
          </label>
          <input
            type="text"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Feedback Messages */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {txHash && (
          <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-300 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-teal-200">On-Chain Transaction Confirmed:</span>
              <a
                href={`https://testnet.mstscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline font-semibold"
              >
                <span>View on MSTScan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-[11px] truncate text-teal-400/90">{txHash}</p>
          </div>
        )}

        {/* Contract Info Footer */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Contract:</span>
            <span className="font-mono text-slate-300">{contractAddress}</span>
          </div>
          <button
            onClick={() => copyToClipboard(contractAddress)}
            className="flex items-center gap-1 text-teal-400 hover:text-teal-300"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleRevoke}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Revoke Access</span>
          </button>

          <button
            type="button"
            onClick={handleGrant}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Grant Access On-Chain</span>
          </button>
        </div>

      </div>
    </div>
  );
};
