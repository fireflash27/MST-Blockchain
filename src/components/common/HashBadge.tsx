import React, { useState } from 'react';
import { shortenHash } from '../../lib/crypto';
import { Copy, Check, ShieldCheck, Lock } from 'lucide-react';

interface HashBadgeProps {
  hash?: string;
  label?: string;
  isAnchored?: boolean;
  className?: string;
}

export const HashBadge: React.FC<HashBadgeProps> = ({
  hash,
  label = 'SHA-256',
  isAnchored = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      title={`Click to copy full SHA-256 digest:\n${hash}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer transition-all border ${
        isAnchored 
          ? 'bg-teal-950/40 border-teal-500/30 text-teal-300 hover:bg-teal-900/40' 
          : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
      } ${className}`}
    >
      {isAnchored ? (
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
      ) : (
        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
      )}
      
      {label && <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider">{label}:</span>}
      <span className="font-medium tracking-tight text-slate-200">{shortenHash(hash, 5)}</span>
      
      <button 
        type="button" 
        className="p-0.5 ml-0.5 rounded text-slate-400 hover:text-white"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
};
