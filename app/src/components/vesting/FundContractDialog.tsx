// app/src/components/vesting/FundContractDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/lib/hooks/use-toast";
import {
  useSendTokensToVesting,
  useUserTokenBalance,
  useVestingContractBalance,
} from "@/lib/hooks/useTokenFunding";
import { parseEther, formatEther } from "viem";
import { Loader2, AlertTriangle, Info } from "lucide-react";

interface FundContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenAddress: string;
  vestingContractAddress: string;
  tokenSymbol: string;
  userAddress: string;
}

export function FundContractDialog({
  open,
  onOpenChange,
  tokenAddress,
  vestingContractAddress,
  tokenSymbol,
  userAddress,
}: FundContractDialogProps) {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const { data: userBalance } = useUserTokenBalance(tokenAddress, userAddress);
  const { shortfall, totalAmount } = useVestingContractBalance(
    tokenAddress,
    vestingContractAddress
  );
  const { sendTokens, isLoading, isSuccess, error } = useSendTokensToVesting();

  // Auto-fill recommended amount
  useEffect(() => {
    if (shortfall && shortfall > 0n) {
      setAmount(formatEther(shortfall));
    }
  }, [shortfall]);

  // Handle success
  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Tokens Sent Successfully",
        description: `${amount} ${tokenSymbol} sent to vesting contract`,
      });
      onOpenChange(false);
      setAmount("");
    }
  }, [isSuccess, amount, tokenSymbol, toast, onOpenChange]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to send tokens",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountWei = parseEther(amount);

      if (typeof userBalance === "bigint" && amountWei > userBalance) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough tokens",
          variant: "destructive",
        });
        return;
      }

      await sendTokens(tokenAddress, vestingContractAddress, amountWei);
    } catch (err) {
      console.error("Send tokens error:", err);
    }
  };

  const maxAmount =
    typeof userBalance === "bigint" ? formatEther(userBalance) : "0";
  const recommendedAmount = shortfall ? formatEther(shortfall) : "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Vesting Contract</DialogTitle>
          <DialogDescription>
            Send {tokenSymbol} tokens to the vesting contract so beneficiaries
            can claim their tokens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <div>
                  Required: {totalAmount ? formatEther(totalAmount) : "0"}{" "}
                  {tokenSymbol}
                </div>
                <div>
                  Recommended: {recommendedAmount} {tokenSymbol}
                </div>
                <div>
                  Your Balance: {maxAmount} {tokenSymbol}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Send</Label>
            <div className="flex space-x-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(recommendedAmount)}
                disabled={!shortfall || shortfall === 0n}
              >
                Recommended
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAmount(maxAmount)}
                disabled={!userBalance || userBalance === 0n}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Warnings */}
          {typeof userBalance === "bigint" &&
            parseFloat(amount) > 0 &&
            parseEther(amount) > userBalance && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient balance. You only have {maxAmount} {tokenSymbol}.
                </AlertDescription>
              </Alert>
            )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || !amount || parseFloat(amount) <= 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
