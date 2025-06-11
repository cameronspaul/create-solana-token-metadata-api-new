#!/usr/bin/env node

/**
 * API Utility Functions
 * Helper functions for common API operations
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

/**
 * Check if API server is available
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return response.ok && data.status === 'OK';
  } catch (error) {
    return false;
  }
}

/**
 * Create a token with metadata
 */
export async function createToken(metadataUrl, options = {}) {
  const { verbose = true } = options;
  
  try {
    if (verbose) {
      log.info(`Creating token with metadata: ${metadataUrl}`);
    }
    
    const response = await fetch(`${API_BASE_URL}/create-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataUrl: metadataUrl
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      if (verbose) {
        log.success(`Token created: ${data.data.mintAddress}`);
      }
      return {
        success: true,
        mintAddress: data.data.mintAddress,
        transactionSignature: data.data.transactionSignature,
        explorerUrl: data.data.explorerUrl
      };
    } else {
      if (verbose) {
        log.error('Token creation failed');
        console.log('Error:', data.error);
      }
      return {
        success: false,
        error: data.error,
        details: data.details
      };
    }
  } catch (error) {
    if (verbose) {
      log.error(`Token creation failed: ${error.message}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Revoke token authorities
 */
export async function revokeAuthorities(mintAddress, options = {}) {
  const {
    revokeMintAuthority = true,
    revokeFreezeAuthority = true,
    verbose = true
  } = options;
  
  try {
    if (verbose) {
      log.info(`Revoking authorities for: ${mintAddress}`);
      log.info(`Mint: ${revokeMintAuthority}, Freeze: ${revokeFreezeAuthority}`);
    }
    
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
      if (verbose) {
        log.success('Authorities revoked successfully');
        log.info(`Mint revoked: ${data.data.revoked.mintAuthority}`);
        log.info(`Freeze revoked: ${data.data.revoked.freezeAuthority}`);
      }
      return {
        success: true,
        revoked: data.data.revoked,
        signatures: data.data.signatures,
        message: data.data.message
      };
    } else {
      if (verbose) {
        log.error('Authority revocation failed');
        console.log('Error:', data.error);
      }
      return {
        success: false,
        error: data.error,
        details: data.details
      };
    }
  } catch (error) {
    if (verbose) {
      log.error(`Authority revocation failed: ${error.message}`);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create token and revoke authorities in one operation
 */
export async function createTokenAndRevokeAuthorities(metadataUrl, options = {}) {
  const {
    revokeMintAuthority = true,
    revokeFreezeAuthority = true,
    verbose = true,
    waitTime = 3000
  } = options;
  
  // Step 1: Create token
  const createResult = await createToken(metadataUrl, { verbose });
  
  if (!createResult.success) {
    return {
      success: false,
      step: 'create',
      error: createResult.error,
      details: createResult.details
    };
  }
  
  // Step 2: Wait for blockchain confirmation
  if (verbose) {
    log.info(`Waiting ${waitTime}ms for blockchain confirmation...`);
  }
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  // Step 3: Revoke authorities
  const revokeResult = await revokeAuthorities(createResult.mintAddress, {
    revokeMintAuthority,
    revokeFreezeAuthority,
    verbose
  });
  
  if (!revokeResult.success) {
    return {
      success: false,
      step: 'revoke',
      mintAddress: createResult.mintAddress,
      explorerUrl: createResult.explorerUrl,
      error: revokeResult.error,
      details: revokeResult.details
    };
  }
  
  return {
    success: true,
    mintAddress: createResult.mintAddress,
    explorerUrl: createResult.explorerUrl,
    transactionSignature: createResult.transactionSignature,
    revoked: revokeResult.revoked,
    revokeSignatures: revokeResult.signatures
  };
}

/**
 * Create an immutable token (both authorities revoked)
 */
export async function createImmutableToken(metadataUrl, options = {}) {
  return createTokenAndRevokeAuthorities(metadataUrl, {
    ...options,
    revokeMintAuthority: true,
    revokeFreezeAuthority: true
  });
}

/**
 * Create a fixed supply token (only mint authority revoked)
 */
export async function createFixedSupplyToken(metadataUrl, options = {}) {
  return createTokenAndRevokeAuthorities(metadataUrl, {
    ...options,
    revokeMintAuthority: true,
    revokeFreezeAuthority: false
  });
}

/**
 * Create a mintable token (only freeze authority revoked)
 */
export async function createMintableToken(metadataUrl, options = {}) {
  return createTokenAndRevokeAuthorities(metadataUrl, {
    ...options,
    revokeMintAuthority: false,
    revokeFreezeAuthority: true
  });
}

/**
 * Batch create multiple tokens
 */
export async function batchCreateTokens(tokenConfigs, options = {}) {
  const { verbose = true, delayBetweenTokens = 2000 } = options;
  
  if (verbose) {
    log.info(`Creating ${tokenConfigs.length} tokens in batch`);
  }
  
  const results = [];
  
  for (let i = 0; i < tokenConfigs.length; i++) {
    const config = tokenConfigs[i];
    
    if (verbose) {
      log.info(`Creating token ${i + 1}/${tokenConfigs.length}: ${config.name || 'Unnamed'}`);
    }
    
    const result = await createTokenAndRevokeAuthorities(config.metadataUrl, {
      revokeMintAuthority: config.revokeMintAuthority ?? true,
      revokeFreezeAuthority: config.revokeFreezeAuthority ?? true,
      verbose: verbose
    });
    
    results.push({
      config,
      result,
      index: i
    });
    
    // Add delay between tokens (except for the last one)
    if (i < tokenConfigs.length - 1 && delayBetweenTokens > 0) {
      if (verbose) {
        log.info(`Waiting ${delayBetweenTokens}ms before next token...`);
      }
      await new Promise(resolve => setTimeout(resolve, delayBetweenTokens));
    }
  }
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  if (verbose) {
    log.info(`Batch complete: ${successful.length}/${results.length} successful`);
  }
  
  return {
    results,
    successful,
    failed,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length
    }
  };
}

/**
 * Validate metadata URL format
 */
export function validateMetadataUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Format mint address for display
 */
export function formatMintAddress(mintAddress, length = 8) {
  if (!mintAddress || mintAddress.length <= length * 2) {
    return mintAddress;
  }
  return `${mintAddress.slice(0, length)}...${mintAddress.slice(-length)}`;
}

/**
 * Get Solana explorer URL
 */
export function getExplorerUrl(mintAddress, cluster = 'devnet') {
  return `https://explorer.solana.com/address/${mintAddress}?cluster=${cluster}`;
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation(operation, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    verbose = true
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      
      if (verbose) {
        log.warning(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
      
      await wait(delay);
    }
  }
  
  throw lastError;
}

// Example usage and presets
export const PRESETS = {
  IMMUTABLE_TOKEN: {
    revokeMintAuthority: true,
    revokeFreezeAuthority: true,
    description: 'Completely immutable token'
  },
  FIXED_SUPPLY_TOKEN: {
    revokeMintAuthority: true,
    revokeFreezeAuthority: false,
    description: 'Fixed supply but can freeze accounts'
  },
  MINTABLE_TOKEN: {
    revokeMintAuthority: false,
    revokeFreezeAuthority: true,
    description: 'Can mint more tokens but cannot freeze'
  },
  FULL_AUTHORITY_TOKEN: {
    revokeMintAuthority: false,
    revokeFreezeAuthority: false,
    description: 'Keeps both authorities'
  }
};

// Export default configuration
export const DEFAULT_CONFIG = {
  API_BASE_URL,
  DEFAULT_WAIT_TIME: 3000,
  DEFAULT_BATCH_DELAY: 2000,
  DEFAULT_CLUSTER: 'devnet'
};
