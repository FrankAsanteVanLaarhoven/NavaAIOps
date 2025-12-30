/**
 * Polygon L2 Bridge Service
 * 
 * TypeScript utilities for interacting with the NavaChain Audit Ledger
 * on Polygon L2. Provides functions to verify logs and check anchor status.
 */

import { ethers } from 'ethers';

// Contract ABI (minimal for verification)
const AUDIT_LEDGER_ABI = [
  'function verifyLog(bytes32 logId) external view returns (bool valid, bytes32 metadataHash, string memory ipfsCid, uint256 timestamp)',
  'function logExists(bytes32 logId) external view returns (bool)',
  'event LogAnchored(bytes32 indexed logId, bytes32 metadataHash, string ipfsCid, uint256 timestamp, address indexed archivedBy)',
] as const;

export interface LogVerificationResult {
  valid: boolean;
  metadataHash: string;
  ipfsCid: string;
  timestamp: number;
  exists: boolean;
}

export interface PolygonBridgeConfig {
  rpcUrl: string;
  contractAddress: string;
  chainId?: number;
}

/**
 * Convert UUID string to bytes32 (for contract interaction)
 */
export function uuidToBytes32(uuid: string): string {
  // Remove hyphens and pad/truncate to 32 bytes (64 hex chars)
  const cleanUuid = uuid.replace(/-/g, '');
  const hex = cleanUuid.padEnd(64, '0').slice(0, 64);
  return `0x${hex}`;
}

/**
 * Polygon Bridge Client
 */
export class PolygonBridge {
  private provider: ethers.Provider;
  private contract: ethers.Contract;
  private contractAddress: string;

  constructor(config: PolygonBridgeConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.contractAddress = config.contractAddress;
    this.contract = new ethers.Contract(
      config.contractAddress,
      AUDIT_LEDGER_ABI,
      this.provider
    );
  }

  /**
   * Verify a log entry against the blockchain
   */
  async verifyLog(logId: string): Promise<LogVerificationResult> {
    try {
      const logIdBytes32 = uuidToBytes32(logId);
      
      // Check if log exists
      const exists = await this.contract.logExists(logIdBytes32);
      
      if (!exists) {
        return {
          valid: false,
          metadataHash: '',
          ipfsCid: '',
          timestamp: 0,
          exists: false,
        };
      }

      // Get full verification data
      const [valid, metadataHash, ipfsCid, timestamp] = await this.contract.verifyLog(logIdBytes32);

      return {
        valid: valid as boolean,
        metadataHash: metadataHash as string,
        ipfsCid: ipfsCid as string,
        timestamp: Number(timestamp),
        exists: true,
      };
    } catch (error: any) {
      console.error('Verification error:', error);
      return {
        valid: false,
        metadataHash: '',
        ipfsCid: '',
        timestamp: 0,
        exists: false,
      };
    }
  }

  /**
   * Check if a log exists on-chain (lightweight check)
   */
  async logExists(logId: string): Promise<boolean> {
    try {
      const logIdBytes32 = uuidToBytes32(logId);
      return await this.contract.logExists(logIdBytes32);
    } catch (error) {
      console.error('Log existence check error:', error);
      return false;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }
}

/**
 * Create a Polygon Bridge instance from environment variables
 */
export function createPolygonBridge(): PolygonBridge {
  const rpcUrl = process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology';
  const contractAddress = process.env.NAVACHAIN_CONTRACT_ADDRESS || '';
  
  if (!contractAddress) {
    throw new Error('NAVACHAIN_CONTRACT_ADDRESS environment variable is required');
  }

  return new PolygonBridge({
    rpcUrl,
    contractAddress,
    chainId: 80002, // Polygon Amoy testnet
  });
}
