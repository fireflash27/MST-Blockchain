async function checkAddress() {
  try {
    const res = await fetch('https://testnet.mstscan.com/api/v2/addresses/0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F');
    if (res.ok) {
      const data = await res.json();
      console.log('Address info:', JSON.stringify(data, null, 2));
    } else {
      console.log('Address fetch failed:', res.status);
    }
  } catch(e) {
    console.log('Error:', e.message);
  }

  try {
    const txRes = await fetch('https://testnet.mstscan.com/api/v2/addresses/0x3C33D9c4a3F087F6662D0Ab198bAD3e2212e606F/transactions');
    if (txRes.ok) {
      const txData = await txRes.json();
      console.log('Transactions on Explorer:', JSON.stringify(txData, null, 2));
    }
  } catch(e) {
    console.log('Tx fetch error:', e.message);
  }
}

checkAddress();
