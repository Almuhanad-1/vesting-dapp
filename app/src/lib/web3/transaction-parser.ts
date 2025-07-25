// src/lib/web3/transaction-parser.ts
import { PublicClient, decodeEventLog, getAddress } from "viem";
import { TOKEN_VESTING_FACTORY_ABI } from "./config";

export interface DeploymentAddresses {
  tokenAddress: string;
  vestingContracts: string[];
}

/**
 * Parse the transaction receipt to extract deployed contract addresses
 * from the TokenVestingFactory deployment events
 */
export async function parseDeploymentTransaction(
  publicClient: PublicClient,
  txHash: string
): Promise<DeploymentAddresses> {
  try {
    console.log("Parsing transaction:", txHash);

    // Get the transaction receipt
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    console.log("Transaction receipt:", receipt);

    let tokenAddress = "";
    const vestingContracts: string[] = [];

    // Parse logs to find deployment events
    for (const log of receipt.logs) {
      try {
        // Try to decode the log using the factory ABI
        const decoded = decodeEventLog({
          abi: TOKEN_VESTING_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });

        console.log("Decoded event:", decoded);

        // Handle TokenDeployed event
        if (decoded.eventName === "TokenDeployed") {
          tokenAddress = getAddress(decoded.args.token as string);
          console.log("Found token address:", tokenAddress);
        }

        // Handle VestingDeployed event
        if (decoded.eventName === "VestingDeployed") {
          const vestingAddress = getAddress(
            decoded.args.vestingContract as string
          );
          vestingContracts.push(vestingAddress);
          console.log("Found vesting contract:", vestingAddress);
        }
      } catch (decodeError) {
        // Log is not from our factory contract or not a relevant event, skip it
        continue;
      }
    }

    // If we can't find events, try alternative approach
    if (!tokenAddress) {
      console.log(
        "No TokenDeployed event found, trying alternative parsing..."
      );

      // Look for contract creation in the receipt
      // The token and vesting contracts will be created by the factory
      const contractCreations = receipt.logs.filter(
        (log) => log.topics[0] === "0x" // Contract creation topic
      );

      console.log("Contract creations found:", contractCreations.length);

      // For now, return the transaction hash as addresses if we can't parse
      // This is a fallback - you should implement proper event parsing
      if (contractCreations.length === 0) {
        throw new Error("No contract deployment events found in transaction");
      }
    }

    if (!tokenAddress) {
      throw new Error("Token deployment event not found in transaction");
    }

    console.log("Successfully parsed deployment:", {
      tokenAddress,
      vestingContracts,
    });

    return {
      tokenAddress,
      vestingContracts,
    };
  } catch (error) {
    console.error("Failed to parse deployment transaction:", error);
    throw new Error(
      `Failed to parse deployment transaction: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Alternative: Parse addresses from transaction receipt using contract addresses
 * This is a more reliable fallback method
 */
export async function parseDeploymentFromReceipt(
  publicClient: PublicClient,
  txHash: string
): Promise<DeploymentAddresses> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    // Look for contract creation logs
    // When contracts are deployed, they emit specific events
    const newContracts: string[] = [];

    for (const log of receipt.logs) {
      // Check if this is a contract creation by looking at the address
      if (log.address && log.address !== receipt.to) {
        newContracts.push(getAddress(log.address));
      }
    }

    console.log("New contracts found:", newContracts);

    if (newContracts.length === 0) {
      throw new Error("No new contracts found in transaction");
    }

    // The first contract is usually the token, the rest are vesting contracts
    const [tokenAddress, ...vestingContracts] = newContracts;

    return {
      tokenAddress: tokenAddress || "",
      vestingContracts: vestingContracts || [],
    };
  } catch (error) {
    console.error("Failed to parse from receipt:", error);
    throw error;
  }
}

/**
 * Wait for transaction confirmation and parse the results
 * with retry logic and better error handling
 */
export async function waitForDeploymentAndParse(
  publicClient: PublicClient,
  txHash: string,
  maxWaitTime = 120000 // 2 minutes
): Promise<DeploymentAddresses> {
  const startTime = Date.now();
  let lastError: Error | null = null;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (receipt.status === "success") {
        console.log("Transaction confirmed, parsing addresses...");

        // Try the primary parsing method first
        try {
          return await parseDeploymentTransaction(publicClient, txHash);
        } catch (parseError) {
          console.log("Primary parsing failed, trying fallback method...");
          // Fall back to receipt parsing
          return await parseDeploymentFromReceipt(publicClient, txHash);
        }
      } else if (receipt.status === "reverted") {
        throw new Error("Transaction was reverted");
      }
    } catch (error) {
      lastError = error as Error;

      // If transaction not found, continue waiting
      if (error instanceof Error && error.message.includes("not found")) {
        console.log("Transaction not yet mined, waiting...");
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw new Error(
    `Transaction confirmation timeout. Last error: ${
      lastError?.message || "Unknown"
    }`
  );
}
