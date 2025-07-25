// src/components/deploy/steps/review-deploy-step.tsx (FIXED VERSION)
"use client";

import React, { useState, useEffect } from "react";
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
import { useDeployTokenWithVesting } from "@/lib/hooks/useTokenVestingFactory";
import { parseEther } from "viem";
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
  } = useDeploymentStore();

  // Use the FIXED hook with real address parsing
  const {
    deployToken,
    deploymentResult,
    isLoading,
    isParsingAddresses,
    error,
    isSuccess,
    reset: resetDeployment,
  } = useDeployTokenWithVesting();

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
    !isLoading;

  // FIXED: Real deployment function
  const handleDeploy = async () => {
    if (!canDeploy || !tokenConfig || !address) return;

    try {
      setDeploying(true);
      resetDeployment();

      // Prepare contract parameters
      const tokenParams = {
        name: tokenConfig.name,
        symbol: tokenConfig.symbol,
        totalSupply: parseEther(tokenConfig.totalSupply),
        owner: address as `0x${string}`,
      };

      const vestingParams = beneficiaries.map((beneficiary) => {
        const schedule = vestingSchedules.find(
          (s) => s.category === beneficiary.category
        )!;
        return {
          beneficiary: beneficiary.address as `0x${string}`,
          amount: parseEther(beneficiary.amount),
          cliff: BigInt(schedule.cliffMonths * 30 * 24 * 60 * 60),
          duration: BigInt(schedule.vestingMonths * 30 * 24 * 60 * 60),
          revocable: schedule.revocable,
        };
      });

      console.log("Deploying contracts...", { tokenParams, vestingParams });

      // Deploy to blockchain - this will now parse REAL addresses
      await deployToken(tokenParams, vestingParams);

      toast({
        title: "Deployment initiated",
        description:
          "Your token deployment transaction has been submitted to the blockchain.",
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

  // FIXED: Handle successful deployment with REAL addresses
  useEffect(() => {
    if (isSuccess && deploymentResult) {
      console.log(
        "Deployment successful with real addresses:",
        deploymentResult
      );

      // Save the REAL deployment result
      setDeploymentResult({
        tokenAddress: deploymentResult.tokenAddress,
        vestingContracts: deploymentResult.vestingContracts,
        transactionHash: deploymentResult.transactionHash,
        deployedAt: new Date(),
      });

      setDeploying(false);

      toast({
        title: "Deployment completed!",
        description:
          "Your token has been deployed successfully with real contract addresses.",
      });

      onNext();
    }
  }, [
    isSuccess,
    deploymentResult,
    setDeploymentResult,
    setDeploying,
    onNext,
    toast,
  ]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Deployment error:", error);
      setDeploymentError(error);
      setDeploying(false);
    }
  }, [error, setDeploymentError, setDeploying]);

  const getStatusMessage = () => {
    if (isParsingAddresses) return "Parsing contract addresses...";
    if (isLoading) return "Deploying to blockchain...";
    return "Ready to deploy";
  };

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
          {/* Status Display */}
          {(isLoading || isParsingAddresses) && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">
                  {getStatusMessage()}
                </div>
                <div className="text-sm text-blue-600">
                  {isParsingAddresses
                    ? "Extracting contract addresses from blockchain..."
                    : "Please wait for transaction confirmation..."}
                </div>
              </div>
            </div>
          )}

          {/* Rest of your existing validation checks and UI */}
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

          {/* Confirmation checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-details"
                checked={confirmedDetails}
                onCheckedChange={(checked) =>
                  setConfirmedDetails(checked === true)
                }
                disabled={isLoading}
              />
              <label htmlFor="confirm-details" className="text-sm font-medium">
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
                disabled={isLoading}
              />
              <label htmlFor="agree-terms" className="text-sm font-medium">
                I understand that smart contract deployments are irreversible
                and agree to the terms
              </label>
            </div>
          </div>

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Deployment failed: {error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleDeploy}
          disabled={!canDeploy}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isParsingAddresses ? "Parsing Addresses..." : "Deploying..."}
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
