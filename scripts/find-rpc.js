async function findRpc() {
  const testUrls = [
    'https://testnet.mstscan.com/api/v2/config',
    'https://testnet.mstscan.com/api/v2/stats',
    'https://testnet.mstscan.com/api/v2/chains',
    'https://testnet.mstscan.com/api/eth-rpc'
  ];

  for (const u of testUrls) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        const text = await res.text();
        console.log(`=== Result from ${u} ===`);
        console.log(text.slice(0, 500));
      }
    } catch(e) {
      console.log(`Failed ${u}:`, e.message);
    }
  }
}

findRpc();
