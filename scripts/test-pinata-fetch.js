const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMDZkNmIzNy0xNTIxLTRkZTEtYjNhNS1kMzliMjM4ZTk3YjYiLCJlbWFpbCI6InN1bWl0a3VtYXJwaXB0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODEwZTMxZGUwM2YwNGRlZmQ4YSIsInNjb3BlZEtleVNlY3JldCI6ImY1ZWQ4NGM1NGQ1MWYyZTgxNTJlMWQzNmU5YWExYWJmY2VjZTU4NjhjYzA0Nzk5NDIxNDkwOGU5MzczZjIzZGQiLCJleHAiOjE4MjIxNzk5MTV9.LCUlvjmFHEqXLVgzPfVv2dQ7lL6cRPeEwrBoWweTqG8";
const cid = "QmXXTS9aL3tJbrwnHqnN6EVjjG472V74PvCmizjvmQ8GeZ";

async function testGateways() {
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`
  ];

  console.log("Testing IPFS Gateways for CID:", cid);
  
  for (const gw of gateways) {
    try {
      console.log(`Checking ${gw}...`);
      const res = await fetch(gw, {
        headers: gw.includes('pinata') ? { 'Authorization': `Bearer ${PINATA_JWT}` } : {}
      });
      console.log(`Status for ${gw}: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`✅ SUCCESS on ${gw}: Payload snippet ->`, text.slice(0, 100));
        return;
      }
    } catch (e) {
      console.log(`❌ Error on ${gw}:`, e.message);
    }
  }
}

testGateways();
