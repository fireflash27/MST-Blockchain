import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  ShieldCheck, 
  Layers, 
  FileCode, 
  ArrowRight, 
  Check, 
  Copy, 
  Lock,
  Database,
  ExternalLink
} from 'lucide-react';

interface MSTBlockchainExplorerModalProps {
  onClose: () => void;
}

export const MSTBlockchainExplorerModal: React.FC<MSTBlockchainExplorerModalProps> = ({
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const sampleSolidityContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OcuTrustMSTAnchor
 * @dev Notarizes Glaucoma screening records and clinical evaluations
 * on MST Chain (Parlia Consensus) for immutable tamper detection.
 */
contract OcuTrustMSTAnchor {
    struct ScreeningRecord {
        bytes32 recordPayloadHash;
        bytes32 leftEyeImageHash;
        bytes32 rightEyeImageHash;
        bytes32 doctorReportHash;
        address clinicianSigner;
        uint256 timestamp;
        bool isAnchored;
    }

    mapping(bytes32 => ScreeningRecord) public screenings;
    event ScreeningAnchored(bytes32 indexed recordHash, address indexed clinician, uint256 timestamp);

    function anchorScreening(
        bytes32 _recordHash,
        bytes32 _leftEyeHash,
        bytes32 _rightEyeHash,
        bytes32 _reportHash
    ) external {
        require(!screenings[_recordHash].isAnchored, "Record already anchored");
        screenings[_recordHash] = ScreeningRecord({
            recordPayloadHash: _recordHash,
            leftEyeImageHash: _leftEyeHash,
            rightEyeImageHash: _rightEyeHash,
            doctorReportHash: _reportHash,
            clinicianSigner: msg.sender,
            timestamp: block.timestamp,
            isAnchored: true
        });
        emit ScreeningAnchored(_recordHash, msg.sender, block.timestamp);
    }
}`;

  const handleCopySol = () => {
    navigator.clipboard.writeText(sampleSolidityContract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                MST Blockchain Architecture & Readiness Spec
              </h2>
              <p className="text-xs text-slate-400">
                Bridge between Supabase Web2 Clinical Layer & MST Chain (EVM Parlia Consensus)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* Architecture Concept Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold">
                <Database className="w-4 h-4" />
                <span>1. Off-Chain Storage</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Large medical data (retinal fundus DICOM/PNG images, patient notes, doctor evaluations) live securely in Supabase PostgreSQL + Storage under strict RLS policies.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>2. SHA-256 Digesting</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Before upload, images and clinical records are deterministically fingerprinted into standard SHA-256 cryptographic hashes on the client.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2 bg-gradient-to-br from-slate-950 to-cyan-950/30">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>3. MST On-Chain Anchor</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Only the compact 32-byte hash digests are anchored into MST Smart Contracts via Parlia consensus, providing immutable proof of existence with near-zero gas costs.
              </p>
            </div>

          </div>

          {/* Solidity Smart Contract Spec */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Target MST Smart Contract Interface
              </span>
              <button
                onClick={handleCopySol}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Solidity ABI'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-teal-300 overflow-x-auto leading-relaxed">
              {sampleSolidityContract}
            </pre>
          </div>

          {/* MST Network Parameters */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200">MST Chain Technical Parameters:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400 font-mono text-[11px]">
              <div>
                <p className="text-slate-500 font-sans">Consensus:</p>
                <p className="text-teal-300 font-bold">Parlia Mechanism</p>
              </div>
              <div>
                <p className="text-slate-500 font-sans">EVM Compatibility:</p>
                <p className="text-teal-300 font-bold">Full 100%</p>
              </div>
              <div>
                <p className="text-slate-500 font-sans">Native Token:</p>
                <p className="text-teal-300 font-bold">MSTC (18 Decimals)</p>
              </div>
              <div>
                <p className="text-slate-500 font-sans">Decentralized Trust:</p>
                <p className="text-teal-300 font-bold">Tamper-Proof Audit</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
