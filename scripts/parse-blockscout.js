async function parseMain() {
  const res = await fetch('https://testnet.mstscan.com');
  const html = await res.text();
  
  // Find any rpc or http references in next.js data
  const matches = html.match(/https?:\/\/[a-zA-Z0-9.\-_:/]+/g) || [];
  const unique = [...new Set(matches)].filter(u => u.includes('rpc') || u.includes('mst') || u.includes('91562037'));
  console.log('Found URLs in Blockscout page:', unique);

  // Check NEXT_DATA
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
  if (nextDataMatch) {
    try {
      const parsed = JSON.parse(nextDataMatch[1]);
      console.log('Next.js RPC configs:', JSON.stringify(parsed.props?.pageProps?.config || parsed.props?.pageProps, null, 2).slice(0, 1000));
    } catch(e) {
      console.log('Error parsing NEXT_DATA:', e.message);
    }
  }
}

parseMain();
