import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createTokenFromMetadataUrl, TokenCreationResult } from './create-token';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies

// Request interface
interface CreateTokenRequest {
  metadataUrl: string;
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
  console.log(`📖 Example request body: { "metadataUrl": "https://example.com/metadata.json" }`);
});

export default app;
