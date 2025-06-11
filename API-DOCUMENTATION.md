# Solana Token Creation API - Enhanced Documentation

## Overview

This API allows you to create Solana SPL tokens with rich metadata and provides flexible authority management, including selective authority revocation.

## Features

- ✅ **Token Creation**: Create SPL tokens with metadata from remote JSON files
- ✅ **Authority Control**: Full control over mint and freeze authorities
- ✅ **Selective Revocation**: Choose to revoke mint authority, freeze authority, or both
- ✅ **Immutable Tokens**: Make tokens truly immutable by revoking authorities
- ✅ **Rich Metadata**: Support for name, symbol, description, image, and social links

## Base URL

```
http://localhost:3001
```

## Endpoints

### 1. Health Check

**GET** `/health`

Returns the API status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Create Token

**POST** `/create-token`

Creates a new Solana token with metadata.

**Request Body:**
```json
{
  "metadataUrl": "https://example.com/metadata.json"
}
```

**Metadata JSON Structure:**
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

**POST** `/revoke-authorities`

Revokes token authorities with selective control.

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

## Usage Examples

### Example 1: Create a Token

```bash
curl -X POST http://localhost:3001/create-token \
  -H "Content-Type: application/json" \
  -d '{
    "metadataUrl": "https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json"
  }'
```

### Example 2: Revoke Only Mint Authority

```bash
curl -X POST http://localhost:3001/revoke-authorities \
  -H "Content-Type: application/json" \
  -d '{
    "mintAddress": "YOUR_MINT_ADDRESS",
    "revokeMintAuthority": true,
    "revokeFreezeAuthority": false
  }'
```

### Example 3: Revoke Only Freeze Authority

```bash
curl -X POST http://localhost:3001/revoke-authorities \
  -H "Content-Type: application/json" \
  -d '{
    "mintAddress": "YOUR_MINT_ADDRESS",
    "revokeMintAuthority": false,
    "revokeFreezeAuthority": true
  }'
```

### Example 4: Revoke Both Authorities (Default)

```bash
curl -X POST http://localhost:3001/revoke-authorities \
  -H "Content-Type: application/json" \
  -d '{
    "mintAddress": "YOUR_MINT_ADDRESS"
  }'
```

## JavaScript Examples

### Create Token and Selectively Revoke

```javascript
// Create token
const createResponse = await fetch('http://localhost:3001/create-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metadataUrl: 'https://example.com/metadata.json'
  })
});

const createResult = await createResponse.json();
const mintAddress = createResult.data.mintAddress;

// Revoke only mint authority (keep freeze authority)
const revokeResponse = await fetch('http://localhost:3001/revoke-authorities', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mintAddress: mintAddress,
    revokeMintAuthority: true,
    revokeFreezeAuthority: false
  })
});

const revokeResult = await revokeResponse.json();
console.log('Revoked:', revokeResult.data.revoked);
// Output: { mintAuthority: true, freezeAuthority: false }
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details (development only)"
}
```

Common error codes:
- `400`: Bad Request (invalid parameters, malformed JSON, etc.)
- `500`: Internal Server Error (blockchain errors, network issues, etc.)

## Authority Management

### Understanding Token Authorities

- **Mint Authority**: Controls the ability to mint new tokens
- **Freeze Authority**: Controls the ability to freeze/unfreeze token accounts

### Selective Revocation Use Cases

1. **Revoke Mint Only**: Create a token with fixed supply but keep ability to freeze accounts
2. **Revoke Freeze Only**: Allow minting but remove freeze capabilities
3. **Revoke Both**: Create a completely immutable token (recommended for most use cases)

### Default Behavior

If you don't specify `revokeMintAuthority` or `revokeFreezeAuthority`, both default to `true`, maintaining backward compatibility.

## Testing

Run the test scripts to verify functionality:

```bash
# Test basic token creation
node test-api.js

# Test selective authority revocation
node test-selective-revocation.js
```

## Notes

- All tokens are created on Solana Devnet
- The API uses your wallet file for signing transactions
- Tokens are created with 9 decimal places
- Metadata is stored on-chain using the Metaplex Token Metadata standard
