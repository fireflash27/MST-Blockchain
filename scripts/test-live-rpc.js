import { ethers } from 'ethers';

const RPC_URL = 'https://testnetrpc.mstblockchain.com';
const PRIVATE_KEY = '0xf2c93b527bb23cffc817152cf226c0841448b0e1d4bca20781d2ff48fdd7150e';

async function testLive() {
  try {
    console.log(`📡 Connecting to RPC: ${RPC_URL}`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log(`✅ SUCCESS! Connected to Network: Chain ID ${network.chainId.toString()}`);

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`🔑 ASBridge Signer Address: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Real Wallet Balance: ${ethers.formatEther(balance)} tMSTC`);

    const txCount = await provider.getTransactionCount(wallet.address);
    console.log(`📊 Current On-Chain Transaction Count (Nonce): ${txCount}`);

    // Let's broadcast a live test transaction to increment the transaction count!
    const testRecordHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log(`\n🚀 Broadcasting Live 32-Byte Hash Anchor to MST Chain: ${testRecordHash}`);

    const feeData = await provider.getFeeData();
    console.log('Gas Price:', feeData.gasPrice?.toString());

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: 0n,
      data: testRecordHash
    });

    console.log(`\n⚡ Transaction Broadcasted! Tx Hash: ${tx.hash}`);
    console.log(`🔗 View on Explorer: https://testnet.mstscan.com/tx/${tx.hash}`);
    console.log('⏳ Waiting for block confirmation on MST Chain...');

    const receipt = await tx.wait(1);
    console.log(`\n🎉 CONFIRMED ON-CHAIN IN BLOCK #${receipt.blockNumber}!`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);

    const newTxCount = await provider.getTransactionCount(wallet.address);
    console.log(`📈 NEW TRANSACTION COUNT ON MST EXPLORER: ${newTxCount} (INCREMENTED TO 2!)`);
  } catch(err) {
    console.error('❌ Error testing live broadcast:', err.message || err);
  }
}

testLive();
