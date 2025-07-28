// app/src/components/deploy/PostDeploymentActions.tsx (NEW COMPONENT)
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { BulkFundingDialog } from "../vesting/BulkFundingDialog";

interface PostDeploymentActionsProps {
  deploymentResult: {
    tokenAddress: string;
    vestingContracts: string[];
    transactionHash: string;
  };
  tokenConfig: {
    name: string;
    symbol: string;
  };
  beneficiaries: Array<{
    address: string;
    amount: string;
  }>;
  userAddress: string;
}

export function PostDeploymentActions({
  deploymentResult,
  tokenConfig,
  beneficiaries,
  userAddress,
}: PostDeploymentActionsProps) {
  const [showFundDialog, setShowFundDialog] = useState(false);

  const vestingContracts = deploymentResult.vestingContracts.map(
    (address, index) => ({
      address,
      beneficiary: beneficiaries[index]?.address || "Unknown",
      totalAmount: BigInt(beneficiaries[index]?.amount || "0"),
    })
  );

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Token and vesting contracts deployed successfully!
        </AlertDescription>
      </Alert>

      {/* Important Next Step */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">⚠️ Important: Fund Vesting Contracts</p>
            <p>
              Your vesting contracts have been created but need to be funded
              with {tokenConfig.symbol} tokens before beneficiaries can claim.
              This is a required step.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <Button
              onClick={() => setShowFundDialog(true)}
              className="w-full"
              size="lg"
            >
              1. Fund All Vesting Contracts
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a
                href={`https://sepolia.etherscan.io/tx/${deploymentResult.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                2. View Transaction on Etherscan
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a href="/dashboard">3. Go to Dashboard</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Token Address:</span>
              <span className="font-mono">{deploymentResult.tokenAddress}</span>
            </div>
            <div className="flex justify-between">
              <span>Vesting Contracts:</span>
              <span>{deploymentResult.vestingContracts.length} created</span>
            </div>
            <div className="flex justify-between">
              <span>Total Beneficiaries:</span>
              <span>{beneficiaries.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Funding Dialog */}
      <BulkFundingDialog
        open={showFundDialog}
        onOpenChange={setShowFundDialog}
        tokenAddress={deploymentResult.tokenAddress}
        tokenSymbol={tokenConfig.symbol}
        vestingContracts={vestingContracts}
        userAddress={userAddress}
      />
    </div>
  );
}
