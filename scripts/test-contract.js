import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0xc67fae64e99926b29af5bc33632e9e9a306f6142";
const RPC_URL = "https://testnetrpc.mstblockchain.com";
const PRIVATE_KEY = "0xf2c93b527bb23cffc817152cf226c0841448b0e1d4bca20781d2ff48fdd7150e";

const CONTRACT_ABI = [
  "function grantAccess(string calldata _recordId, address _hospital) external",
  "function revokeAccess(string calldata _recordId, address _hospital) external",
  "function accessRights(address patient, string recordId, address hospital) view returns (bool)",
  "event AccessGranted(address indexed patient, string recordId, address indexed hospital)",
  "event AccessRevoked(address indexed patient, string recordId, address indexed hospital)"
];

async function testContract() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("Wallet address:", wallet.address);

  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  const recordId = `REC-${Date.now()}`;
  const hospital = "0x9840d3Ce974dE5feD4e78981E105fF08CcD09E6A";

  console.log(`Calling grantAccess('${recordId}', '${hospital}')...`);
  const tx = await contract.grantAccess(recordId, hospital);
  console.log("Transaction broadcasted! Tx Hash:", tx.hash);
  const receipt = await tx.wait(1);
  console.log("✅ Transaction mined in block:", receipt.blockNumber);

  const hasAccess = await contract.accessRights(wallet.address, recordId, hospital);
  console.log("✅ Verified on-chain accessRights:", hasAccess);
}

testContract();
