// src/lib/web3/config.ts
import { http, createConfig } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

// Create wagmi config using RainbowKit's getDefaultConfig
export const config = getDefaultConfig({
  appName: "Token Vesting DApp",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [sepolia, mainnet],
  ssr: true, // If using SSR
});

// Export chains separately for RainbowKit
export const chains = [sepolia, mainnet];

// Contract addresses
export const CONTRACT_ADDRESSES = {
  FACTORY:
    process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS ||
    "0x1121C77E3AcC2281982AD91c53702A71E56d6Cd2",
} as const;

// Chain configuration
export const SUPPORTED_CHAINS = {
  [sepolia.id]: {
    name: "Sepolia Testnet",
    explorer: "https://sepolia.etherscan.io",
    rpc: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  },
  [mainnet.id]: {
    name: "Ethereum Mainnet",
    explorer: "https://etherscan.io",
    rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
  },
} as const;

// Default chain
export const DEFAULT_CHAIN = sepolia;

// Contract ABIs
export const TOKEN_VESTING_FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deployTokenWithVesting",
    inputs: [
      {
        name: "tokenConfig",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "owner", type: "address" },
        ],
      },
      {
        name: "vestingConfigs",
        type: "tuple[]",
        components: [
          { name: "beneficiary", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "cliff", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "revocable", type: "bool" },
        ],
      },
    ],
    outputs: [
      { name: "token", type: "address" },
      { name: "vestingContracts", type: "address[]" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "batchDeployTokens",
    inputs: [
      {
        name: "tokenConfigs",
        type: "tuple[]",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "totalSupply", type: "uint256" },
          { name: "owner", type: "address" },
        ],
      },
      {
        name: "vestingConfigsArray",
        type: "tuple[][]",
        components: [
          { name: "beneficiary", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "cliff", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "revocable", type: "bool" },
        ],
      },
    ],
    outputs: [
      { name: "batchId", type: "bytes32" },
      { name: "tokens", type: "address[]" },
      { name: "vestingContractsArray", type: "address[][]" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getTokenVestingContracts",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isDeployedToken",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TokenDeployed",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "totalSupply", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VestingDeployed",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "vestingContract", type: "address", indexed: true },
      { name: "beneficiary", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "cliff", type: "uint256", indexed: false },
      { name: "duration", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchDeploymentCreated",
    inputs: [
      { name: "batchId", type: "bytes32", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "tokenCount", type: "uint256", indexed: false },
      { name: "totalVestingSchedules", type: "uint256", indexed: false },
    ],
  },
] as const;

export const TOKEN_VESTING_ABI = [
  {
    type: "function",
    name: "initialize",
    inputs: [
      { name: "_token", type: "address" },
      { name: "_beneficiary", type: "address" },
      { name: "_totalAmount", type: "uint256" },
      { name: "_cliff", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_revocable", type: "bool" },
      { name: "_owner", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "release",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revoke",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "releasableAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vestedAmount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVestingInfo",
    inputs: [],
    outputs: [
      { name: "_token", type: "address" },
      { name: "_beneficiary", type: "address" },
      { name: "_totalAmount", type: "uint256" },
      { name: "_released", type: "uint256" },
      { name: "_cliff", type: "uint256" },
      { name: "_start", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_revocable", type: "bool" },
      { name: "_revoked", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVestingStatus",
    inputs: [],
    outputs: [
      { name: "_vestedAmount", type: "uint256" },
      { name: "_releasableAmount", type: "uint256" },
      { name: "_remainingAmount", type: "uint256" },
      { name: "_timeElapsed", type: "uint256" },
      { name: "_timeRemaining", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasStarted",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cliffEnded",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasEnded",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "TokensReleased",
    inputs: [
      { name: "beneficiary", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VestingRevoked",
    inputs: [
      { name: "beneficiary", type: "address", indexed: true },
      { name: "unreleased", type: "uint256", indexed: false },
    ],
  },
] as const;

export const VESTED_TOKEN_ABI = [
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;
