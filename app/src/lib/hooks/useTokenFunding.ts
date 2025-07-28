// app/src/lib/hooks/useTokenFunding.ts
import { useState } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { ERC20_ABI, TOKEN_VESTING_ABI } from "@/lib/web3/config";

// Hook to check if vesting contract has sufficient tokens
export function useVestingContractBalance(
  tokenAddress?: string,
  vestingContractAddress?: string
) {
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [vestingContractAddress],
    query: {
      enabled: !!(tokenAddress && vestingContractAddress),
      refetchInterval: 10000, // Check every 10 seconds
    },
  });

  const { data: totalAmount } = useReadContract({
    address: vestingContractAddress as `0x${string}`,
    abi: TOKEN_VESTING_ABI,
    functionName: "totalAmount",
    query: {
      enabled: !!vestingContractAddress,
    },
  });

  const bigintBalance =
    typeof balance === "string" ||
    typeof balance === "number" ||
    typeof balance === "bigint"
      ? BigInt(balance)
      : 0n;
  const bigintTotalAmount = totalAmount ? BigInt(totalAmount) : 0n;

  const hassufficientBalance =
    bigintBalance && bigintTotalAmount
      ? bigintBalance >= bigintTotalAmount
      : false;

  const shortfall =
    bigintBalance && bigintTotalAmount && bigintBalance < bigintTotalAmount
      ? bigintTotalAmount - bigintBalance
      : 0n;

  return {
    balance: bigintBalance,
    totalAmount: bigintTotalAmount,
    hassufficientBalance,
    shortfall,
    isLoading: !balance && !totalAmount,
  };
}

// Hook to send tokens to vesting contract
export function useSendTokensToVesting() {
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

  const sendTokens = async (
    tokenAddress: string,
    vestingContractAddress: string,
    amount: bigint
  ) => {
    try {
      setIsPending(true);

      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [vestingContractAddress, amount],
      });
    } catch (err) {
      console.error("Send tokens error:", err);
      setIsPending(false);
      throw err;
    }
  };

  return {
    sendTokens,
    data: hash,
    error,
    isLoading: isPending || isWritePending || isConfirming,
    isSuccess,
  };
}

// Hook to get user's token balance
export function useUserTokenBalance(
  tokenAddress?: string,
  userAddress?: string
) {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress],
    query: {
      enabled: !!(tokenAddress && userAddress),
      refetchInterval: 30000,
    },
  });
}
