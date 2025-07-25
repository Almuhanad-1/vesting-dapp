// src/components/deploy/steps/review-deploy-step.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { useAccount } from "wagmi";
import { useDeploymentStore } from "@/store/deployment-store";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Coins,
  Users,
  Clock,
  Shield,
  Loader2,
  FileText,
  Calculator,
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { formatDuration, parseTokenAmount } from "@/lib/web3/utils";
import { useDeployTokenWithVesting } from "@/lib/hooks/useTokenVestingFactory";

interface ReviewAndDeployStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export function ReviewAndDeployStep({
  onNext,
  onPrevious,
}: ReviewAndDeployStepProps) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState(false);

  const {
    tokenConfig,
    vestingSchedules,
    beneficiaries,
    setDeploying,
    setDeploymentResult,
    setDeploymentError,
    isDeploying,
  } = useDeploymentStore();

  const { deployToken, isLoading, error } = useDeployTokenWithVesting();

  // Calculate totals and validation
  const totalAllocation = beneficiaries.reduce(
    (sum, beneficiary) => sum + parseFloat(beneficiary.amount),
    0
  );

  const totalSupply = parseFloat(tokenConfig?.totalSupply || "0");
  const allocationPercentage =
    totalSupply > 0 ? (totalAllocation / totalSupply) * 100 : 0;

  const categoryBreakdown = beneficiaries.reduce((acc, beneficiary) => {
    const category = beneficiary.category;
    if (!acc[category]) {
      acc[category] = { count: 0, amount: 0 };
    }
    acc[category].count += 1;
    acc[category].amount += parseFloat(beneficiary.amount);
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  // Validation checks
  const validationChecks = [
    {
      id: "wallet-connected",
      label: "Wallet Connected",
      passed: !!address,
      message: address
        ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
        : "Please connect your wallet",
    },
    {
      id: "token-config",
      label: "Token Configuration",
      passed: !!(
        tokenConfig?.name &&
        tokenConfig?.symbol &&
        tokenConfig?.totalSupply
      ),
      message: tokenConfig
        ? `${tokenConfig.name} (${tokenConfig.symbol})`
        : "Token configuration incomplete",
    },
    {
      id: "vesting-schedules",
      label: "Vesting Schedules",
      passed: vestingSchedules.length > 0,
      message: `${vestingSchedules.length} schedule(s) created`,
    },
    {
      id: "beneficiaries",
      label: "Beneficiaries",
      passed: beneficiaries.length > 0,
      message: `${beneficiaries.length} beneficiary(ies) added`,
    },
    {
      id: "allocation-check",
      label: "Token Allocation",
      passed: allocationPercentage <= 100,
      message:
        allocationPercentage <= 100
          ? `${allocationPercentage.toFixed(1)}% of total supply allocated`
          : `Over-allocated: ${allocationPercentage.toFixed(
              1
            )}% of total supply`,
    },
  ];

  const canDeploy =
    validationChecks.every((check) => check.passed) &&
    agreedToTerms &&
    confirmedDetails &&
    !isDeploying &&
    !isLoading;

  const handleDeploy = async () => {
    if (!canDeploy || !tokenConfig || !address) return;

    try {
      setDeploying(true);

      // Prepare contract parameters
      const tokenParams = {
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        totalSupply: parseTokenAmount(tokenConfig.totalSupply),
        owner: address,
      };

      const vestingParams = beneficiaries.map((beneficiary) => {
        const schedule = vestingSchedules.find(
          (s) => s.category === beneficiary.category
        )!;
        return {
          beneficiary: beneficiary.address,
          amount: parseTokenAmount(beneficiary.amount),
          cliff: schedule.cliffMonths * 30 * 24 * 60 * 60, // Convert months to seconds
          duration: schedule.vestingMonths * 30 * 24 * 60 * 60,
          revocable: schedule.revocable,
        };
      });

      // Deploy the contracts
      deployToken(tokenParams, vestingParams);

      toast({
        title: "Deployment initiated",
        description: "Your token deployment transaction has been submitted.",
      });
    } catch (deployError) {
      console.error("Deployment failed:", deployError);
      setDeploymentError(
        deployError instanceof Error ? deployError.message : "Deployment failed"
      );
      setDeploying(false);

      toast({
        title: "Deployment failed",
        description: "Failed to deploy token contracts. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle successful deployment
  useEffect(() => {
    if (!isLoading && !error) {
      // This would be triggered by the successful transaction
      // You might want to listen to the transaction receipt here
      // For now, we'll simulate success after a delay
      setTimeout(() => {
        setDeploymentResult({
          tokenAddress: "0x1234567890123456789012345678901234567890", // This would come from the actual transaction
          vestingContracts: ["0x2345678901234567890123456789012345678901"], // This would come from events
          transactionHash:
            "0x3456789012345678901234567890123456789012345678901234567890123456", // Actual tx hash
          deployedAt: new Date(),
        });
        onNext();
      }, 3000); // Simulate 3 second deployment time
    }
  }, [deployToken, isLoading, error, setDeploymentResult, onNext]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Review & Deploy
          </CardTitle>
          <CardDescription>
            Review your configuration and deploy your token with vesting
            contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Checks */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Pre-deployment Validation
            </h3>
            <div className="space-y-2">
              {validationChecks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {check.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{check.label}</span>
                  </div>
                  <span
                    className={`text-sm ${
                      check.passed ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Token Configuration Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Token Name
                  </div>
                  <div className="font-medium">
                    {tokenConfig?.name || "N/A"}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Symbol</div>
                  <div className="font-medium">
                    {tokenConfig?.symbol || "N/A"}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Supply
                  </div>
                  <div className="font-medium">
                    {totalSupply.toLocaleString()}
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Decimals</div>
                  <div className="font-medium">
                    {tokenConfig?.decimals || 18}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Vesting Schedules Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Vesting Schedules ({vestingSchedules.length})
            </h3>
            <div className="space-y-3">
              {vestingSchedules.map((schedule, index) => (
                <div key={schedule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{schedule.category}</Badge>
                    {schedule.revocable && (
                      <Badge variant="outline">Revocable</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliff:</span>
                      <p className="font-medium">
                        {formatDuration(
                          schedule.cliffMonths * 30 * 24 * 60 * 60
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vesting:</span>
                      <p className="font-medium">
                        {formatDuration(
                          schedule.vestingMonths * 30 * 24 * 60 * 60
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Beneficiaries:
                      </span>
                      <p className="font-medium">
                        {categoryBreakdown[schedule.category]?.count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Allocation Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Token Allocation Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Beneficiaries
                </div>
                <div className="text-2xl font-bold">{beneficiaries.length}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  Total Allocated
                </div>
                <div className="text-2xl font-bold">
                  {totalAllocation.toLocaleString()}
                </div>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  allocationPercentage <= 100 ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="text-sm text-muted-foreground">
                  Allocation Percentage
                </div>
                <div
                  className={`text-2xl font-bold ${
                    allocationPercentage <= 100
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {allocationPercentage.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-2">
              <h4 className="font-medium">Allocation by Category</h4>
              {Object.entries(categoryBreakdown).map(([category, data]) => (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({data.count} beneficiaries)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {data.amount.toLocaleString()} tokens
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {((data.amount / totalSupply) * 100).toFixed(1)}% of
                      supply
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Warnings and Confirmations */}
          <div className="space-y-4">
            {allocationPercentage > 100 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: You have allocated more tokens than the total supply.
                  Please adjust your beneficiary amounts before deploying.
                </AlertDescription>
              </Alert>
            )}

            {allocationPercentage < 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Note: You have only allocated{" "}
                  {allocationPercentage.toFixed(1)}% of your total token supply.
                  The remaining tokens will be minted to the owner address.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-details"
                  checked={confirmedDetails}
                  onCheckedChange={(checked) =>
                    setConfirmedDetails(checked === true)
                  }
                />
                <label
                  htmlFor="confirm-details"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have reviewed all configuration details and they are correct
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked === true)
                  }
                />
                <label
                  htmlFor="agree-terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand that smart contract deployments are irreversible
                  and agree to the terms
                </label>
              </div>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Deployment failed: {error.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isDeploying || isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleDeploy}
          disabled={!canDeploy}
          className="flex items-center gap-2"
        >
          {isDeploying || isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Deploy Contracts
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
