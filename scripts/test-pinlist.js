import https from 'https';

const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjMDZkNmIzNy0xNTIxLTRkZTEtYjNhNS1kMzliMjM4ZTk3YjYiLCJlbWFpbCI6InN1bWl0a3VtYXJwaXB0QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ODEwZTMxZGUwM2YwNGRlZmQ4YSIsInNjb3BlZEtleVNlY3JldCI6ImY1ZWQ4NGM1NGQ1MWYyZTgxNTJlMWQzNmU5YWExYWJmY2VjZTU4NjhjYzA0Nzk5NDIxNDkwOGU5MzczZjIzZGQiLCJleHAiOjE4MjIxNzk5MTV9.LCUlvjmFHEqXLVgzPfVv2dQ7lL6cRPeEwrBoWweTqG8";
const cid = "QmXXTS9aL3tJbrwnHqnN6EVjjG472V74PvCmizjvmQ8GeZ";

const agent = new https.Agent({ rejectUnauthorized: false });

async function queryPinata() {
  const url = `https://api.pinata.cloud/data/pinList?hashContains=${cid}&status=pinned`;
  console.log("Querying Pinata API for CID:", cid);
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    // @ts-ignore
    dispatcher: new (await import('undici')).Agent({ connect: { rejectUnauthorized: false } })
  });

  console.log("Pinata API Status:", res.status);
  const data = await res.json();
  console.log("Pinata pinList result:", JSON.stringify(data, null, 2));
}

queryPinata().catch(console.error);
