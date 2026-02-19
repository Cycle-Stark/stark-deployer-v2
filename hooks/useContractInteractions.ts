import { useState, useCallback } from 'react'
import { IContractInteraction } from '@/types/contracts'
import { contractInteractionService } from '@/services/contractInteractionService'
import { notifications } from '@mantine/notifications'
import { RpcProvider } from 'starknet'
import { ICallDataItem } from '@/types'

interface UseContractInteractionsProps {
    contractId: number
    contractAddress: string
    abi: any[]
    provider?: RpcProvider
    account?: any
}

export const useContractInteractions = ({
    contractId,
    contractAddress,
    abi,
    provider,
    account
}: UseContractInteractionsProps) => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const executeReadFunction = useCallback(async (
        functionName: string,
        callDataItems: ICallDataItem[],
        executedBy?: string
    ) => {
        if (!provider) {
            throw new Error('Provider is required for read functions')
        }

        setLoading(true)
        setError(null)

        try {
            const result = await contractInteractionService.executeReadFunction(
                contractId,
                contractAddress,
                abi,
                functionName,
                callDataItems,
                provider,
                executedBy
            )

            notifications.show({
                title: 'Success',
                message: `Function ${functionName} executed successfully`,
                color: 'teal',
            })

            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            
            notifications.show({
                title: 'Error',
                message: `Failed to execute ${functionName}: ${errorMessage}`,
                color: 'red',
            })
            
            throw err
        } finally {
            setLoading(false)
        }
    }, [contractId, contractAddress, abi, provider])

    const executeWriteFunction = useCallback(async (
        functionName: string,
        callDataItems: ICallDataItem[],
        executedBy?: string
    ) => {
        if (!account) {
            throw new Error('Account is required for write functions')
        }

        setLoading(true)
        setError(null)

        try {
            const result = await contractInteractionService.executeWriteFunction(
                contractId,
                contractAddress,
                abi,
                functionName,
                callDataItems,
                account,
                executedBy
            )

            notifications.show({
                title: 'Transaction Submitted',
                message: `Function ${functionName} transaction submitted: ${result.transactionHash}`,
                color: 'blue',
            })

            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            
            notifications.show({
                title: 'Error',
                message: `Failed to execute ${functionName}: ${errorMessage}`,
                color: 'red',
            })
            
            throw err
        } finally {
            setLoading(false)
        }
    }, [contractId, contractAddress, abi, account])

    const saveInteraction = useCallback(async (
        interaction: Omit<IContractInteraction, 'id' | 'timestamp'>
    ) => {
        try {
            return await contractInteractionService.saveInteraction(interaction)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            
            notifications.show({
                title: 'Error',
                message: `Failed to save interaction: ${errorMessage}`,
                color: 'red',
            })
            
            throw err
        }
    }, [])

    const replayInteraction = useCallback(async (interactionId: number) => {
        setLoading(true)
        setError(null)

        try {
            const result = await contractInteractionService.replayInteraction(interactionId)
            
            notifications.show({
                title: 'Success',
                message: 'Interaction replayed successfully',
                color: 'teal',
            })

            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            
            notifications.show({
                title: 'Error',
                message: `Failed to replay interaction: ${errorMessage}`,
                color: 'red',
            })
            
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    const getStats = useCallback(async () => {
        try {
            return await contractInteractionService.getInteractionStats(contractId)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMessage)
            throw err
        }
    }, [contractId])

    return {
        loading,
        error,
        executeReadFunction,
        executeWriteFunction,
        saveInteraction,
        replayInteraction,
        getStats,
    }
}
