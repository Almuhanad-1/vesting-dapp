// Client-side hooks with Drizzle types - much lighter!
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import type { DeployedToken } from '@/lib/drizzle/schema';

interface DeploymentData {
  tokenAddress: string;
  name: string;
  symbol: string;
  totalSupply: string;
  ownerAddress: string;
  transactionHash: string;
  deployedAt: Date;
}

// Hook to save deployment
export function useSaveDeployment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: DeploymentData) => {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save deployment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
}

// Hook to get user's deployments
export function useUserDeployments() {
  const { address } = useAccount();
  
  return useQuery({
    queryKey: ['deployments', address],
    queryFn: async (): Promise<DeployedToken[]> => {
      if (!address) return [];
      
      const response = await fetch(`/api/deployments?owner=${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deployments');
      }
      
      return response.json();
    },
    enabled: !!address,
  });
}
