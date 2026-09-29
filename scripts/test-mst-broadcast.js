import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve('.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim();
  }
});

const RPC_URL = env.VITE_MST_RPC_URL || 'https://testnet.mstscan.com';
const PRIVATE_KEY = env.VITE_MST_RELAYER_PRIVATE_KEY || '0xf2c93b527bb23cffc817152cf226c0841448b0e1d4bca20781d2ff48fdd7150e';

console.log('\n======================================================');
console.log('      OcuTrust MST Chain Relayer Connectivity Test     ');
console.log('======================================================\n');

async function testEndpoint(url) {
  try {
    console.log(`📡 Trying RPC Endpoint: ${url}`);
    const provider = new ethers.JsonRpcProvider(url);
    const network = await provider.getNetwork();
    console.log(`✅ SUCCESS! Connected to Chain ID: ${network.chainId}`);

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`🔑 ASBridge Signer Address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Gas Balance: ${ethers.formatEther(balance)} MST`);

    const txCount = await provider.getTransactionCount(wallet.address);
    console.log(`📊 Current On-Chain Transaction Count (Nonce): ${txCount}`);

    // Generate sample 32-byte test hash
    const testHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`\n📦 Broadcasting Sample Anchor Data to MST Chain: ${testHash}`);

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data: testHash
    });

    console.log(`🚀 Transaction broadcasted! Tx Hash: ${tx.hash}`);
    console.log('⏳ Waiting for block confirmation...');
    const receipt = await tx.wait(1);

    console.log(`\n🎉 CONFIRMED IN BLOCK #${receipt.blockNumber}!`);
    console.log(`🔗 Gas Used: ${receipt.gasUsed.toString()}`);

    const newCount = await provider.getTransactionCount(wallet.address);
    console.log(`📈 New On-Chain Transaction Count on Explorer: ${newCount} (INCREMENTED!)`);
    return true;
  } catch (err) {
    console.error(`❌ Error on ${url}:`, err.message || err);
    return false;
  }
}

async function main() {
  const endpoints = [
    RPC_URL,
    'https://testnet.mstscan.com/rpc',
    'https://testnet-rpc.mstscan.com',
    'https://rpc.testnet.mstscan.com'
  ];

  for (const ep of endpoints) {
    const ok = await testEndpoint(ep);
    if (ok) break;
  }
}

main();
