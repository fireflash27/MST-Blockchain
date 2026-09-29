/**
 * OcuTrust Web3 & Pinata IPFS Pipeline
 * Handles decentralized metadata pinning and on-chain permission anchoring
 */

export const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMDZkNmIzNy0xNTIxLTRkZTEtYjNhNS1kMzliMjM4ZTk3YjYiLCJlbWFpbCI6InN1bWl0a3VtYXJwaXB0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODEwZTMxZGUwM2YwNGRlZmQ4YSIsInNjb3BlZEtleVNlY3JldCI6ImY1ZWQ4NGM1NGQ1MWYyZTgxNTJlMWQzNmU5YWExYWJmY2VjZTU4NjhjYzA0Nzk5NDIxNDkwOGU5MzczZjIzZGQiLCJleHAiOjE4MjIxNzk5MTV9.LCUlvjmFHEqXLVgzPfVv2dQ7lL6cRPeEwrBoWweTqG8";

export const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";

/**
 * Upload JSON manifest to IPFS via Pinata
 */
export async function pinJSONToIPFS(jsonData, name = 'ocutrust_clinical_manifest.json') {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PINATA_JWT}`
    },
    body: JSON.stringify({
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name },
      pinataContent: jsonData
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinata IPFS pinning failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    ipfsHash: data.IpfsHash,
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
    ipfsUrl: `${PINATA_GATEWAY}/${data.IpfsHash}`
  };
}

/**
 * Upload binary file/Blob to IPFS via Pinata
 */
export async function pinFileToIPFS(file, name) {
  const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({ name: name || file.name || 'retinal_fundus_scan.png' });
  formData.append('pinataMetadata', metadata);
  formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`
    },
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Pinata File upload failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    ipfsHash: data.IpfsHash,
    pinSize: data.PinSize,
    timestamp: data.Timestamp,
    ipfsUrl: `${PINATA_GATEWAY}/${data.IpfsHash}`
  };
}
