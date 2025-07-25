// Simple transaction parser without viem dependency
import { parseContractLogs, getAddress } from './native-utils';
import type { PublicClient } from './native-utils';

export interface DeploymentAddresses {
  tokenAddress: string;
  vestingContracts: string[];
}

/**
 * Simple transaction parser using basic log analysis
 */
export async function parseDeploymentTransaction(
  publicClient: PublicClient,
  txHash: string
): Promise<DeploymentAddresses> {
  try {
    console.log('Parsing transaction:', txHash);
    
    const receipt = await publicClient.getTransactionReceipt({ 
      hash: txHash as `0x${string}` 
    });
    
    console.log('Transaction receipt:', receipt);
    
    // Use simple log parsing
    const { tokenAddress, vestingContracts } = parseContractLogs(receipt.logs);
    
    if (!tokenAddress) {
      throw new Error('No token contract found in transaction');
    }

    console.log('Successfully parsed deployment:', { tokenAddress, vestingContracts });

    return {
      tokenAddress: getAddress(tokenAddress),
      vestingContracts: vestingContracts.map(addr => getAddress(addr)),
    };
  } catch (error) {
    console.error('Failed to parse deployment transaction:', error);
    throw new Error(`Failed to parse deployment transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Wait for transaction and parse with simple retry logic
 */
export async function waitForDeploymentAndParse(
  publicClient: PublicClient,
  txHash: string,
  maxWaitTime = 120000
): Promise<DeploymentAddresses> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const receipt = await publicClient.getTransactionReceipt({ 
        hash: txHash as `0x${string}` 
      });
      
      if (receipt.status === 'success') {
        return await parseDeploymentTransaction(publicClient, txHash);
      } else if (receipt.status === 'reverted') {
        throw new Error('Transaction was reverted');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Transaction confirmation timeout');
}
