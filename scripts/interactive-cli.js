#!/usr/bin/env node

/**
 * Interactive CLI for Solana Token Creation API
 * User-friendly interface for API operations
 */

import fetch from 'node-fetch';
import { createInterface } from 'readline';

const API_BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}\n=== ${msg} ===${colors.reset}`),
  menu: (msg) => console.log(`${colors.bold}${colors.magenta}${msg}${colors.reset}`),
  dim: (msg) => console.log(`${colors.dim}${msg}${colors.reset}`)
};

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

/**
 * Display main menu
 */
function displayMainMenu() {
  log.header('Solana Token Creation API - Interactive CLI');
  log.menu('\n📋 Available Operations:');
  console.log('1. 🏥 Health Check');
  console.log('2. 🪙 Create Token');
  console.log('3. 🔒 Revoke Authorities');
  console.log('4. 🚀 Create Token + Revoke Authorities');
  console.log('5. 📊 Batch Create Tokens');
  console.log('6. 🧪 Run Tests');
  console.log('7. ❌ Exit');
  console.log('');
}

/**
 * Health check
 */
async function healthCheck() {
  log.header('Health Check');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      log.success('API server is healthy!');
      log.info(`Server timestamp: ${data.timestamp}`);
    } else {
      log.error('API server returned an error');
      console.log('Response:', data);
    }
  } catch (error) {
    log.error(`Cannot connect to API server: ${error.message}`);
    log.warning('Make sure the server is running on port 3001');
    log.info('Run: npm run dev');
  }
}

/**
 * Create token
 */
async function createToken() {
  log.header('Create Token');
  
  const metadataUrl = await prompt('Enter metadata URL: ');
  
  if (!metadataUrl.trim()) {
    log.error('Metadata URL is required');
    return;
  }
  
  try {
    log.info('Creating token...');
    
    const response = await fetch(`${API_BASE_URL}/create-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataUrl: metadataUrl.trim()
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Token created successfully!');
      console.log(`\n📋 Token Details:`);
      console.log(`   Mint Address: ${colors.bold}${data.data.mintAddress}${colors.reset}`);
      console.log(`   Transaction: ${data.data.transactionSignature}`);
      console.log(`   Explorer: ${colors.blue}${data.data.explorerUrl}${colors.reset}`);
      
      return data.data.mintAddress;
    } else {
      log.error('Token creation failed');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (error) {
    log.error(`Token creation failed: ${error.message}`);
  }
  
  return null;
}

/**
 * Revoke authorities
 */
async function revokeAuthorities(mintAddress = null) {
  log.header('Revoke Authorities');
  
  if (!mintAddress) {
    mintAddress = await prompt('Enter mint address: ');
    
    if (!mintAddress.trim()) {
      log.error('Mint address is required');
      return;
    }
    mintAddress = mintAddress.trim();
  }
  
  console.log('\n🔒 Authority Revocation Options:');
  console.log('1. Revoke both authorities (make token immutable) - Recommended');
  console.log('2. Revoke only mint authority (fixed supply, can freeze)');
  console.log('3. Revoke only freeze authority (can mint, cannot freeze)');
  console.log('4. Custom selection');
  
  const choice = await prompt('\nSelect option (1-4): ');
  
  let revokeMintAuthority, revokeFreezeAuthority;
  
  switch (choice.trim()) {
    case '1':
      revokeMintAuthority = true;
      revokeFreezeAuthority = true;
      log.info('Will revoke both authorities (make token immutable)');
      break;
    case '2':
      revokeMintAuthority = true;
      revokeFreezeAuthority = false;
      log.info('Will revoke only mint authority (fixed supply)');
      break;
    case '3':
      revokeMintAuthority = false;
      revokeFreezeAuthority = true;
      log.info('Will revoke only freeze authority (mintable)');
      break;
    case '4':
      const mintChoice = await prompt('Revoke mint authority? (y/n): ');
      const freezeChoice = await prompt('Revoke freeze authority? (y/n): ');
      revokeMintAuthority = mintChoice.toLowerCase().startsWith('y');
      revokeFreezeAuthority = freezeChoice.toLowerCase().startsWith('y');
      log.info(`Will revoke mint: ${revokeMintAuthority}, freeze: ${revokeFreezeAuthority}`);
      break;
    default:
      log.error('Invalid choice');
      return;
  }
  
  try {
    log.info('Revoking authorities...');
    
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: revokeMintAuthority,
        revokeFreezeAuthority: revokeFreezeAuthority
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Authorities revoked successfully!');
      console.log(`\n📋 Revocation Results:`);
      console.log(`   Mint Authority Revoked: ${colors.bold}${data.data.revoked.mintAuthority}${colors.reset}`);
      console.log(`   Freeze Authority Revoked: ${colors.bold}${data.data.revoked.freezeAuthority}${colors.reset}`);
      console.log(`   Transaction Signatures: ${data.data.signatures.join(', ')}`);
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
    }
  } catch (error) {
    log.error(`Authority revocation failed: ${error.message}`);
  }
}

/**
 * Create token and revoke authorities in one flow
 */
async function createTokenAndRevoke() {
  log.header('Create Token + Revoke Authorities');
  
  const mintAddress = await createToken();
  
  if (mintAddress) {
    log.info('Waiting for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const proceed = await prompt('\nProceed with authority revocation? (y/n): ');
    if (proceed.toLowerCase().startsWith('y')) {
      await revokeAuthorities(mintAddress);
    }
  }
}

/**
 * Batch create tokens
 */
async function batchCreateTokens() {
  log.header('Batch Create Tokens');
  
  console.log('📋 Batch Creation Options:');
  console.log('1. Use predefined configurations (4 different token types)');
  console.log('2. Create custom batch');
  
  const choice = await prompt('Select option (1-2): ');
  
  if (choice.trim() === '1') {
    log.info('Starting batch creation with predefined configurations...');
    
    try {
      const { batchCreateTokens } = await import('./batch-create-tokens.js');
      await batchCreateTokens();
    } catch (error) {
      log.error(`Batch creation failed: ${error.message}`);
    }
  } else if (choice.trim() === '2') {
    log.info('Custom batch creation not implemented in interactive mode');
    log.info('Use the batch-create-tokens.js script directly for custom configurations');
  } else {
    log.error('Invalid choice');
  }
}

/**
 * Run tests
 */
async function runTests() {
  log.header('Run Tests');
  
  console.log('🧪 Available Test Suites:');
  console.log('1. Basic API tests');
  console.log('2. Selective authority revocation tests');
  console.log('3. All tests');
  
  const choice = await prompt('Select test suite (1-3): ');
  
  try {
    switch (choice.trim()) {
      case '1':
        log.info('Running basic API tests...');
        const { runTests: runBasicTests } = await import('./test-api.js');
        await runBasicTests();
        break;
      case '2':
        log.info('Running selective revocation tests...');
        const { runSelectiveRevocationTests } = await import('./test-selective-revocation.js');
        await runSelectiveRevocationTests();
        break;
      case '3':
        log.info('Running all tests...');
        const { runTests: runAllTests } = await import('./test-api.js');
        const { runSelectiveRevocationTests: runSelectiveTests } = await import('./test-selective-revocation.js');
        
        console.log('\n🧪 Running Basic API Tests...');
        await runAllTests();
        
        console.log('\n🧪 Running Selective Revocation Tests...');
        await runSelectiveTests();
        break;
      default:
        log.error('Invalid choice');
    }
  } catch (error) {
    log.error(`Test execution failed: ${error.message}`);
  }
}

/**
 * Main CLI loop
 */
async function main() {
  console.clear();
  
  while (true) {
    displayMainMenu();
    
    const choice = await prompt('Select an option (1-7): ');
    
    switch (choice.trim()) {
      case '1':
        await healthCheck();
        break;
      case '2':
        await createToken();
        break;
      case '3':
        await revokeAuthorities();
        break;
      case '4':
        await createTokenAndRevoke();
        break;
      case '5':
        await batchCreateTokens();
        break;
      case '6':
        await runTests();
        break;
      case '7':
        log.info('Goodbye! 👋');
        rl.close();
        process.exit(0);
        break;
      default:
        log.error('Invalid choice. Please select 1-7.');
    }
    
    // Wait for user to continue
    await prompt('\nPress Enter to continue...');
    console.clear();
  }
}

// Start the CLI if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    log.error(`CLI failed: ${error.message}`);
    rl.close();
    process.exit(1);
  });
}

export { main };
