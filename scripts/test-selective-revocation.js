#!/usr/bin/env node

/**
 * Selective Authority Revocation Test Script
 * Tests different authority revocation scenarios
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.cyan}\n=== ${msg} ===${colors.reset}`),
  step: (msg) => console.log(`${colors.bold}${colors.blue}📋 ${msg}${colors.reset}`)
};

// Test metadata URL
const TEST_METADATA_URL = 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json';

/**
 * Create a token for testing
 */
async function createTestToken(testName) {
  log.step(`Creating token for ${testName}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/create-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataUrl: TEST_METADATA_URL
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success(`Token created: ${data.data.mintAddress}`);
      return data.data.mintAddress;
    } else {
      log.error('Token creation failed');
      console.log('Error:', data.error);
      return null;
    }
  } catch (error) {
    log.error(`Token creation failed: ${error.message}`);
    return null;
  }
}

/**
 * Test revoking only mint authority
 */
async function testRevokeMintAuthorityOnly() {
  log.header('Test 1: Revoke Mint Authority Only');
  log.info('This creates a token with fixed supply but keeps freeze capability');
  
  const mintAddress = await createTestToken('Mint Authority Revocation');
  if (!mintAddress) return false;
  
  // Wait for blockchain confirmation
  log.info('Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
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
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Selective revocation completed!');
      log.info(`Mint Authority Revoked: ${data.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data.data.revoked.freezeAuthority}`);
      
      if (data.data.revoked.mintAuthority && !data.data.revoked.freezeAuthority) {
        log.success('✓ Test passed: Only mint authority was revoked');
        return true;
      } else {
        log.error('✗ Test failed: Incorrect authorities revoked');
        return false;
      }
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test revoking only freeze authority
 */
async function testRevokeFreezeAuthorityOnly() {
  log.header('Test 2: Revoke Freeze Authority Only');
  log.info('This allows continued minting but removes freeze capability');
  
  const mintAddress = await createTestToken('Freeze Authority Revocation');
  if (!mintAddress) return false;
  
  // Wait for blockchain confirmation
  log.info('Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
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
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Selective revocation completed!');
      log.info(`Mint Authority Revoked: ${data.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data.data.revoked.freezeAuthority}`);
      
      if (!data.data.revoked.mintAuthority && data.data.revoked.freezeAuthority) {
        log.success('✓ Test passed: Only freeze authority was revoked');
        return true;
      } else {
        log.error('✗ Test failed: Incorrect authorities revoked');
        return false;
      }
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test revoking both authorities (default behavior)
 */
async function testRevokeBothAuthorities() {
  log.header('Test 3: Revoke Both Authorities (Default)');
  log.info('This makes the token completely immutable');
  
  const mintAddress = await createTestToken('Both Authorities Revocation');
  if (!mintAddress) return false;
  
  // Wait for blockchain confirmation
  log.info('Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Test with explicit parameters
    const response1 = await fetch(`${API_BASE_URL}/revoke-authorities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress,
        revokeMintAuthority: true,
        revokeFreezeAuthority: true
      })
    });
    
    const data1 = await response1.json();
    
    if (response1.ok && data1.success) {
      log.success('Explicit both authorities revocation completed!');
      log.info(`Mint Authority Revoked: ${data1.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data1.data.revoked.freezeAuthority}`);
      
      if (data1.data.revoked.mintAuthority && data1.data.revoked.freezeAuthority) {
        log.success('✓ Test passed: Both authorities were revoked');
        return true;
      } else {
        log.error('✗ Test failed: Not all authorities were revoked');
        return false;
      }
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data1.error);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test default behavior (no explicit parameters)
 */
async function testDefaultBehavior() {
  log.header('Test 4: Default Behavior (No Parameters)');
  log.info('Testing that both authorities are revoked by default');
  
  const mintAddress = await createTestToken('Default Behavior');
  if (!mintAddress) return false;
  
  // Wait for blockchain confirmation
  log.info('Waiting for blockchain confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Test without explicit parameters (should default to both true)
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mintAddress: mintAddress
        // No revokeMintAuthority or revokeFreezeAuthority specified
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Default behavior revocation completed!');
      log.info(`Mint Authority Revoked: ${data.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data.data.revoked.freezeAuthority}`);
      
      if (data.data.revoked.mintAuthority && data.data.revoked.freezeAuthority) {
        log.success('✓ Test passed: Both authorities were revoked by default');
        return true;
      } else {
        log.error('✗ Test failed: Default behavior did not revoke both authorities');
        return false;
      }
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runSelectiveRevocationTests() {
  console.log(`${colors.bold}${colors.cyan}🔒 Selective Authority Revocation Test Suite${colors.reset}\n`);
  
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
    process.exit(1);
  }
  
  const results = {
    mintOnly: false,
    freezeOnly: false,
    bothExplicit: false,
    defaultBehavior: false
  };
  
  // Run tests with delays between them
  results.mintOnly = await testRevokeMintAuthorityOnly();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.freezeOnly = await testRevokeFreezeAuthorityOnly();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.bothExplicit = await testRevokeBothAuthorities();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.defaultBehavior = await testDefaultBehavior();
  
  // Summary
  log.header('Test Results Summary');
  
  const testResults = [
    { name: 'Revoke Mint Authority Only', passed: results.mintOnly },
    { name: 'Revoke Freeze Authority Only', passed: results.freezeOnly },
    { name: 'Revoke Both Authorities (Explicit)', passed: results.bothExplicit },
    { name: 'Default Behavior Test', passed: results.defaultBehavior }
  ];
  
  testResults.forEach(test => {
    if (test.passed) {
      log.success(`${test.name}: PASSED`);
    } else {
      log.error(`${test.name}: FAILED`);
    }
  });
  
  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  
  console.log(`\n${colors.bold}Overall Result: ${passedCount}/${totalCount} tests passed${colors.reset}`);
  
  if (passedCount === totalCount) {
    log.success('All selective revocation tests passed! 🎉');
    log.info('Your API correctly handles selective authority revocation');
  } else {
    log.error('Some tests failed. Check the implementation.');
  }
  
  return passedCount === totalCount;
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSelectiveRevocationTests().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

export { runSelectiveRevocationTests };
