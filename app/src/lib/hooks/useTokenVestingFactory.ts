// src/hooks/useTokenVestingFactory.ts
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  CONTRACT_ADDRESSES,
  TOKEN_VESTING_FACTORY_ABI,
} from "@/lib/web3/config";
import { parseEther } from "viem";
import { useState } from "react";

export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  owner: string;
}

export interface VestingConfig {
  beneficiary: string;
  amount: bigint;
  cliff: number;
  duration: number;
  revocable: boolean;
}

// Hook for deploying token with vesting
export function useDeployTokenWithVesting() {
  const [isPending, setIsPending] = useState(false);
  const {
    writeContract,
    data: hash,
    error,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const deployToken = async (
    tokenConfig: TokenConfig,
    vestingConfigs: VestingConfig[]
  ) => {
    try {
      setIsPending(true);

      await writeContract({
        address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
        abi: TOKEN_VESTING_FACTORY_ABI,
        functionName: "deployTokenWithVesting",
        args: [
          {
            ...tokenConfig,
            owner: tokenConfig.owner as `0x${string}`,
          },
          vestingConfigs.map((vc) => ({
            ...vc,
            beneficiary: vc.beneficiary as `0x${string}`,
            cliff: BigInt(vc.cliff),
            duration: BigInt(vc.duration),
          })),
        ],
      });
    } catch (err) {
      console.error("Deployment error:", err);
      setIsPending(false);
      throw err;
    }
  };

  return {
    deployToken,
    data: hash,
    error,
    isLoading: isPending || isWritePending || isConfirming,
    isSuccess,
  };
}

// Hook for batch deployment
export function useBatchDeployTokens() {
  const [isPending, setIsPending] = useState(false);
  const {
    writeContract,
    data: hash,
    error,
    isPending: isWritePending,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const batchDeploy = async (
    tokenConfigs: TokenConfig[],
    vestingConfigsArray: VestingConfig[][]
  ) => {
    try {
      setIsPending(true);

      // Cast owner to `0x${string}` for each token config
      const formattedTokenConfigs = tokenConfigs.map((tc) => ({
        ...tc,
        owner: tc.owner as `0x${string}`,
      }));

      // Format vestingConfigsArray to match contract types
      const formattedVestingConfigsArray = vestingConfigsArray.map(
        (vestingConfigs) =>
          vestingConfigs.map((vc) => ({
            ...vc,
            beneficiary: vc.beneficiary as `0x${string}`,
            cliff: BigInt(vc.cliff),
            duration: BigInt(vc.duration),
          }))
      );

      await writeContract({
        address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
        abi: TOKEN_VESTING_FACTORY_ABI,
        functionName: "batchDeployTokens",
        args: [formattedTokenConfigs, formattedVestingConfigsArray],
      });
    } catch (err) {
      console.error("Batch deployment error:", err);
      setIsPending(false);
      throw err;
    }
  };

  return {
    batchDeploy,
    data: hash,
    error,
    isLoading: isPending || isWritePending || isConfirming,
    isSuccess,
  };
}

// Hook for checking if token is deployed by factory
export function useIsDeployedToken(tokenAddress?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: "isDeployedToken",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

// Hook for getting token vesting contracts
export function useTokenVestingContracts(tokenAddress?: string) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: "getTokenVestingContracts",
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}
