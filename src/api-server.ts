import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createTokenFromMetadataUrl, TokenCreationResult, revokeTokenAuthorities } from './create-token';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies

// Request interfaces
interface CreateTokenRequest {
  metadataUrl: string;
}

interface RevokeAuthoritiesRequest {
  mintAddress: string;
  revokeMintAuthority?: boolean;
  revokeFreezeAuthority?: boolean;
}

// Response interfaces
interface CreateTokenResponse {
  success: true;
  data: TokenCreationResult;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

// Utility function to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main token creation endpoint
app.post('/create-token', async (req, res) => {
  try {
    // Validate request body
    const { metadataUrl }: CreateTokenRequest = req.body;

    if (!metadataUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: metadataUrl'
      } as ErrorResponse);
    }

    if (typeof metadataUrl !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'metadataUrl must be a string'
      } as ErrorResponse);
    }

    // Validate URL format
    if (!isValidUrl(metadataUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format. URL must start with http:// or https://'
      } as ErrorResponse);
    }

    console.log(`Creating token with metadata from: ${metadataUrl}`);

    // Create the token
    const result = await createTokenFromMetadataUrl(metadataUrl);

    // Return success response
    res.json({
      success: true,
      data: result
    } as CreateTokenResponse);

  } catch (error) {
    console.error('Error creating token:', error);

    // Handle different types of errors
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Categorize errors for appropriate status codes
      if (error.message.includes('Failed to fetch metadata')) {
        statusCode = 400; // Bad request - invalid URL or network issue
      } else if (error.message.includes('Invalid metadata')) {
        statusCode = 400; // Bad request - invalid JSON structure
      } else if (error.message.includes('JSON')) {
        statusCode = 400; // Bad request - malformed JSON
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : String(error) : undefined
    } as ErrorResponse);
  }
});

// Revoke token authorities endpoint
app.post('/revoke-authorities', async (req, res) => {
  try {
    // Validate request body
    const { mintAddress, revokeMintAuthority, revokeFreezeAuthority }: RevokeAuthoritiesRequest = req.body;

    if (!mintAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: mintAddress'
      } as ErrorResponse);
    }

    if (typeof mintAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'mintAddress must be a string'
      } as ErrorResponse);
    }

    // Validate boolean parameters if provided
    if (revokeMintAuthority !== undefined && typeof revokeMintAuthority !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'revokeMintAuthority must be a boolean'
      } as ErrorResponse);
    }

    if (revokeFreezeAuthority !== undefined && typeof revokeFreezeAuthority !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'revokeFreezeAuthority must be a boolean'
      } as ErrorResponse);
    }

    // Default to revoking both authorities if not specified
    const options = {
      revokeMintAuthority: revokeMintAuthority ?? true,
      revokeFreezeAuthority: revokeFreezeAuthority ?? true
    };

    console.log(`Revoking authorities for token: ${mintAddress}`, options);

    // Revoke the authorities
    const result = await revokeTokenAuthorities(mintAddress, options);

    if (result.success) {
      // Return success response
      res.json({
        success: true,
        data: {
          mintAddress,
          signatures: result.signatures || [],
          revoked: result.revoked || { mintAuthority: false, freezeAuthority: false },
          message: 'Authority revocation completed'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to revoke authorities'
      } as ErrorResponse);
    }

  } catch (error) {
    console.error('Error revoking authorities:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    } as ErrorResponse);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  } as ErrorResponse);
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  } as ErrorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Solana Token Creation API server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🪙 Create token: POST http://localhost:${PORT}/create-token`);
  console.log(`🔒 Revoke authorities: POST http://localhost:${PORT}/revoke-authorities`);
  console.log(`📖 Example create token body: { "metadataUrl": "https://example.com/metadata.json" }`);
  console.log(`📖 Example revoke authorities body: { "mintAddress": "YourMintAddressHere", "revokeMintAuthority": true, "revokeFreezeAuthority": true }`);
});

export default app;
