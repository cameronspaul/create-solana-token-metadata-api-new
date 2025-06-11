import {
  createV1,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  AuthorityType,
  createSetAuthorityInstruction,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} from '@solana/spl-token'
import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey
} from '@solana/web3.js'
import fetch from 'node-fetch'
import fs from 'fs'

// Token metadata interface
export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  creator?: {
    name: string;
    site: string;
  };
  external_url?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
}

// Token creation result interface
export interface TokenCreationResult {
  mintAddress: string;
  transactionSignature: string;
  explorerUrl: string;
}
  
// Validate metadata has required fields
const validateMetadata = (metadata: any): metadata is TokenMetadata => {
  return (
    typeof metadata === 'object' &&
    typeof metadata.name === 'string' &&
    typeof metadata.symbol === 'string' &&
    typeof metadata.description === 'string' &&
    typeof metadata.image === 'string' &&
    metadata.name.trim() !== '' &&
    metadata.symbol.trim() !== '' &&
    metadata.description.trim() !== '' &&
    metadata.image.trim() !== ''
  );
};

// Main token creation function
export const createTokenFromMetadataUrl = async (metadataUrl: string): Promise<TokenCreationResult> => {
  try {
    // Create web3.js connection and keypair
    const connection = new Connection('https://devnet.helius-rpc.com/?api-key=e3996982-5073-4b8b-942d-1d774b777012', 'confirmed');
    const walletFile = JSON.parse(fs.readFileSync('./sM1hvmgLNhyjEGphU67RpcKBACghwoo3NUPGMvUbEF7.json', 'utf8'));
    const web3Keypair = Keypair.fromSecretKey(new Uint8Array(walletFile));

    // Fetch and validate metadata from remote URL
    console.log("Fetching metadata from:", metadataUrl);
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();
    if (!validateMetadata(metadata)) {
      throw new Error('Invalid metadata: missing required fields (name, symbol, description, image)');
    }

    // Create mint and metadata together using Metaplex
    console.log("Creating mint and metadata...");
    const umi = createUmi("https://devnet.helius-rpc.com/?api-key=e3996982-5073-4b8b-942d-1d774b777012")
      .use(mplTokenMetadata());

    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletFile));
    umi.use(keypairIdentity(umiKeypair));

    // Generate a new mint signer
    const mintSigner = generateSigner(umi);

    // Create mint with metadata
    const createTokenIx = createV1(umi, {
      mint: mintSigner,
      authority: umi.identity, // Explicitly set the authority
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUrl,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: 9,
      tokenStandard: 0, // Fungible
    });

    await createTokenIx.sendAndConfirm(umi);
    console.log("Mint and metadata created successfully");

    // Convert back to web3.js for token operations
    const mintAddress = new PublicKey(mintSigner.publicKey);
    const mintAddressString = mintAddress.toString();

    // Token created with metadata - no initial minting needed

    console.log('\nToken Creation Complete');
    console.log('View Token on Solana Explorer');
    console.log(`https://explorer.solana.com/address/${mintAddressString}?cluster=devnet`);

    // Return the result (without authority revocation for now)
    return {
      mintAddress: mintAddressString,
      transactionSignature: "token-created-with-metadata", // Placeholder since we don't have a specific transaction signature
      explorerUrl: `https://explorer.solana.com/address/${mintAddressString}?cluster=devnet`
    };

  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

// Example usage (for testing)
const testTokenCreation = async () => {
  try {
    const result = await createTokenFromMetadataUrl("https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json");
    console.log('Token created successfully:', result);
  } catch (error) {
    console.error('Failed to create token:', error);
  }
};

// Uncomment to test the function directly
// testTokenCreation();