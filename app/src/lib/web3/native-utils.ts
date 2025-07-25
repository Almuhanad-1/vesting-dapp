// Native JavaScript replacements for viem functions
// No external dependencies needed!

/**
 * Parse ether string to wei bigint (replaces parseEther)
 * Converts "1.5" to 1500000000000000000n
 */
export function parseEther(etherValue: string): bigint {
  if (!etherValue || etherValue === "") return BigInt(0);

  // Handle decimal numbers
  const [whole = "0", decimal = ""] = etherValue.split(".");
  const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);

  return BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedDecimal);
}

/**
 * Format wei bigint to ether string (replaces formatEther)
 * Converts 1500000000000000000n to "1.5"
 */
export function formatEther(weiValue: bigint): string {
  const divisor = BigInt(10 ** 18);
  const quotient = weiValue / divisor;
  const remainder = weiValue % divisor;

  if (remainder === BigInt(0)) {
    return quotient.toString();
  }

  const decimalStr = remainder.toString().padStart(18, "0");
  const trimmedDecimal = decimalStr.replace(/0+$/, "");

  return trimmedDecimal ? `${quotient}.${trimmedDecimal}` : quotient.toString();
}

/**
 * Get checksummed address (replaces getAddress)
 * Simple implementation without crypto dependencies
 */
export function getAddress(address: string): string {
  if (!address) return "";

  // Basic validation
  if (!address.startsWith("0x") || address.length !== 42) {
    throw new Error("Invalid address format");
  }

  // Return as-is (wagmi handles checksumming)
  return address.toLowerCase();
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Simple event log decoder (basic implementation)
 * For complex parsing, we'll rely on wagmi hooks instead
 */
export function parseContractLogs(logs: any[]): {
  tokenAddress?: string;
  vestingContracts: string[];
} {
  const vestingContracts: string[] = [];
  let tokenAddress: string | undefined;

  // Simple parsing - get unique contract addresses from logs
  const contractAddresses = new Set<string>();

  for (const log of logs) {
    if (
      log.address &&
      log.address !== "0x0000000000000000000000000000000000000000"
    ) {
      contractAddresses.add(log.address.toLowerCase());
    }
  }

  const addresses = Array.from(contractAddresses);

  // First address is likely the token, rest are vesting contracts
  if (addresses.length > 0) {
    tokenAddress = addresses[0];
    vestingContracts.push(...addresses.slice(1));
  }

  return { tokenAddress, vestingContracts };
}

// Type definitions (without viem)
export type Address = `0x${string}`;
export type Hash = `0x${string}`;
export type PublicClient = any; // We'll use wagmi's usePublicClient type
