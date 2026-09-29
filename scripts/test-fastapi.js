/**
 * FastAPI Model Server Full Image Verification Test
 */

const FASTAPI_URL = "http://10.80.78.220:8000/api/predict";

async function testWithRealFundusImage() {
  console.log("======================================================");
  console.log("   FastAPI Real Eye Image Upload & Inference Test     ");
  console.log("======================================================");
  console.log(`🎯 Sending real fundus scan to: ${FASTAPI_URL}\n`);

  try {
    // Fetch a real public fundus image from Unsplash / medical dataset
    console.log("📥 1. Downloading real retinal fundus photograph for test...");
    const sampleFundusUrl = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80";
    const imgRes = await fetch(sampleFundusUrl);
    const imgBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([imgBuffer], { type: 'image/jpeg' });

    console.log(`✅ Test image loaded (${(blob.size / 1024).toFixed(1)} KB)`);

    console.log("📤 2. Uploading to FastAPI Server with parameter 'image'...");
    const formData = new FormData();
    formData.append("image", blob, "fundus_scan.jpg");

    const startTime = Date.now();
    const response = await fetch(FASTAPI_URL, {
      method: "POST",
      body: formData
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️ Response Time: ${duration}ms`);
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);

    const resText = await response.text();
    try {
      const json = JSON.parse(resText);
      console.log("\n🎉 SUCCESS! FastAPI Model Inference Output:");
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log("\nServer Raw Response:\n", resText);
    }

  } catch (err) {
    console.error("❌ Test error:", err.message);
  }
}

testWithRealFundusImage();
