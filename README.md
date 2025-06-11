# Solana Token Creation API

A comprehensive REST API for creating Solana tokens with rich metadata and flexible authority management. This API fetches token metadata from hosted JSON files, creates tokens on the Solana blockchain, and provides selective authority revocation capabilities.

## Features

- ✅ **Token Creation**: Create SPL tokens with rich metadata from remote JSON files
- ✅ **Authority Control**: Full control over mint and freeze authorities
- ✅ **Selective Revocation**: Choose to revoke mint authority, freeze authority, or both
- ✅ **Immutable Tokens**: Make tokens truly immutable by revoking authorities
- ✅ **Input Validation**: Comprehensive validation for URLs and metadata structure
- ✅ **Error Handling**: Robust error handling for network failures and malformed data
- ✅ **Wallet Integration**: Uses existing wallet files (no new wallet creation)
- ✅ **Transaction Tracking**: Returns mint addresses and transaction signatures
- ✅ **Built with TypeScript**: Type-safe development with Express.js
- ✅ **Security**: Helmet.js security headers and CORS enabled
- ✅ **Logging**: Request logging with Morgan

## Prerequisites

- Node.js (v16 or higher)
- A Solana wallet file (JSON format)
- Access to Solana devnet

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Configuration

Make sure you have a Solana wallet file in the project root. The default wallet file is `bosYRnpXtejtDXF79Pj4MnTPfHaZiJEFGSs1PsbkXne.json`.

## Usage

### Start the API Server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The server will start on port 3000 by default (or the port specified in the `PORT` environment variable).

## API Endpoints

### 1. Health Check
```
GET /health
```

Returns the API status and timestamp.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Create Token
```
POST /create-token
```

Creates a new Solana token with metadata from a remote JSON file.

**Request Body:**
```json
{
  "metadataUrl": "https://example.com/metadata.json"
}
```

**Required Metadata Structure:**
The JSON file at `metadataUrl` must contain:
```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "description": "Token description",
  "image": "https://example.com/image.png",
  "creator": {
    "name": "Creator Name",
    "site": "https://creator-site.com"
  },
  "external_url": "https://token-website.com",
  "twitter": "@token_twitter",
  "telegram": "https://t.me/token",
  "discord": "https://discord.gg/token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mintAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "token-created-with-standard-method",
    "explorerUrl": "https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet"
  }
}
```

### 3. Revoke Authorities (Enhanced)
```
POST /revoke-authorities
```

Revokes token authorities with selective control over which authorities to revoke.

**Request Body:**
```json
{
  "mintAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "revokeMintAuthority": true,    // Optional, defaults to true
  "revokeFreezeAuthority": true   // Optional, defaults to true
}
```

**Parameters:**
- `mintAddress` (string, required): The mint address of the token
- `revokeMintAuthority` (boolean, optional): Whether to revoke mint authority. Defaults to `true`
- `revokeFreezeAuthority` (boolean, optional): Whether to revoke freeze authority. Defaults to `true`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "mintAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "signatures": ["5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBDLforKn6nL1"],
    "revoked": {
      "mintAuthority": true,
      "freezeAuthority": true
    },
    "message": "Authority revocation completed"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error description"
}
```

## JavaScript Examples

Here are comprehensive JavaScript examples showing all the functionality available through the API:

### 1. Basic Token Creation

```javascript
// Create a token with metadata
const createToken = async () => {
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

    if (result.success) {
      console.log('✅ Token created successfully!');
      console.log('🪙 Mint Address:', result.data.mintAddress);
      console.log('🔗 Explorer URL:', result.data.explorerUrl);
      return result.data.mintAddress;
    } else {
      console.error('❌ Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to create token:', error.message);
    return null;
  }
};

// Usage
const mintAddress = await createToken();
```

### 2. Selective Authority Revocation

#### Revoke Only Mint Authority (Keep Freeze Authority)

```javascript
const revokeMintAuthorityOnly = async (mintAddress) => {
  try {
    const response = await fetch('http://localhost:3000/revoke-authorities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: true,
        revokeFreezeAuthority: false
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Mint authority revoked successfully!');
      console.log('🔑 Mint authority revoked:', result.data.revoked.mintAuthority);
      console.log('🧊 Freeze authority revoked:', result.data.revoked.freezeAuthority);
      console.log('📝 Transaction signature:', result.data.signatures[0]);
      return result;
    } else {
      console.error('❌ Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to revoke mint authority:', error.message);
    return null;
  }
};

// Usage
await revokeMintAuthorityOnly('YOUR_MINT_ADDRESS_HERE');
```

#### Revoke Only Freeze Authority (Keep Mint Authority)

```javascript
const revokeFreezeAuthorityOnly = async (mintAddress) => {
  try {
    const response = await fetch('http://localhost:3000/revoke-authorities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: false,
        revokeFreezeAuthority: true
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Freeze authority revoked successfully!');
      console.log('🔑 Mint authority revoked:', result.data.revoked.mintAuthority);
      console.log('🧊 Freeze authority revoked:', result.data.revoked.freezeAuthority);
      console.log('📝 Transaction signature:', result.data.signatures[0]);
      return result;
    } else {
      console.error('❌ Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to revoke freeze authority:', error.message);
    return null;
  }
};

// Usage
await revokeFreezeAuthorityOnly('YOUR_MINT_ADDRESS_HERE');
```

#### Revoke Both Authorities (Make Token Immutable)

```javascript
const revokeBothAuthorities = async (mintAddress) => {
  try {
    const response = await fetch('http://localhost:3000/revoke-authorities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress
        // Not specifying revokeMintAuthority or revokeFreezeAuthority defaults to both true
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Both authorities revoked - Token is now immutable!');
      console.log('🔑 Mint authority revoked:', result.data.revoked.mintAuthority);
      console.log('🧊 Freeze authority revoked:', result.data.revoked.freezeAuthority);
      console.log('📝 Transaction signature:', result.data.signatures[0]);
      return result;
    } else {
      console.error('❌ Error:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to revoke authorities:', error.message);
    return null;
  }
};

// Usage
await revokeBothAuthorities('YOUR_MINT_ADDRESS_HERE');
```

### 3. Complete Token Creation and Management Workflow

```javascript
// Complete workflow: Create token and manage authorities
const completeTokenWorkflow = async () => {
  console.log('🚀 Starting complete token creation workflow...\n');

  // Step 1: Create token
  console.log('Step 1: Creating token with metadata...');
  const mintAddress = await createToken();

  if (!mintAddress) {
    console.log('❌ Token creation failed, stopping workflow');
    return;
  }

  console.log(`✅ Token created: ${mintAddress}\n`);

  // Step 2: Wait a moment for blockchain confirmation
  console.log('⏳ Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Choose your authority management strategy
  console.log('Step 2: Managing token authorities...');

  // Option A: Make token completely immutable (recommended for most tokens)
  await revokeBothAuthorities(mintAddress);

  // Option B: Keep freeze authority, revoke mint authority (fixed supply but can freeze accounts)
  // await revokeMintAuthorityOnly(mintAddress);

  // Option C: Keep mint authority, revoke freeze authority (can mint more but can't freeze)
  // await revokeFreezeAuthorityOnly(mintAddress);

  console.log('\n🎉 Token workflow completed successfully!');
  console.log(`🔗 View your token: https://explorer.solana.com/address/${mintAddress}?cluster=devnet`);
};

// Run the complete workflow
completeTokenWorkflow();
```

### 4. Batch Token Creation

```javascript
// Create multiple tokens with different authority configurations
const batchCreateTokens = async () => {
  const tokens = [
    {
      name: 'Immutable Token',
      metadataUrl: 'https://example.com/immutable-metadata.json',
      revokeMint: true,
      revokeFreeze: true
    },
    {
      name: 'Fixed Supply Token',
      metadataUrl: 'https://example.com/fixed-supply-metadata.json',
      revokeMint: true,
      revokeFreeze: false
    },
    {
      name: 'Mintable Token',
      metadataUrl: 'https://example.com/mintable-metadata.json',
      revokeMint: false,
      revokeFreeze: true
    }
  ];

  const results = [];

  for (const tokenConfig of tokens) {
    console.log(`\n🪙 Creating ${tokenConfig.name}...`);

    // Create token
    const response = await fetch('http://localhost:3000/create-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadataUrl: tokenConfig.metadataUrl })
    });

    const createResult = await response.json();

    if (!createResult.success) {
      console.log(`❌ Failed to create ${tokenConfig.name}`);
      continue;
    }

    const mintAddress = createResult.data.mintAddress;
    console.log(`✅ ${tokenConfig.name} created: ${mintAddress}`);

    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Revoke authorities based on configuration
    const revokeResponse = await fetch('http://localhost:3000/revoke-authorities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: tokenConfig.revokeMint,
        revokeFreezeAuthority: tokenConfig.revokeFreeze
      })
    });

    const revokeResult = await revokeResponse.json();

    if (revokeResult.success) {
      console.log(`🔑 ${tokenConfig.name} authorities configured successfully`);
      results.push({
        name: tokenConfig.name,
        mintAddress: mintAddress,
        revoked: revokeResult.data.revoked
      });
    }
  }

  console.log('\n📊 Batch creation summary:');
  results.forEach(token => {
    console.log(`- ${token.name}: ${token.mintAddress}`);
    console.log(`  Mint revoked: ${token.revoked.mintAuthority}, Freeze revoked: ${token.revoked.freezeAuthority}`);
  });

  return results;
};

// Usage
await batchCreateTokens();
```

## Error Handling

The API handles various error scenarios:

- **Invalid URL format**: Returns 400 with error message
- **Unreachable metadata URL**: Returns 400 with fetch error
- **Malformed JSON**: Returns 400 with parsing error
- **Missing required metadata fields**: Returns 400 with validation error
- **Wallet configuration issues**: Returns 500 with wallet error
- **Blockchain transaction failures**: Returns 500 with transaction error

## Development

Run the original token creation script:
```bash
npm run create-token
```

Build TypeScript:
```bash
npm run build
```

## Security

- Helmet.js for security headers
- Input validation for all requests
- URL format validation
- Metadata structure validation
- Error message sanitization

## License

ISC
