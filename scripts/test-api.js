#!/usr/bin/env node

/**
 * Basic API Test Script
 * Tests the core functionality of the Solana Token Creation API
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
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}\n=== ${msg} ===${colors.reset}`)
};

// Test data
const TEST_METADATA_URL = 'https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json';

/**
 * Test the health check endpoint
 */
async function testHealthCheck() {
  log.header('Testing Health Check');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'OK') {
      log.success('Health check passed');
      log.info(`Server timestamp: ${data.timestamp}`);
      return true;
    } else {
      log.error('Health check failed');
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    log.warning('Make sure the API server is running on port 3001');
    return false;
  }
}

/**
 * Test token creation
 */
async function testTokenCreation() {
  log.header('Testing Token Creation');
  
  try {
    log.info(`Creating token with metadata from: ${TEST_METADATA_URL}`);
    
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
      log.success('Token created successfully!');
      log.info(`Mint Address: ${data.data.mintAddress}`);
      log.info(`Transaction: ${data.data.transactionSignature}`);
      log.info(`Explorer: ${data.data.explorerUrl}`);
      return data.data.mintAddress;
    } else {
      log.error('Token creation failed');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
      return null;
    }
  } catch (error) {
    log.error(`Token creation failed: ${error.message}`);
    return null;
  }
}

/**
 * Test authority revocation (both authorities)
 */
async function testAuthorityRevocation(mintAddress) {
  log.header('Testing Authority Revocation');
  
  if (!mintAddress) {
    log.error('No mint address provided for authority revocation test');
    return false;
  }
  
  try {
    log.info(`Revoking both authorities for token: ${mintAddress}`);
    
    const response = await fetch(`${API_BASE_URL}/revoke-authorities`, {
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
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Authorities revoked successfully!');
      log.info(`Mint Authority Revoked: ${data.data.revoked.mintAuthority}`);
      log.info(`Freeze Authority Revoked: ${data.data.revoked.freezeAuthority}`);
      log.info(`Transaction Signatures: ${data.data.signatures.join(', ')}`);
      return true;
    } else {
      log.error('Authority revocation failed');
      console.log('Error:', data.error);
      if (data.details) {
        console.log('Details:', data.details);
      }
      return false;
    }
  } catch (error) {
    log.error(`Authority revocation failed: ${error.message}`);
    return false;
  }
}

/**
 * Test invalid requests
 */
async function testErrorHandling() {
  log.header('Testing Error Handling');
  
  const tests = [
    {
      name: 'Missing metadata URL',
      body: {},
      expectedStatus: 400
    },
    {
      name: 'Invalid metadata URL',
      body: { metadataUrl: 'not-a-url' },
      expectedStatus: 400
    },
    {
      name: 'Non-string metadata URL',
      body: { metadataUrl: 123 },
      expectedStatus: 400
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      log.info(`Testing: ${test.name}`);
      
      const response = await fetch(`${API_BASE_URL}/create-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.body)
      });
      
      const data = await response.json();
      
      if (response.status === test.expectedStatus && !data.success) {
        log.success(`✓ ${test.name} - Correctly returned error`);
        passedTests++;
      } else {
        log.error(`✗ ${test.name} - Expected status ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      log.error(`✗ ${test.name} - Test failed: ${error.message}`);
    }
  }
  
  log.info(`Error handling tests: ${passedTests}/${tests.length} passed`);
  return passedTests === tests.length;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.bold}${colors.blue}🧪 Solana Token Creation API Test Suite${colors.reset}\n`);
  
  const results = {
    healthCheck: false,
    tokenCreation: false,
    authorityRevocation: false,
    errorHandling: false
  };
  
  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    log.error('Health check failed. Cannot proceed with other tests.');
    process.exit(1);
  }
  
  // Add delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Token Creation
  const mintAddress = await testTokenCreation();
  results.tokenCreation = !!mintAddress;
  
  if (mintAddress) {
    // Add delay for blockchain confirmation
    log.info('Waiting for blockchain confirmation...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Authority Revocation
    results.authorityRevocation = await testAuthorityRevocation(mintAddress);
  }
  
  // Add delay between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Error Handling
  results.errorHandling = await testErrorHandling();
  
  // Summary
  log.header('Test Results Summary');
  
  const testResults = [
    { name: 'Health Check', passed: results.healthCheck },
    { name: 'Token Creation', passed: results.tokenCreation },
    { name: 'Authority Revocation', passed: results.authorityRevocation },
    { name: 'Error Handling', passed: results.errorHandling }
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
    log.success('All tests passed! 🎉');
    process.exit(0);
  } else {
    log.error('Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

export { runTests, testHealthCheck, testTokenCreation, testAuthorityRevocation };
