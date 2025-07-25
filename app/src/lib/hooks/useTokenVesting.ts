// src/hooks/useTokenVesting.ts
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState } from "react";
import { TOKEN_VESTING_ABI } from "../web3/config";

// Hook for claiming vested tokens
export function useClaimVestedTokens(vestingContractAddress?: string) {
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

  const claimTokens = async () => {
    if (!vestingContractAddress) return;

    try {
      setIsPending(true);

      await writeContract({
        address: vestingContractAddress as `0x${string}`,
        abi: TOKEN_VESTING_ABI,
        functionName: "release",
      });
    } catch (err) {
      console.error("Claim error:", err);
      setIsPending(false);
      throw err;
    }
  };

  return {
    claimTokens,
    data: hash,
    error,
    isLoading: isPending || isWritePending || isConfirming,
    isSuccess,
  };
}

// Hook for getting vesting info
export function useVestingInfo(vestingContractAddress?: string) {
  return useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "getVestingInfo",
    query: {
      enabled: !!vestingContractAddress,
    },
  });
}

// Hook for getting vesting status
export function useVestingStatus(vestingContractAddress?: string) {
  return useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "getVestingStatus",
    query: {
      enabled: !!vestingContractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });
}

// Hook for getting releasable amount
export function useReleasableAmount(vestingContractAddress?: string) {
  return useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "releasableAmount",
    query: {
      enabled: !!vestingContractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });
}

// Hook for checking vesting status flags
export function useVestingFlags(vestingContractAddress?: string) {
  const { data: hasStarted } = useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "hasStarted",
    query: {
      enabled: !!vestingContractAddress,
    },
  });

  const { data: cliffEnded } = useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "cliffEnded",
    query: {
      enabled: !!vestingContractAddress,
    },
  });

  const { data: hasEnded } = useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "hasEnded",
    query: {
      enabled: !!vestingContractAddress,
    },
  });

  return {
    hasStarted,
    cliffEnded,
    hasEnded,
  };
}
