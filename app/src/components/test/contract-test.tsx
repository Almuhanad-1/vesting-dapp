// src/components/test/contract-test.tsx (NEW)
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, TOKEN_VESTING_FACTORY_ABI } from '@/lib/web3/config'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

export function ContractTest() {
  const [testResult, setTestResult] = useState<string>('')

  // Test reading from contract
  const { data: implementations, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: 'getImplementations',
  })

  const { data: batchCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
    abi: TOKEN_VESTING_FACTORY_ABI,
    functionName: 'batchCounter',
  })

  const runTest = () => {
    if (implementations && batchCounter !== undefined) {
      setTestResult('✅ Contract connection successful!')
    } else if (error) {
      setTestResult(`❌ Contract error: ${error.message}`)
    } else {
      setTestResult('⏳ Testing contract connection...')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Contract Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Factory Address</div>
            <div className="font-mono text-sm">{CONTRACT_ADDRESSES.FACTORY}</div>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm text-muted-foreground">Connection Status</div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Connecting...</span>
                </>
              ) : error ? (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Error</span>
                </>
              ) : implementations ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Unknown</span>
                </>
              )}
            </div>
          </div>
        </div>

        {implementations && (
          <div className="space-y-2">
            <h4 className="font-semibold">Contract Data:</h4>
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <div>Token Implementation: <code className="text-xs">{implementations[0]}</code></div>
                <div>Vesting Implementation: <code className="text-xs">{implementations[1]}</code></div>
                <div>Batch Counter: {batchCounter?.toString()}</div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-800">
              <strong>Error:</strong> {error.message}
            </div>
          </div>
        )}

        <Button onClick={runTest} className="w-full">
          Test Contract Connection
        </Button>

        {testResult && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">{testResult}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}