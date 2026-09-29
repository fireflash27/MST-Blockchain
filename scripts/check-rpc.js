import { ethers } from 'ethers';

const PRIVATE_KEY = '0xf2c93b527bb23cffc817152cf226c0841448b0e1d4bca20781d2ff48fdd7150e';
const wallet = new ethers.Wallet(PRIVATE_KEY);

console.log('Address from Private Key:', wallet.address);

async function check() {
  const url = 'https://testnet.mstscan.com';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
    });
    const data = await res.text();
    console.log('Response from https://testnet.mstscan.com:', data.slice(0, 300));
  } catch(e) {
    console.log('Fetch error:', e.message);
  }
}

check();
