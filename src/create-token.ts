import {
  createV1,
  mplTokenMetadata,
  TokenStandard,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  createMint,
} from '@solana/spl-token'
import {
  keypairIdentity,
  percentAmount,
  createSignerFromKeypair,
} from '@metaplex-foundation/umi'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  AuthorityType,
  createSetAuthorityInstruction
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
  mintSignerSecretKey?: number[]; // Add the mint signer secret key for authority operations
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

    // Create token using standard SPL token method for full control over authorities
    console.log("Creating token with standard SPL method...");

    // Create the mint using standard SPL token method for full authority control
    const mintKeypair = Keypair.generate();

    const mint = await createMint(
      connection,
      web3Keypair, // Payer
      web3Keypair.publicKey, // Mint authority (our wallet)
      web3Keypair.publicKey, // Freeze authority (our wallet)
      9, // Decimals
      mintKeypair // Mint keypair
    );

    console.log("Token created successfully with address:", mint.toString());

    // Now add metadata using Metaplex
    console.log("Adding metadata to token...");
    const umi = createUmi("https://devnet.helius-rpc.com/?api-key=e3996982-5073-4b8b-942d-1d774b777012")
      .use(mplTokenMetadata());

    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(walletFile));
    umi.use(keypairIdentity(umiKeypair));

    // Convert the mint keypair to UMI signer format
    const umiMintKeypair = umi.eddsa.createKeypairFromSecretKey(mintKeypair.secretKey);
    const umiMintSigner = createSignerFromKeypair(umi, umiMintKeypair);

    // Create metadata for the existing mint (mint needs to be a signer)
    const createMetadataIx = createV1(umi, {
      mint: umiMintSigner, // Use the mint signer
      authority: umi.identity,
      payer: umi.identity,
      updateAuthority: umi.identity,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadataUrl,
      sellerFeeBasisPoints: percentAmount(0),
      tokenStandard: TokenStandard.Fungible,
    });

    await createMetadataIx.sendAndConfirm(umi);
    console.log("Metadata added successfully!");

    // Use the mint address from the standard creation
    const mintAddress = mint;
    const mintAddressString = mintAddress.toString();

    // Check the mint account immediately after creation
    const mintInfo = await connection.getParsedAccountInfo(mintAddress);
    if (mintInfo.value && mintInfo.value.data && typeof mintInfo.value.data === 'object' && 'parsed' in mintInfo.value.data) {
      const mintData = mintInfo.value.data.parsed.info;
      console.log('Mint authority immediately after creation:', mintData.mintAuthority);
      console.log('Freeze authority immediately after creation:', mintData.freezeAuthority);
    }

    // Token created with metadata - no initial minting needed

    console.log('\n✅ Token Creation Complete');
    console.log('🪙 Token created with metadata successfully!');
    console.log('🔗 View Token on Solana Explorer:');
    console.log(`   https://explorer.solana.com/address/${mintAddressString}?cluster=devnet`);
    console.log('🔑 Token authorities are set to your wallet and can be revoked.');

    // Return the result
    const signatureString = "token-created-with-standard-method";
    return {
      mintAddress: mintAddressString,
      transactionSignature: signatureString,
      explorerUrl: `https://explorer.solana.com/address/${mintAddressString}?cluster=devnet`
      // No mint signer secret key needed since our wallet is the authority
    };

  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
};

// Options for selective authority revocation
export interface RevokeAuthorityOptions {
  revokeMintAuthority?: boolean;
  revokeFreezeAuthority?: boolean;
}

// Function to revoke authorities after token creation
export const revokeTokenAuthorities = async (
  mintAddress: string,
  options: RevokeAuthorityOptions = { revokeMintAuthority: true, revokeFreezeAuthority: true },
  mintSignerSecretKey?: number[]
): Promise<{ success: boolean; signatures?: string[]; error?: string; revoked?: { mintAuthority?: boolean; freezeAuthority?: boolean } }> => {
  try {
    const connection = new Connection('https://devnet.helius-rpc.com/?api-key=e3996982-5073-4b8b-942d-1d774b777012', 'confirmed');
    const walletFile = JSON.parse(fs.readFileSync('./sM1hvmgLNhyjEGphU67RpcKBACghwoo3NUPGMvUbEF7.json', 'utf8'));
    const web3Keypair = Keypair.fromSecretKey(new Uint8Array(walletFile));

    // Get mint info to check current authorities
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mintAddress));

    if (!mintInfo.value || !mintInfo.value.data || typeof mintInfo.value.data !== 'object' || !('parsed' in mintInfo.value.data)) {
      throw new Error('Could not fetch mint information');
    }

    const mintData = mintInfo.value.data.parsed.info;
    console.log('Current mint authority:', mintData.mintAuthority);
    console.log('Current freeze authority:', mintData.freezeAuthority);

    const signatures: string[] = [];
    const revoked = { mintAuthority: false, freezeAuthority: false };

    // Create transaction for authority revocation
    const transaction = new Transaction();

    // Add instruction to revoke mint authority if it exists and requested
    if (mintData.mintAuthority && options.revokeMintAuthority) {
      let authorityKeypair: Keypair | null = null;

      if (mintData.mintAuthority === web3Keypair.publicKey.toString()) {
        // Our wallet is the authority
        authorityKeypair = web3Keypair;
        console.log('🔑 Revoking mint authority...');
      } else if (mintSignerSecretKey) {
        // Try the mint signer (for backward compatibility)
        const mintSignerKeypair = Keypair.fromSecretKey(new Uint8Array(mintSignerSecretKey));
        if (mintData.mintAuthority === mintSignerKeypair.publicKey.toString()) {
          authorityKeypair = mintSignerKeypair;
          console.log('🔑 Revoking mint authority using mint signer...');
        }
      }

      if (authorityKeypair) {
        transaction.add(
          createSetAuthorityInstruction(
            new PublicKey(mintAddress),
            authorityKeypair.publicKey,
            AuthorityType.MintTokens,
            null // Setting to null revokes the authority
          )
        );
        revoked.mintAuthority = true;
      } else {
        console.log(`⚠️  Warning: Cannot revoke mint authority ${mintData.mintAuthority}`);
      }
    } else if (mintData.mintAuthority && !options.revokeMintAuthority) {
      console.log('ℹ️  Skipping mint authority revocation (not requested)');
    }

    // Add instruction to revoke freeze authority if it exists and requested
    if (mintData.freezeAuthority && options.revokeFreezeAuthority) {
      let authorityKeypair: Keypair | null = null;

      if (mintData.freezeAuthority === web3Keypair.publicKey.toString()) {
        // Our wallet is the authority
        authorityKeypair = web3Keypair;
        console.log('🧊 Revoking freeze authority...');
      } else if (mintSignerSecretKey) {
        // Try the mint signer (for backward compatibility)
        const mintSignerKeypair = Keypair.fromSecretKey(new Uint8Array(mintSignerSecretKey));
        if (mintData.freezeAuthority === mintSignerKeypair.publicKey.toString()) {
          authorityKeypair = mintSignerKeypair;
          console.log('🧊 Revoking freeze authority using mint signer...');
        }
      }

      if (authorityKeypair) {
        transaction.add(
          createSetAuthorityInstruction(
            new PublicKey(mintAddress),
            authorityKeypair.publicKey,
            AuthorityType.FreezeAccount,
            null // Setting to null revokes the authority
          )
        );
        revoked.freezeAuthority = true;
      } else {
        console.log(`⚠️  Warning: Cannot revoke freeze authority ${mintData.freezeAuthority}`);
      }
    } else if (mintData.freezeAuthority && !options.revokeFreezeAuthority) {
      console.log('ℹ️  Skipping freeze authority revocation (not requested)');
    }

    if (transaction.instructions.length > 0) {
      // Determine which signers we need
      const signers: Keypair[] = [web3Keypair]; // Always include the wallet

      // If we're using the mint signer for authority operations, include it
      if (mintSignerSecretKey) {
        const mintSignerKeypair = Keypair.fromSecretKey(new Uint8Array(mintSignerSecretKey));
        // Only add if it's different from the wallet
        if (mintSignerKeypair.publicKey.toString() !== web3Keypair.publicKey.toString()) {
          signers.push(mintSignerKeypair);
        }
      }

      const signature = await sendAndConfirmTransaction(connection, transaction, signers);
      signatures.push(signature);
      console.log('✅ Authorities revoked successfully!');
      console.log('📝 Transaction signature:', signature);
    }

    return { success: true, signatures, revoked };
  } catch (error) {
    console.error('Error revoking authorities:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
};

// Example usage (for testing)
const testTokenCreation = async () => {
  try {
    const result = await createTokenFromMetadataUrl("https://raw.githubusercontent.com/cameronspaul/create-solana-token-metadata/refs/heads/main/metadata-data.json");
    console.log('Token created successfully:', result);

    // Try to revoke authorities (no mint signer secret key needed since our wallet is the authority)
    const revokeResult = await revokeTokenAuthorities(result.mintAddress);
    console.log('Authority revocation result:', revokeResult);
  } catch (error) {
    console.error('Failed to create token:', error);
  }
};

// Uncomment to test the function directly
// testTokenCreation();