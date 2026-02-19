import { ICallDataItem, IContractInteraction } from '@/types'
import { contractInteractionsManager } from '@/storage/contractInteractionsDatabase'
import { Contract, Event, RpcProvider, num } from 'starknet'
import { InteractionStatus } from '@/types/contracts'
import { notifications } from '@mantine/notifications'
import { serializeBigInt } from '@/components/utils'
import BigNumber from 'bignumber.js'

/**
 * Convert an actual_fee object ({ amount: "0x...", unit: "FRI"|"WEI" }) to a
 * human-readable string like "0.050645 STRK" or "0.000123 ETH".
 * Returns an empty string when the input is not usable.
 */
function formatActualFee(actualFee: any): string {
    if (!actualFee) return ''
    try {
        const hexAmount = typeof actualFee === 'object' ? actualFee.amount : actualFee
        if (!hexAmount) return ''
        const decimal = new BigNumber(num.hexToDecimalString(hexAmount.toString()))
        const DECIMALS_18 = new BigNumber(10).pow(18)
        const converted = decimal.dividedBy(DECIMALS_18)
        const unit = actualFee?.unit === 'FRI' ? 'STRK' : 'ETH'
        return `${converted.toFixed(6)} ${unit}`
    } catch {
        return ''
    }
}

export interface MonitorTransactionOptions {
    interactionId: number
    transactionHash: string
    provider: RpcProvider
    functionName: string
    actualContract?: Contract
    onSettled?: (result: { status: InteractionStatus; receipt?: any; events?: any[] }) => void
}

export class ContractInteractionService {
    private static instance: ContractInteractionService
    
    private constructor() {}
    
    static getInstance(): ContractInteractionService {
        if (!ContractInteractionService.instance) {
            ContractInteractionService.instance = new ContractInteractionService()
        }
        return ContractInteractionService.instance
    }

    /**
     * Save a contract interaction to the database
     */
    async saveInteraction(interaction: Omit<IContractInteraction, 'id' | 'timestamp'>): Promise<number> {
        try {
            const interactionWithTimestamp = {
                ...interaction,
                timestamp: new Date(),
            }
            
            return await contractInteractionsManager.create(interactionWithTimestamp)
        } catch (error) {
            console.error('Failed to save interaction:', error)
            throw error
        }
    }

    /**
     * Execute a read function call and save the interaction
     */
    async executeReadFunction(
        contractId: number,
        contractAddress: string,
        abi: any[],
        functionName: string,
        callDataItems: ICallDataItem[],
        provider: RpcProvider,
        executedBy?: string
    ): Promise<{ result: any; interactionId: number }> {
        let interactionId: number | null = null
        
        try {
            // Prepare call data
            const rawCallData = this.prepareCallData(callDataItems)
            
            // Create interaction record (pending)
            interactionId = await this.saveInteraction({
                contractId,
                functionName,
                functionType: 'read',
                rawCallData,
                callDataItems,
                status: 'pending',
                executedBy,
            })

            // Create contract instance
            const contract = new Contract({abi, address: contractAddress, providerOrAccount: provider})
            
            // Execute the call
            const result = await contract.call(functionName, rawCallData)
            
            // Update interaction with success
            await contractInteractionsManager.update(interactionId, {
                status: 'success',
                response: result,
            })

            return { result, interactionId }
        } catch (error) {
            console.error('Read function execution failed:', error)
            
            // Update interaction with failure if we have an ID
            if (interactionId) {
                await contractInteractionsManager.update(interactionId, {
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                })
            }
            
            throw error
        }
    }

    /**
     * Execute a write function (invoke) and save the interaction
     */
    async executeWriteFunction(
        contractId: number,
        contractAddress: string,
        abi: any[],
        functionName: string,
        callDataItems: ICallDataItem[],
        account: any, // StarkNet account
        executedBy?: string
    ): Promise<{ transactionHash: string; interactionId: number }> {
        let interactionId: number | null = null
        
        try {
            // Prepare call data
            const rawCallData = this.prepareCallData(callDataItems)
            
            // Create interaction record (pending)
            interactionId = await this.saveInteraction({
                contractId,
                functionName,
                functionType: 'write',
                rawCallData,
                callDataItems,
                status: 'pending',
                executedBy,
            })

            // Create contract instance
            const contract = new Contract({abi, address: contractAddress, providerOrAccount: account})
            
            // Execute the invoke
            const invokeResult = await contract.invoke(functionName, rawCallData)
            const transactionHash = invokeResult.transaction_hash
            
            // Update interaction with transaction hash
            await contractInteractionsManager.update(interactionId, {
                transactionHash,
            })

            // Wait for transaction confirmation (optional - can be done in background)
            this.waitForTransactionConfirmation(interactionId, transactionHash, account.provider)
                .catch(error => console.error('Transaction confirmation failed:', error))

            return { transactionHash, interactionId }
        } catch (error) {
            console.error('Write function execution failed:', error)
            
            // Update interaction with failure if we have an ID
            if (interactionId) {
                await contractInteractionsManager.update(interactionId, {
                    status: 'failed',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                })
            }
            
            throw error
        }
    }

    /**
     * Monitor a transaction in the background: update IndexedDB, show notifications, and optionally call back.
     * Designed to be called fire-and-forget so the UI is not blocked.
     */
    async monitorTransaction(options: MonitorTransactionOptions): Promise<void> {
        const { interactionId, transactionHash, provider, functionName, actualContract, onSettled } = options

        try {
            const receipt = await provider.waitForTransaction(transactionHash)

            let events: any[] = []
            let parsedEvents: any[] = []
            let gasUsed = ''
            let status = 'pending' as InteractionStatus

            receipt.match({
                SUCCEEDED: (rc: any) => {
                    events = rc.events
                    gasUsed = formatActualFee(rc.actual_fee)
                    status = 'success'

                    if (actualContract) {
                        try {
                            parsedEvents = serializeBigInt(actualContract.parseEvents(receipt))
                        } catch {
                            // Event parsing can fail for proxy contracts — not critical
                        }
                    }
                },
                REVERTED: (rc: any) => {
                    events = rc.events
                    gasUsed = formatActualFee(rc.actual_fee)
                    status = 'reverted'
                },
                ERROR: () => {
                    status = 'failed'
                },
            })

            await contractInteractionsManager.update(interactionId, {
                status,
                events: parsedEvents.length > 0 ? parsedEvents : events,
                gasUsed,
                response: serializeBigInt(receipt),
                ...(status === 'reverted' && { errorMessage: 'Transaction reverted' }),
                ...(status === 'failed' && { errorMessage: 'Transaction failed' }),
            })

            if (status === 'success') {
                notifications.show({
                    title: 'Transaction Confirmed',
                    message: `${functionName} executed successfully`,
                    color: 'green',
                })
            } else {
                notifications.show({
                    title: status === 'reverted' ? 'Transaction Reverted' : 'Transaction Failed',
                    message: `${functionName} transaction ${status}`,
                    color: 'red',
                })
            }

            onSettled?.({ status, receipt, events: parsedEvents.length > 0 ? parsedEvents : events })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Transaction confirmation failed'

            await contractInteractionsManager.update(interactionId, {
                status: 'failed',
                errorMessage,
            })

            notifications.show({
                title: 'Transaction Monitoring Failed',
                message: `Failed to confirm ${functionName}: ${errorMessage}`,
                color: 'red',
            })

            onSettled?.({ status: 'failed' })
        }
    }

    /**
     * Wait for transaction confirmation and update interaction status
     */
    private async waitForTransactionConfirmation(
        interactionId: number,
        transactionHash: string,
        provider: RpcProvider
    ): Promise<void> {
        try {
            // Wait for transaction receipt
            const receipt = await provider.waitForTransaction(transactionHash)
            
            // Extract events and gas usage
            let events: Event[] = []
            let gasUsed = ""
            let status: InteractionStatus = "pending"

            receipt.match({
              SUCCEEDED: (rc: any)=>{
                events = rc.events
                gasUsed = formatActualFee(rc.actual_fee)
                status = "success"
              } ,
              REVERTED: (rc: any)=>{
                events = rc.events
                gasUsed = formatActualFee(rc.actual_fee)
                status = "reverted"
              },
              ERROR: ()=>{
                status = "failed"
              }
            })
            
            // Update interaction with final status
            await contractInteractionsManager.update(interactionId, {
                status,
                events,
                gasUsed,
                response: receipt,
            })
        } catch (error) {
            console.error('Transaction confirmation failed:', error)
            
            // Update interaction as failed
            await contractInteractionsManager.update(interactionId, {
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Transaction confirmation failed',
            })
        }
    }

    /**
     * Prepare call data from ICallDataItem array
     */
    private prepareCallData(callDataItems: ICallDataItem[]): string[] {
        return callDataItems.map(item => {
            if (item.isArray) {
                try {
                    // Parse array values
                    const arrayValues = JSON.parse(item.value)
                    return Array.isArray(arrayValues) ? arrayValues : [item.value]
                } catch {
                    // If parsing fails, treat as single value
                    return [item.value]
                }
            }
            return item.value
        }).flat()
    }

    /**
     * Replay a previous interaction
     */
    async replayInteraction(interactionId: number): Promise<{ result?: any; transactionHash?: string }> {
        try {
            const interaction = await contractInteractionsManager.getById(interactionId)
            if (!interaction) {
                throw new Error('Interaction not found')
            }

            if (!interaction.callDataItems) {
                throw new Error('No call data available for replay')
            }

            // Note: This would need contract details and provider/account
            // This is a placeholder for the replay functionality
            console.log('Replaying interaction:', interaction)
            
            // You would need to implement the actual replay logic here
            // based on the interaction type and available context
            
            return {}
        } catch (error) {
            console.error('Failed to replay interaction:', error)
            throw error
        }
    }

    /**
     * Get interaction statistics for a contract
     */
    async getInteractionStats(contractId: number): Promise<{
        total: number
        successful: number
        failed: number
        pending: number
        readCalls: number
        writeCalls: number
    }> {
        try {
            const [
                total,
                successful,
                failed,
                pending,
                readCalls,
                writeCalls
            ] = await Promise.all([
                contractInteractionsManager.getCountByContractId(contractId),
                contractInteractionsManager.getCountByStatus(contractId, 'success'),
                contractInteractionsManager.getCountByStatus(contractId, 'failed'),
                contractInteractionsManager.getCountByStatus(contractId, 'pending'),
                contractInteractionsManager.getCountByType(contractId, 'read'),
                contractInteractionsManager.getCountByType(contractId, 'write'),
            ])

            return {
                total,
                successful,
                failed,
                pending,
                readCalls,
                writeCalls,
            }
        } catch (error) {
            console.error('Failed to get interaction stats:', error)
            throw error
        }
    }
}

// Export singleton instance
export const contractInteractionService = ContractInteractionService.getInstance()
