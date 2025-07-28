// app/src/components/dashboard/AdminTokenManagement.tsx (NEW COMPONENT)
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccount } from "wagmi";
import { useUserData } from "@/lib/hooks/use-token-data";
import { useVestingContractBalance } from "@/lib/hooks/useTokenFunding";
import { BulkFundingDialog } from "../vesting/BulkFundingDialog";
import { FundContractDialog } from "../vesting/FundContractDialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertTriangle, CheckCircle, DollarSign, Users } from "lucide-react";
import { formatEther } from "viem";

export function AdminTokenManagement() {
  const [showBulkFunding, setShowBulkFunding] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { address } = useAccount();
  const { data: userData, isLoading } = useUserData();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const ownedTokens =
    userData?.deployedTokens?.filter(
      (token: any) =>
        token.ownerAddress.toLowerCase() === address?.toLowerCase()
    ) || [];

  if (ownedTokens.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No tokens to manage</p>
          <p className="text-sm text-muted-foreground">
            Deploy a token to access management features
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Token Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage funding and vesting for your deployed tokens
          </p>
        </CardContent>
      </Card>

      {ownedTokens.map((token: any) => (
        <TokenManagementCard
          key={token.address}
          token={token}
          onShowBulkFunding={() => {
            setSelectedToken(token.address);
            setShowBulkFunding(true);
          }}
        />
      ))}

      {/* Bulk Funding Dialog */}
      {selectedToken && (
        <BulkFundingDialog
          open={showBulkFunding}
          onOpenChange={setShowBulkFunding}
          tokenAddress={selectedToken}
          tokenSymbol={
            ownedTokens.find((t: any) => t.address === selectedToken)?.symbol ||
            "TOKEN"
          }
          vestingContracts={
            ownedTokens
              .find((t: any) => t.address === selectedToken)
              ?.vestingSchedules?.map((schedule: any) => ({
                address: schedule.contractAddress,
                beneficiary: schedule.beneficiaryAddress,
                totalAmount: BigInt(schedule.totalAmount),
              })) || []
          }
          userAddress={address!}
        />
      )}
    </div>
  );
}

function TokenManagementCard({
  token,
  onShowBulkFunding,
}: {
  token: any;
  onShowBulkFunding: () => void;
}) {
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [selectedVestingContract, setSelectedVestingContract] = useState<
    string | null
  >(null);
  const { address } = useAccount();

  // Calculate funding status for all vesting contracts
  const vestingStatuses =
    token.vestingSchedules?.map((schedule: any) => {
      const { hassufficientBalance, shortfall } = useVestingContractBalance(
        token.address,
        schedule.contractAddress
      );
      return {
        ...schedule,
        hassufficientBalance,
        shortfall,
      };
    }) || [];

  const unfundedCount = vestingStatuses.filter(
    (s: any) => !s.hassufficientBalance
  ).length;
  const totalShortfall = vestingStatuses.reduce(
    (sum: any, status: any) => sum + (status.shortfall || 0n),
    0n
  );

  const handleFundContract = (vestingContractAddress: string) => {
    setSelectedVestingContract(vestingContractAddress);
    setShowFundDialog(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              {token.name} ({token.symbol})
              {unfundedCount > 0 ? (
                <Badge variant="destructive">{unfundedCount} Unfunded</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800">
                  All Funded
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {token.vestingSchedules?.length || 0} vesting contracts
            </p>
          </div>
          <div className="text-right">
            <Button
              onClick={onShowBulkFunding}
              disabled={unfundedCount === 0}
              size="sm"
            >
              Fund All Contracts
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Alert */}
        {unfundedCount > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {unfundedCount} vesting contracts need funding. Total shortfall:{" "}
              {formatEther(totalShortfall)} {token.symbol}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ All vesting contracts are properly funded
            </AlertDescription>
          </Alert>
        )}

        {/* Vesting Contracts List */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vesting Contracts
          </h4>
          <div className="space-y-2">
            {vestingStatuses.map((schedule: any) => (
              <VestingContractRow
                key={schedule.contractAddress}
                schedule={schedule}
                tokenSymbol={token.symbol}
                onFund={() => handleFundContract(schedule.contractAddress)}
              />
            ))}
          </div>
        </div>

        {/* Individual Fund Dialog */}
        {selectedVestingContract && address && (
          <FundContractDialog
            open={showFundDialog}
            onOpenChange={(open) => {
              setShowFundDialog(open);
              if (!open) setSelectedVestingContract(null);
            }}
            tokenAddress={token.address}
            vestingContractAddress={selectedVestingContract}
            tokenSymbol={token.symbol}
            userAddress={address}
          />
        )}
      </CardContent>
    </Card>
  );
}

function VestingContractRow({
  schedule,
  tokenSymbol,
  onFund,
}: {
  schedule: any;
  tokenSymbol: string;
  onFund: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="font-medium">
          {schedule.beneficiaryAddress.slice(0, 8)}...
          {schedule.beneficiaryAddress.slice(-6)}
        </div>
        <div className="text-sm text-muted-foreground">
          {parseFloat(schedule.totalAmount).toLocaleString()} {tokenSymbol}{" "}
          total
        </div>
      </div>
      <div className="flex items-center gap-3">
        {schedule.hassufficientBalance ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Funded
          </Badge>
        ) : (
          <>
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Needs {schedule.shortfall
                ? formatEther(schedule.shortfall)
                : "0"}{" "}
              {tokenSymbol}
            </Badge>
            <Button size="sm" variant="outline" onClick={onFund}>
              Fund
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
