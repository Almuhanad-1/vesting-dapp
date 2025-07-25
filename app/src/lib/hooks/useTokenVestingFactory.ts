// src/hooks/useTokenVestingFactory.ts
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import {
  CONTRACT_ADDRESSES,
  TOKEN_VESTING_FACTORY_ABI,
} from "@/lib/web3/config";
import { useState, useEffect } from "react";
import { waitForDeploymentAndParse } from "@/lib/web3/transaction-parser";

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  owner: string;
}

export interface VestingConfig {
  beneficiary: string;
  amount: bigint;
  cliff: bigint;
  duration: bigint;
  revocable: boolean;
}

export interface DeploymentResult {
  tokenAddress: string;
  vestingContracts: string[];
  transactionHash: string;
}

// Hook for deploying token with vesting
export function useDeployTokenWithVesting() {
  const [deploymentResult, setDeploymentResult] =
    useState<DeploymentResult | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [isParsingAddresses, setIsParsingAddresses] = useState(false);

  const publicClient = usePublicClient();

  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isTxSuccess,
    error: waitError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Parse transaction when it's successful
  useEffect(() => {
    async function parseTransaction() {
      if (isTxSuccess && hash && publicClient && !isParsingAddresses) {
        try {
          setIsParsingAddresses(true);
          console.log(
            "Transaction successful, parsing contract addresses...",
            hash
          );

          // Parse the real addresses from the transaction
          const addresses = await waitForDeploymentAndParse(publicClient, hash);

          console.log("Successfully parsed addresses:", addresses);

          setDeploymentResult({
            tokenAddress: addresses.tokenAddress,
            vestingContracts: addresses.vestingContracts,
            transactionHash: hash,
          });

          setDeploymentError(null);
          setIsParsingAddresses(false);
        } catch (error) {
          console.error("Failed to parse deployment addresses:", error);
          setDeploymentError(
            `Failed to parse contract addresses: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          setIsParsingAddresses(false);

          // Set a fallback result with the transaction hash
          // so users can at least see the transaction
          setDeploymentResult({
            tokenAddress: "", // Empty but won't show broken links
            vestingContracts: [],
            transactionHash: hash,
          });
        }
      }
    }

    parseTransaction();
  }, [isTxSuccess, hash, publicClient, isParsingAddresses]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error("Write contract error:", writeError);
      setDeploymentError(writeError.message || "Transaction failed");
    }
    if (waitError) {
      console.error("Wait for transaction error:", waitError);
      setDeploymentError(
        waitError.message || "Transaction confirmation failed"
      );
    }
  }, [writeError, waitError]);

  const deployToken = async (
    tokenConfig: TokenConfig,
    vestingConfigs: VestingConfig[]
  ) => {
    try {
      // Reset previous state
      setDeploymentResult(null);
      setDeploymentError(null);
      setIsParsingAddresses(false);
      resetWrite();

      // Validate inputs
      if (
        !tokenConfig.name ||
        !tokenConfig.symbol ||
        !tokenConfig.totalSupply
      ) {
        throw new Error("Invalid token configuration");
      }

      if (vestingConfigs.length === 0) {
        throw new Error("At least one vesting configuration is required");
      }

      // Validate addresses
      vestingConfigs.forEach((config, index) => {
        if (!config.beneficiary || !config.beneficiary.startsWith("0x")) {
          throw new Error(`Invalid beneficiary address at index ${index}`);
        }
      });

      console.log("Deploying token with config:", {
        vestingConfigs: vestingConfigs.length,
      });

      await writeContract({
        address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
        abi: TOKEN_VESTING_FACTORY_ABI,
        functionName: "deployTokenWithVesting",
        args: [
          {
            ...tokenConfig,
            owner: tokenConfig.owner as `0x${string}`,
          },
          vestingConfigs.map((config) => ({
            ...config,
            beneficiary: config.beneficiary as `0x${string}`,
          })),
        ],
      });
    } catch (err) {
      console.error("Deployment error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown deployment error";
      setDeploymentError(errorMessage);
      throw err;
    }
  };

  const isLoading = isWritePending || isConfirming || isParsingAddresses;
  const isSuccess = isTxSuccess && !!deploymentResult && !isParsingAddresses;

  return {
    deployToken,
    deploymentResult,
    data: hash,
    error: deploymentError,
    isLoading,
    isSuccess,
    isParsingAddresses,
    reset: () => {
      setDeploymentResult(null);
      setDeploymentError(null);
      setIsParsingAddresses(false);
      resetWrite();
    },
  };
}
