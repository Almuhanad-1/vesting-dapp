// app/src/components/vesting/BulkFundingDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useVestingContractBalance,
  useSendTokensToVesting,
} from "@/lib/hooks/useTokenFunding";
import { formatEther } from "viem";

interface VestingContract {
  address: string;
  beneficiary: string;
  totalAmount: bigint;
}

interface BulkFundingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenAddress: string;
  tokenSymbol: string;
  vestingContracts: VestingContract[];
  userAddress: string;
}

export function BulkFundingDialog({
  open,
  onOpenChange,
  tokenAddress,
  tokenSymbol,
  vestingContracts,
  userAddress,
}: BulkFundingDialogProps) {
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const { sendTokens, isLoading } = useSendTokensToVesting();

  // Get unfunded contracts
  const unfundedContracts = vestingContracts.filter((contract) => {
    const { hassufficientBalance } = useVestingContractBalance(
      tokenAddress,
      contract.address
    );
    return !hassufficientBalance;
  });

  const handleSelectContract = (contractAddress: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts((prev) => [...prev, contractAddress]);
    } else {
      setSelectedContracts((prev) =>
        prev.filter((addr) => addr !== contractAddress)
      );
    }
  };

  const handleFundSelected = async () => {
    for (const contractAddress of selectedContracts) {
      const contract = vestingContracts.find(
        (c) => c.address === contractAddress
      );
      if (contract) {
        try {
          await sendTokens(tokenAddress, contractAddress, contract.totalAmount);
        } catch (error) {
          console.error(`Failed to fund contract ${contractAddress}:`, error);
        }
      }
    }
  };

  const totalAmount = selectedContracts.reduce((sum, contractAddress) => {
    const contract = vestingContracts.find(
      (c) => c.address === contractAddress
    );
    return sum + (contract ? contract.totalAmount : 0n);
  }, 0n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Fund Vesting Contracts</DialogTitle>
          <DialogDescription>
            Select unfunded vesting contracts to fund with {tokenSymbol} tokens.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {unfundedContracts.map((contract) => (
              <VestingContractItem
                key={contract.address}
                contract={contract}
                tokenSymbol={tokenSymbol}
                onSelect={handleSelectContract}
                isSelected={selectedContracts.includes(contract.address)}
              />
            ))}
          </div>
        </ScrollArea>

        {selectedContracts.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span>
                Total Amount: {formatEther(totalAmount)} {tokenSymbol}
              </span>
              <Button onClick={handleFundSelected} disabled={isLoading}>
                {isLoading
                  ? "Funding..."
                  : `Fund ${selectedContracts.length} Contracts`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VestingContractItem({
  contract,
  tokenSymbol,
  onSelect,
  isSelected,
}: {
  contract: VestingContract;
  tokenSymbol: string;
  onSelect: (address: string, checked: boolean) => void;
  isSelected: boolean;
}) {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(contract.address, !!checked)}
      />
      <div className="flex-1">
        <div className="font-medium">{contract.beneficiary}</div>
        <div className="text-sm text-muted-foreground">
          {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">
          {formatEther(contract.totalAmount)} {tokenSymbol}
        </div>
        <div className="text-sm text-muted-foreground">Required</div>
      </div>
    </div>
  );
}
