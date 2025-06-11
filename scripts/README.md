# Solana Token Creation API Scripts

This directory contains various scripts to interact with the Solana Token Creation API. These scripts provide different ways to test, use, and demonstrate the API functionality.

## 📋 Available Scripts

### 1. 🧪 Test Scripts

#### `test-api.js`
Basic API functionality tests including health check, token creation, authority revocation, and error handling.

```bash
# Run basic API tests
npm run test-api
# or
node scripts/test-api.js
```

#### `test-selective-revocation.js`
Comprehensive tests for selective authority revocation scenarios.

```bash
# Run selective revocation tests
npm run test-revocation
# or
node scripts/test-selective-revocation.js
```

#### Run All Tests
```bash
# Run all test suites
npm run test-all
```

### 2. 🚀 Batch Operations

#### `batch-create-tokens.js`
Creates multiple tokens with different authority configurations in batch.

```bash
# Run batch token creation
npm run batch-create
# or
node scripts/batch-create-tokens.js
```

**Creates 4 different token types:**
- **Immutable Token**: Both authorities revoked (completely immutable)
- **Fixed Supply Token**: Mint authority revoked, freeze authority kept
- **Mintable Token**: Freeze authority revoked, mint authority kept  
- **Full Authority Token**: Both authorities kept (for testing)

### 3. 🖥️ Interactive CLI

#### `interactive-cli.js`
User-friendly command-line interface for all API operations.

```bash
# Start interactive CLI
npm run cli
# or
node scripts/interactive-cli.js
```

**Features:**
- Health check
- Create tokens
- Revoke authorities
- Create token + revoke in one flow
- Batch creation
- Run tests
- Easy-to-use menu system

### 4. 📚 Examples

#### `examples.js`
Practical examples showing different ways to use the API.

```bash
# Run all examples
npm run examples
# or
node scripts/examples.js

# Run specific example
node scripts/examples.js 1  # Basic token creation
node scripts/examples.js 2  # Create and revoke separately
node scripts/examples.js 3  # Create immutable token
# ... etc
```

**Available Examples:**
1. Basic Token Creation
2. Create and Revoke Separately  
3. Create Immutable Token
4. Create Fixed Supply Token
5. Create Mintable Token
6. Selective Revocation
7. Error Handling

### 5. 🛠️ Utility Functions

#### `api-utils.js`
Reusable utility functions for API operations. Import these in your own scripts.

```javascript
import {
  createToken,
  revokeAuthorities,
  createImmutableToken,
  createFixedSupplyToken,
  createMintableToken,
  batchCreateTokens,
  checkApiHealth
} from './scripts/api-utils.js';

// Create an immutable token
const result = await createImmutableToken('https://example.com/metadata.json');
```

## 🚀 Quick Start

1. **Start the API server:**
   ```bash
   npm run dev
   ```

2. **Run basic tests to verify everything works:**
   ```bash
   npm run test-api
   ```

3. **Try the interactive CLI for easy usage:**
   ```bash
   npm run cli
   ```

4. **Or run examples to see different use cases:**
   ```bash
   npm run examples
   ```

## 📖 Usage Patterns

### Creating Different Token Types

```javascript
import { createImmutableToken, createFixedSupplyToken, createMintableToken } from './scripts/api-utils.js';

const metadataUrl = 'https://example.com/metadata.json';

// Completely immutable token (recommended for most use cases)
const immutable = await createImmutableToken(metadataUrl);

// Fixed supply but can freeze accounts
const fixedSupply = await createFixedSupplyToken(metadataUrl);

// Can mint more but cannot freeze accounts
const mintable = await createMintableToken(metadataUrl);
```

### Batch Operations

```javascript
import { batchCreateTokens } from './scripts/api-utils.js';

const configs = [
  {
    name: 'My Token 1',
    metadataUrl: 'https://example.com/token1.json',
    revokeMintAuthority: true,
    revokeFreezeAuthority: true
  },
  {
    name: 'My Token 2', 
    metadataUrl: 'https://example.com/token2.json',
    revokeMintAuthority: true,
    revokeFreezeAuthority: false
  }
];

const results = await batchCreateTokens(configs);
```

### Error Handling

```javascript
import { createToken } from './scripts/api-utils.js';

const result = await createToken('https://example.com/metadata.json');

if (result.success) {
  console.log('Token created:', result.mintAddress);
  console.log('Explorer:', result.explorerUrl);
} else {
  console.error('Failed:', result.error);
}
```

## 🔧 Configuration

All scripts use the following default configuration:
- **API Base URL**: `http://localhost:3001`
- **Blockchain**: Solana Devnet
- **Wait Time**: 3 seconds between token creation and authority revocation
- **Batch Delay**: 2 seconds between batch operations

## 📝 Output Files

Some scripts generate output files:
- `batch-create-tokens.js` creates `batch-creation-results-[timestamp].json`
- Results include mint addresses, transaction signatures, and explorer URLs

## 🛡️ Error Handling

All scripts include comprehensive error handling:
- API server availability checks
- Invalid parameter validation
- Blockchain transaction error handling
- Network connectivity issues
- Detailed error messages and suggestions

## 💡 Tips

1. **Always start the API server first** (`npm run dev`)
2. **Use the interactive CLI** for one-off operations
3. **Use batch scripts** for creating multiple tokens
4. **Check the examples** to understand different patterns
5. **Import utility functions** for custom scripts
6. **Wait for blockchain confirmation** between operations (scripts handle this automatically)

## 🔗 Related Files

- `../API-DOCUMENTATION.md` - Complete API documentation
- `../src/api-server.ts` - API server implementation
- `../src/create-token.ts` - Core token creation logic
- `../package.json` - NPM scripts configuration
