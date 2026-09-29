import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = "0xc67fae64e99926b29af5bc33632e9e9a306f6142";
export const MST_RPC = "https://testnetrpc.mstblockchain.com";

export const CONTRACT_ABI = [
  "function grantAccess(string calldata _recordId, address _hospital) external",
  "function revokeAccess(string calldata _recordId, address _hospital) external",
  "function accessRights(address patient, string recordId, address hospital) view returns (bool)",
  "event AccessGranted(address indexed patient, string recordId, address indexed hospital)",
  "event AccessRevoked(address indexed patient, string recordId, address indexed hospital)"
];

export function getReadOnlyPermissionContract() {
  const provider = new ethers.JsonRpcProvider(MST_RPC);
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function getWritablePermissionContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}
