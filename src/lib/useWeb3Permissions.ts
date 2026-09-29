import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESS, 
  MST_RPC, 
  CONTRACT_ABI,
  getReadOnlyPermissionContract 
} from '../contractConfig';

export interface PermissionState {
  recordId: string;
  hospitalAddress: string;
  hasAccess: boolean;
  lastChecked: string;
}

export function useWeb3Permissions() {
  const [account, setAccount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Connect to MetaMask / Web3 provider
  const connectWallet = useCallback(async (): Promise<string | null> => {
    setError(null);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          return accounts[0];
        }
      } else {
        // Fallback to configured relayer address
        const fallbackAddress = import.meta.env.VITE_MST_RELAYER_ADDRESS || '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F';
        setAccount(fallbackAddress);
        return fallbackAddress;
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    }
    return null;
  }, []);

  // Check on-chain access rights
  const checkAccess = useCallback(async (
    recordId: string, 
    hospitalAddress: string, 
    patientAddress?: string
  ): Promise<boolean> => {
    try {
      const contract = getReadOnlyPermissionContract();
      const patient = patientAddress || account || import.meta.env.VITE_MST_RELAYER_ADDRESS || '0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F';
      const hasRight = await contract.accessRights(patient, recordId, hospitalAddress);
      return Boolean(hasRight);
    } catch (err: any) {
      console.error('Error querying accessRights on-chain:', err);
      return false;
    }
  }, [account]);

  // Grant access on-chain
  const grantHospitalAccess = useCallback(async (
    recordId: string, 
    hospitalAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      let signer: ethers.Signer;

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        signer = await browserProvider.getSigner();
      } else {
        // Use configured relayer private key
        const privateKey = import.meta.env.VITE_MST_RELAYER_PRIVATE_KEY;
        if (!privateKey) throw new Error('No Web3 wallet or private key configured for signing.');
        const rpcProvider = new ethers.JsonRpcProvider(MST_RPC);
        signer = new ethers.Wallet(privateKey, rpcProvider);
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      console.log(`📡 Granting access for record "${recordId}" to hospital "${hospitalAddress}" on contract ${CONTRACT_ADDRESS}...`);
      
      const tx = await contract.grantAccess(recordId, hospitalAddress);
      console.log('Tx submitted:', tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait(1);
      console.log('Tx confirmed:', receipt);

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error('Failed to grant access on-chain:', err);
      const errMsg = err.reason || err.message || 'Transaction failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Revoke access on-chain
  const revokeHospitalAccess = useCallback(async (
    recordId: string, 
    hospitalAddress: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      let signer: ethers.Signer;

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        signer = await browserProvider.getSigner();
      } else {
        const privateKey = import.meta.env.VITE_MST_RELAYER_PRIVATE_KEY;
        if (!privateKey) throw new Error('No Web3 wallet or private key configured for signing.');
        const rpcProvider = new ethers.JsonRpcProvider(MST_RPC);
        signer = new ethers.Wallet(privateKey, rpcProvider);
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      console.log(`📡 Revoking access for record "${recordId}" to hospital "${hospitalAddress}" on contract ${CONTRACT_ADDRESS}...`);
      
      const tx = await contract.revokeAccess(recordId, hospitalAddress);
      console.log('Tx submitted:', tx.hash);
      setTxHash(tx.hash);

      const receipt = await tx.wait(1);
      console.log('Tx confirmed:', receipt);

      return { success: true, txHash: tx.hash };
    } catch (err: any) {
      console.error('Failed to revoke access on-chain:', err);
      const errMsg = err.reason || err.message || 'Transaction failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: MST_RPC,
    account,
    loading,
    txHash,
    error,
    connectWallet,
    checkAccess,
    grantHospitalAccess,
    revokeHospitalAccess
  };
}
