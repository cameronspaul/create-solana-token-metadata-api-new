#!/usr/bin/env node

/**
 * Batch Token Creation Script
 * Creates multiple tokens with different configurations
 */

import fetch from 'node-fetch';

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
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.magenta}\n=== ${msg} ===${colors.reset}`),
  step: (msg) => console.log(`${colors.bold}${colors.cyan}📋 ${msg}${colors.reset}`)
};

// Token configurations for batch creation
const TOKEN_CONFIGS = [
  {
    name: 'Immutable Token',
    description: 'Token with both authorities revoked (completely immutable)',
    metadataUrl: 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json',
    revokeMintAuthority: true,
    revokeFreezeAuthority: true
  },
  {
    name: 'Fixed Supply Token',
    description: 'Token with mint authority revoked but freeze authority kept',
    metadataUrl: 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json',
    revokeMintAuthority: true,
    revokeFreezeAuthority: false
  },
  {
    name: 'Mintable Token',
    description: 'Token with freeze authority revoked but mint authority kept',
    metadataUrl: 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json',
    revokeMintAuthority: false,
    revokeFreezeAuthority: true
  },
  {
    name: 'Full Authority Token',
    description: 'Token with both authorities kept (for testing purposes)',
    metadataUrl: 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json',
    revokeMintAuthority: false,
    revokeFreezeAuthority: false
  }
];

/**
 * Create a single token
 */
async function createToken(config) {
  try {
    log.step(`Creating ${config.name}...`);
    log.info(config.description);
    
    const response = await fetch(`${API_BASE_URL}/create-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataUrl: config.metadataUrl
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success(`Token created: ${data.data.mintAddress}`);
      log.info(`Explorer: ${data.data.explorerUrl}`);
      return {
        success: true,
        mintAddress: data.data.mintAddress,
        explorerUrl: data.data.explorerUrl,
        transactionSignature: data.data.transactionSignature
      };
    } else {
      log.error(`Failed to create ${config.name}`);
      console.log('Error:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    log.error(`Failed to create ${config.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Revoke authorities for a token
 */
async function revokeAuthorities(mintAddress, config) {
  try {
    log.step(`Managing authorities for ${config.name}...`);
    
    // If both authorities should be kept, skip revocation
    if (!config.revokeMintAuthority && !config.revokeFreezeAuthority) {
      log.info('Keeping both authorities - skipping revocation');
      return { success: true, skipped: true };
    }
    
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: config.revokeMintAuthority,
        revokeFreezeAuthority: config.revokeFreezeAuthority
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Authority management completed!');
      log.info(`Mint Authority Revoked: ${data.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data.data.revoked.freezeAuthority}`);
      return {
        success: true,
        revoked: data.data.revoked,
        signatures: data.data.signatures
      };
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    log.error(`Authority revocation failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Create tokens in batch with different configurations
 */
async function batchCreateTokens() {
  log.header('Batch Token Creation');
  log.info(`Creating ${TOKEN_CONFIGS.length} tokens with different authority configurations`);
  
  // Check if API is available
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (!healthResponse.ok) {
      throw new Error('API not available');
    }
    log.success('API server is running');
  } catch (error) {
    log.error('API server is not available. Please start the server first.');
    log.info('Run: npm run dev');
    return;
  }
  
  const results = [];
  
  for (let i = 0; i < TOKEN_CONFIGS.length; i++) {
    const config = TOKEN_CONFIGS[i];
    
    console.log(`\n${colors.bold}${colors.cyan}--- Token ${i + 1}/${TOKEN_CONFIGS.length} ---${colors.reset}`);
    
    // Create token
    const createResult = await createToken(config);
    
    if (!createResult.success) {
      results.push({
        config,
        createResult,
        revokeResult: null
      });
      continue;
    }
    
    // Wait for blockchain confirmation
    log.info('Waiting for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Manage authorities
    const revokeResult = await revokeAuthorities(createResult.mintAddress, config);
    
    results.push({
      config,
      createResult,
      revokeResult
    });
    
    // Add delay between tokens
    if (i < TOKEN_CONFIGS.length - 1) {
      log.info('Waiting before creating next token...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  log.header('Batch Creation Summary');
  
  const successful = results.filter(r => r.createResult.success);
  const failed = results.filter(r => !r.createResult.success);
  
  log.info(`Successfully created: ${successful.length}/${results.length} tokens`);
  
  if (successful.length > 0) {
    console.log('\n📋 Created Tokens:');
    successful.forEach((result, index) => {
      console.log(`\n${colors.bold}${index + 1}. ${result.config.name}${colors.reset}`);
      console.log(`   Mint Address: ${result.createResult.mintAddress}`);
      console.log(`   Description: ${result.config.description}`);
      console.log(`   Explorer: ${result.createResult.explorerUrl}`);
      
      if (result.revokeResult && !result.revokeResult.skipped) {
        console.log(`   Mint Authority Revoked: ${result.revokeResult.revoked?.mintAuthority || false}`);
        console.log(`   Freeze Authority Revoked: ${result.revokeResult.revoked?.freezeAuthority || false}`);
      } else if (result.revokeResult?.skipped) {
        console.log(`   Authorities: Both kept (no revocation)`);
      }
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n${colors.red}❌ Failed Tokens:${colors.reset}`);
    failed.forEach((result, index) => {
      console.log(`${index + 1}. ${result.config.name}: ${result.createResult.error}`);
    });
  }
  
  // Export results to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `batch-creation-results-${timestamp}.json`;
  
  try {
    const fs = await import('fs');
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    log.success(`Results exported to: ${filename}`);
  } catch (error) {
    log.warning(`Could not export results: ${error.message}`);
  }
  
  return results;
}

/**
 * Create tokens with custom configurations
 */
async function createCustomBatch(customConfigs) {
  log.header('Custom Batch Token Creation');
  
  if (!Array.isArray(customConfigs) || customConfigs.length === 0) {
    log.error('Invalid custom configurations provided');
    return;
  }
  
  log.info(`Creating ${customConfigs.length} custom tokens`);
  
  const results = [];
  
  for (let i = 0; i < customConfigs.length; i++) {
    const config = customConfigs[i];
    
    console.log(`\n${colors.bold}${colors.cyan}--- Custom Token ${i + 1}/${customConfigs.length} ---${colors.reset}`);
    
    const createResult = await createToken(config);
    
    if (createResult.success) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const revokeResult = await revokeAuthorities(createResult.mintAddress, config);
      results.push({ config, createResult, revokeResult });
    } else {
      results.push({ config, createResult, revokeResult: null });
    }
    
    if (i < customConfigs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Run batch creation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  batchCreateTokens().catch(error => {
    log.error(`Batch creation failed: ${error.message}`);
    process.exit(1);
  });
}

export { batchCreateTokens, createCustomBatch, TOKEN_CONFIGS };
