async function testEndpoints() {
  const candidates = [
    'https://testnet-rpc.mstchain.info',
    'https://rpc-testnet.mstchain.info',
    'https://testnet.mstchain.info/rpc',
    'https://rpc.mstscan.com',
    'https://rpc-testnet.mstscan.com',
    'https://testnet-rpc.mstscan.com',
    'https://rpc.mstchain.io',
    'https://testnet-rpc.mstchain.io',
    'https://rpc.mstchain.com',
    'https://testnet-rpc.mstchain.com',
    'https://testnet-rpc.mstchain.org',
    'https://rpc.testnet.mstchain.org'
  ];

  for (const c of candidates) {
    try {
      const res = await fetch(c, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 })
      });
      const data = await res.json();
      console.log(`🎯 FOUND WORKING RPC! ${c} -> Chain ID: ${data.result}`);
    } catch(e) {}
  }
  console.log('Done scanning candidate RPC URLs.');
}

testEndpoints();
