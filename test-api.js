// Simple test script to call the API
const testCreateToken = async () => {
  try {
    const response = await fetch('http://localhost:3000/create-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataUrl: 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json'
      })
    });

    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Token created successfully!');
      console.log('🪙 Mint Address:', result.data.mintAddress);
      console.log('📝 Transaction Signature:', result.data.transactionSignature);
      console.log('🔗 Explorer URL:', result.data.explorerUrl);
    } else {
      console.log('\n❌ Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to call API:', error.message);
  }
};

testCreateToken();
