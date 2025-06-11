#!/usr/bin/env node

/**
 * Example Scripts for Solana Token Creation API
 * Simple examples showing how to use the API
 */

import {
  createToken,
  revokeAuthorities,
  createImmutableToken,
  createFixedSupplyToken,
  createMintableToken,
  checkApiHealth,
  PRESETS
} from './api-utils.js';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.magenta}\n=== ${msg} ===${colors.reset}`)
};

// Example metadata URL
const EXAMPLE_METADATA_URL = 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json';

/**
 * Example 1: Basic token creation
 */
async function example1_BasicTokenCreation() {
  log.header('Example 1: Basic Token Creation');
  
  const result = await createToken(EXAMPLE_METADATA_URL);
  
  if (result.success) {
    log.success('Token created successfully!');
    console.log(`Mint Address: ${result.mintAddress}`);
    console.log(`Explorer: ${result.explorerUrl}`);
    return result.mintAddress;
  } else {
    log.error('Token creation failed');
    console.log('Error:', result.error);
    return null;
  }
}

/**
 * Example 2: Create token and revoke authorities separately
 */
async function example2_CreateAndRevokeSeparately() {
  log.header('Example 2: Create Token + Revoke Authorities (Separate Steps)');
  
  // Step 1: Create token
  log.info('Step 1: Creating token...');
  const createResult = await createToken(EXAMPLE_METADATA_URL);
  
  if (!createResult.success) {
    log.error('Token creation failed');
    return;
  }
  
  const mintAddress = createResult.mintAddress;
  log.success(`Token created: ${mintAddress}`);
  
  // Step 2: Wait for confirmation
  log.info('Step 2: Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 3: Revoke authorities
  log.info('Step 3: Revoking authorities...');
  const revokeResult = await revokeAuthorities(mintAddress, {
    revokeMintAuthority: true,
    revokeFreezeAuthority: true
  });
  
  if (revokeResult.success) {
    log.success('Authorities revoked successfully!');
    console.log(`Mint Authority Revoked: ${revokeResult.revoked.mintAuthority}`);
    console.log(`Freeze Authority Revoked: ${revokeResult.revoked.freezeAuthority}`);
  } else {
    log.error('Authority revocation failed');
    console.log('Error:', revokeResult.error);
  }
}

/**
 * Example 3: Create immutable token (one operation)
 */
async function example3_CreateImmutableToken() {
  log.header('Example 3: Create Immutable Token (One Operation)');
  
  const result = await createImmutableToken(EXAMPLE_METADATA_URL);
  
  if (result.success) {
    log.success('Immutable token created successfully!');
    console.log(`Mint Address: ${result.mintAddress}`);
    console.log(`Explorer: ${result.explorerUrl}`);
    console.log(`Mint Authority Revoked: ${result.revoked.mintAuthority}`);
    console.log(`Freeze Authority Revoked: ${result.revoked.freezeAuthority}`);
  } else {
    log.error(`Failed at ${result.step} step`);
    console.log('Error:', result.error);
  }
}

/**
 * Example 4: Create fixed supply token
 */
async function example4_CreateFixedSupplyToken() {
  log.header('Example 4: Create Fixed Supply Token');
  log.info('This token has a fixed supply but can still freeze accounts');
  
  const result = await createFixedSupplyToken(EXAMPLE_METADATA_URL);
  
  if (result.success) {
    log.success('Fixed supply token created successfully!');
    console.log(`Mint Address: ${result.mintAddress}`);
    console.log(`Explorer: ${result.explorerUrl}`);
    console.log(`Mint Authority Revoked: ${result.revoked.mintAuthority}`);
    console.log(`Freeze Authority Revoked: ${result.revoked.freezeAuthority}`);
  } else {
    log.error(`Failed at ${result.step} step`);
    console.log('Error:', result.error);
  }
}

/**
 * Example 5: Create mintable token
 */
async function example5_CreateMintableToken() {
  log.header('Example 5: Create Mintable Token');
  log.info('This token can mint more supply but cannot freeze accounts');
  
  const result = await createMintableToken(EXAMPLE_METADATA_URL);
  
  if (result.success) {
    log.success('Mintable token created successfully!');
    console.log(`Mint Address: ${result.mintAddress}`);
    console.log(`Explorer: ${result.explorerUrl}`);
    console.log(`Mint Authority Revoked: ${result.revoked.mintAuthority}`);
    console.log(`Freeze Authority Revoked: ${result.revoked.freezeAuthority}`);
  } else {
    log.error(`Failed at ${result.step} step`);
    console.log('Error:', result.error);
  }
}

/**
 * Example 6: Selective authority revocation
 */
async function example6_SelectiveRevocation() {
  log.header('Example 6: Selective Authority Revocation');
  
  // Create a token first
  log.info('Creating token for selective revocation demo...');
  const createResult = await createToken(EXAMPLE_METADATA_URL);
  
  if (!createResult.success) {
    log.error('Token creation failed');
    return;
  }
  
  const mintAddress = createResult.mintAddress;
  log.success(`Token created: ${mintAddress}`);
  
  // Wait for confirmation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Revoke only mint authority
  log.info('Revoking only mint authority (keeping freeze authority)...');
  const revokeResult = await revokeAuthorities(mintAddress, {
    revokeMintAuthority: true,
    revokeFreezeAuthority: false
  });
  
  if (revokeResult.success) {
    log.success('Selective revocation completed!');
    console.log(`Mint Authority Revoked: ${revokeResult.revoked.mintAuthority}`);
    console.log(`Freeze Authority Revoked: ${revokeResult.revoked.freezeAuthority}`);
    log.info('This token now has a fixed supply but can still freeze accounts');
  } else {
    log.error('Selective revocation failed');
    console.log('Error:', revokeResult.error);
  }
}

/**
 * Example 7: Error handling
 */
async function example7_ErrorHandling() {
  log.header('Example 7: Error Handling');
  
  // Try to create token with invalid URL
  log.info('Attempting to create token with invalid metadata URL...');
  const result = await createToken('invalid-url', { verbose: false });
  
  if (!result.success) {
    log.success('Error handling works correctly!');
    console.log(`Error caught: ${result.error}`);
  } else {
    log.warning('Expected an error but token creation succeeded');
  }
  
  // Try to revoke authorities for non-existent token
  log.info('Attempting to revoke authorities for non-existent token...');
  const revokeResult = await revokeAuthorities('InvalidMintAddress123', {
    verbose: false
  });
  
  if (!revokeResult.success) {
    log.success('Error handling works correctly!');
    console.log(`Error caught: ${revokeResult.error}`);
  } else {
    log.warning('Expected an error but authority revocation succeeded');
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log(`${colors.bold}${colors.magenta}🚀 Solana Token Creation API - Examples${colors.reset}\n`);
  
  // Check if API is available
  const isHealthy = await checkApiHealth();
  if (!isHealthy) {
    log.error('API server is not available. Please start the server first.');
    log.info('Run: npm run dev');
    return;
  }
  
  log.success('API server is available. Running examples...\n');
  
  const examples = [
    { name: 'Basic Token Creation', fn: example1_BasicTokenCreation },
    { name: 'Create and Revoke Separately', fn: example2_CreateAndRevokeSeparately },
    { name: 'Create Immutable Token', fn: example3_CreateImmutableToken },
    { name: 'Create Fixed Supply Token', fn: example4_CreateFixedSupplyToken },
    { name: 'Create Mintable Token', fn: example5_CreateMintableToken },
    { name: 'Selective Revocation', fn: example6_SelectiveRevocation },
    { name: 'Error Handling', fn: example7_ErrorHandling }
  ];
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    
    try {
      await example.fn();
    } catch (error) {
      log.error(`Example "${example.name}" failed: ${error.message}`);
    }
    
    // Add delay between examples
    if (i < examples.length - 1) {
      log.info('Waiting before next example...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  log.header('All Examples Completed');
  log.success('Check the output above to see the results of each example');
}

/**
 * Run a specific example
 */
async function runSpecificExample(exampleNumber) {
  const examples = [
    example1_BasicTokenCreation,
    example2_CreateAndRevokeSeparately,
    example3_CreateImmutableToken,
    example4_CreateFixedSupplyToken,
    example5_CreateMintableToken,
    example6_SelectiveRevocation,
    example7_ErrorHandling
  ];
  
  if (exampleNumber < 1 || exampleNumber > examples.length) {
    log.error(`Invalid example number. Choose 1-${examples.length}`);
    return;
  }
  
  const isHealthy = await checkApiHealth();
  if (!isHealthy) {
    log.error('API server is not available. Please start the server first.');
    log.info('Run: npm run dev');
    return;
  }
  
  try {
    await examples[exampleNumber - 1]();
  } catch (error) {
    log.error(`Example failed: ${error.message}`);
  }
}

// Command line interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runAllExamples().catch(error => {
      log.error(`Examples failed: ${error.message}`);
      process.exit(1);
    });
  } else {
    const exampleNumber = parseInt(args[0]);
    if (isNaN(exampleNumber)) {
      console.log('Usage: node examples.js [example_number]');
      console.log('Examples:');
      console.log('  1. Basic Token Creation');
      console.log('  2. Create and Revoke Separately');
      console.log('  3. Create Immutable Token');
      console.log('  4. Create Fixed Supply Token');
      console.log('  5. Create Mintable Token');
      console.log('  6. Selective Revocation');
      console.log('  7. Error Handling');
      process.exit(1);
    }
    
    runSpecificExample(exampleNumber).catch(error => {
      log.error(`Example failed: ${error.message}`);
      process.exit(1);
    });
  }
}

export {
  example1_BasicTokenCreation,
  example2_CreateAndRevokeSeparately,
  example3_CreateImmutableToken,
  example4_CreateFixedSupplyToken,
  example5_CreateMintableToken,
  example6_SelectiveRevocation,
  example7_ErrorHandling,
  runAllExamples
};
