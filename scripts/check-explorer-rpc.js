async function findMetaMaskData() {
  const res = await fetch('https://testnet.mstscan.com');
  const html = await res.text();

  // Find chain config in script tags
  const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const s of scripts) {
    if (s.includes('rpc') || s.includes('chainId') || s.includes('91562037') || s.includes('rpcUrls')) {
      console.log('--- Matching script ---');
      console.log(s.slice(0, 1000));
    }
  }

  // Let's also check /api/v2/config or /api/v2/chains
  const res2 = await fetch('https://testnet.mstscan.com/api/v2/config');
  if (res2.ok) {
    const text2 = await res2.text();
    console.log('Config json:', text2);
  }
}

findMetaMaskData();
