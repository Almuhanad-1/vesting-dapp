// app/src/components/vesting/FundingStatusAlert.tsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useVestingContractBalance } from "@/lib/hooks/useTokenFunding";
import { formatEther } from "viem";

interface FundingStatusAlertProps {
  tokenAddress: string;
  vestingContractAddress: string;
  tokenSymbol?: string;
  onFundClick: () => void;
  isUserOwner: boolean;
}

export function FundingStatusAlert({
  tokenAddress,
  vestingContractAddress,
  tokenSymbol = "TOKEN",
  onFundClick,
  isUserOwner,
}: FundingStatusAlertProps) {
  const { balance, totalAmount, hassufficientBalance, shortfall, isLoading } =
    useVestingContractBalance(tokenAddress, vestingContractAddress);

  if (isLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Checking contract funding status...</AlertDescription>
      </Alert>
    );
  }

  if (hassufficientBalance) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Contract is properly funded with{" "}
          {balance ? formatEther(balance) : "0"} {tokenSymbol}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          ⚠️ Contract needs {shortfall ? formatEther(shortfall) : "0"} more{" "}
          {tokenSymbol} tokens to function properly.
          {!isUserOwner && " Contact the token owner to fund this contract."}
        </div>
        {isUserOwner && (
          <Button size="sm" variant="outline" onClick={onFundClick}>
            Fund Contract
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
