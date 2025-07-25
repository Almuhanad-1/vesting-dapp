// Client-side hooks - NO Prisma imports!
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'

interface DeploymentData {
  tokenAddress: string
  name: string
  symbol: string
  totalSupply: string
  ownerAddress: string
  transactionHash: string
  deployedAt: Date
}

// Hook to save deployment (calls API, not Prisma directly)
export function useSaveDeployment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: DeploymentData) => {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save deployment')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] })
    },
  })
}

// Hook to get user's deployments (calls API, not Prisma)
export function useUserDeployments() {
  const { address } = useAccount()
  
  return useQuery({
    queryKey: ['deployments', address],
    queryFn: async () => {
      if (!address) return []
      
      const response = await fetch(`/api/deployments?owner=${address}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch deployments')
      }
      
      return response.json()
    },
    enabled: !!address,
  })
}
