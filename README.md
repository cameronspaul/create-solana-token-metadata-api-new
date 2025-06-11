# Solana Token Creation API

A REST API for creating Solana tokens using remote JSON metadata files. This API fetches token metadata from hosted JSON files and creates tokens on the Solana blockchain.

## Features

- ✅ Create Solana tokens from remote JSON metadata
- ✅ Input validation for URLs and metadata structure
- ✅ Error handling for network failures and malformed data
- ✅ Uses existing wallet files (no new wallet creation)
- ✅ Returns mint address and transaction signatures
- ✅ Built with Express.js and TypeScript
- ✅ Security headers with Helmet
- ✅ CORS enabled
- ✅ Request logging with Morgan

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

### API Endpoints

#### Health Check
```
GET /health
```

Returns the API status and timestamp.

**Response:**
```json
{
  "success": true,
  "message": "Solana Token Creation API is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Create Token
```
POST /create-token
```

Creates a new Solana token using metadata from a remote JSON file.

**Request Body:**
```json
{
  "metadataUrl": "https://example.com/metadata.json",
  "walletPath": "./path/to/wallet.json" // Optional, defaults to existing wallet
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

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "mintAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "transactionSignature": "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBDLforKn6nL1",
    "explorerUrl": "https://explorer.solana.com/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBDLforKn6nL1?cluster=devnet",
    "tokenExplorerUrl": "https://explorer.solana.com/address/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU?cluster=devnet"
  },
  "message": "Token created successfully"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Error description"
}
```

### Example Usage

Using curl:
```bash
curl -X POST http://localhost:3000/create-token \
  -H "Content-Type: application/json" \
  -d '{
    "metadataUrl": "https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json"
  }'
```

Using JavaScript fetch:
```javascript
const response = await fetch('http://localhost:3000/create-token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    metadataUrl: 'https://example.com/metadata.json'
  })
});

const result = await response.json();
console.log(result);
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
