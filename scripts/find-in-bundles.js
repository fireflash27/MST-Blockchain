async function findInBundles() {
  const res = await fetch('https://testnet.mstscan.com');
  const html = await res.text();
  const scriptSrcs = html.match(/src="([^"]+\.js)"/g) || [];
  
  for (const srcAttr of scriptSrcs) {
    const src = srcAttr.replace('src="', '').replace('"', '');
    const fullUrl = src.startsWith('http') ? src : 'https://testnet.mstscan.com' + src;
    try {
      const jsRes = await fetch(fullUrl);
      const jsText = await jsRes.text();
      
      const rpcMatches = jsText.match(/https?:\/\/[a-zA-Z0-9.\-_:/]*(rpc|node|testnet)[a-zA-Z0-9.\-_:/]*/gi) || [];
      if (rpcMatches.length > 0) {
        console.log(`From ${fullUrl}:`, [...new Set(rpcMatches)]);
      }

      // search for chainId 91562037
      if (jsText.includes('91562037')) {
        console.log(`Found 91562037 in ${fullUrl}`);
        const idx = jsText.indexOf('91562037');
        console.log(jsText.slice(Math.max(0, idx - 200), idx + 200));
      }
    } catch(e) {}
  }
}

findInBundles();
