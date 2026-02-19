import { IContractInteraction } from '@/types/contracts'
import { contractInteractionsManager } from '@/storage/contractInteractionsDatabase'

/**
 * Create sample interaction data for testing the dashboard
 */
export const createSampleInteractions = async (contractId: number): Promise<void> => {
    const sampleInteractions: Omit<IContractInteraction, 'id' | 'timestamp'>[] = [
        {
            contractId,
            functionName: 'remove_whitelisted_token',
            functionType: 'write',
            rawCallData: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'],
            callDataItems: [
                {
                    type: 'address',
                    name: 'token_address',
                    value: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                    isArray: false,
                }
            ],
            response: { transaction_hash: '0x123...abc' },
            transactionHash: '0x07d7e4c8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
            gasUsed: '45000',
            status: 'success',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
            contractId,
            functionName: 'get_owner',
            functionType: 'read',
            rawCallData: [],
            callDataItems: [],
            response: '0x1234567890abcdef1234567890abcdef12345678',
            status: 'success',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
            contractId,
            functionName: 'transfer',
            functionType: 'write',
            rawCallData: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', '1000000000000000000'],
            callDataItems: [
                {
                    type: 'address',
                    name: 'recipient',
                    value: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                    isArray: false,
                },
                {
                    type: 'number',
                    name: 'amount',
                    value: '1000000000000000000',
                    isArray: false,
                }
            ],
            response: { transaction_hash: '0x456...def' },
            transactionHash: '0x08e8f5d9g0a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
            gasUsed: '67000',
            status: 'success',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
            contractId,
            functionName: 'approve',
            functionType: 'write',
            rawCallData: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', '500000000000000000'],
            callDataItems: [
                {
                    type: 'address',
                    name: 'spender',
                    value: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                    isArray: false,
                },
                {
                    type: 'number',
                    name: 'amount',
                    value: '500000000000000000',
                    isArray: false,
                }
            ],
            status: 'failed',
            errorMessage: 'Insufficient balance',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
            contractId,
            functionName: 'balance_of',
            functionType: 'read',
            rawCallData: ['0x1234567890abcdef1234567890abcdef12345678'],
            callDataItems: [
                {
                    type: 'address',
                    name: 'account',
                    value: '0x1234567890abcdef1234567890abcdef12345678',
                    isArray: false,
                }
            ],
            response: '2500000000000000000',
            status: 'success',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
            contractId,
            functionName: 'set_approval_for_all',
            functionType: 'write',
            rawCallData: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', '1'],
            callDataItems: [
                {
                    type: 'address',
                    name: 'operator',
                    value: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                    isArray: false,
                },
                {
                    type: 'bool',
                    name: 'approved',
                    value: '1',
                    isArray: false,
                }
            ],
            status: 'pending',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
        }
    ]

    // Add timestamps with some variation across multiple days
    const now = new Date()
    for (let i = 0; i < sampleInteractions.length; i++) {
        const interaction = sampleInteractions[i]
        // Spread interactions across the last 7 days
        const daysBack = Math.floor(i / 2) // 2 interactions per day roughly
        const hoursBack = (i % 2) * 6 // 6 hours apart within the same day
        const timestamp = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000) - (hoursBack * 60 * 60 * 1000))
        
        await contractInteractionsManager.create({
            ...interaction,
            timestamp,
        })
    }

    // Add some additional interactions for better chart visualization
    const additionalInteractions = [
        // Yesterday - more reads
        {
            contractId,
            functionName: 'get_balance',
            functionType: 'read' as const,
            rawCallData: ['0x1234567890abcdef1234567890abcdef12345678'],
            callDataItems: [{
                type: 'address' as const,
                name: 'account',
                value: '0x1234567890abcdef1234567890abcdef12345678',
                isArray: false,
            }],
            response: '1000000000000000000',
            status: 'success' as const,
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
            timestamp: new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)),
        },
        // Two days ago - some errors
        {
            contractId,
            functionName: 'transfer_failed',
            functionType: 'write' as const,
            rawCallData: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', '999999999999999999999'],
            callDataItems: [{
                type: 'address' as const,
                name: 'recipient',
                value: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
                isArray: false,
            }],
            status: 'failed' as const,
            errorMessage: 'Insufficient balance',
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
            timestamp: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)),
        },
        // Three days ago - more writes
        {
            contractId,
            functionName: 'mint',
            functionType: 'write' as const,
            rawCallData: ['0x1234567890abcdef1234567890abcdef12345678', '500000000000000000'],
            callDataItems: [{
                type: 'address' as const,
                name: 'to',
                value: '0x1234567890abcdef1234567890abcdef12345678',
                isArray: false,
            }],
            response: { transaction_hash: '0x789...ghi' },
            transactionHash: '0x09f9g6e0h1a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
            gasUsed: '52000',
            status: 'success' as const,
            executedBy: '0x1234567890abcdef1234567890abcdef12345678',
            timestamp: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
        },
    ]

    for (const interaction of additionalInteractions) {
        await contractInteractionsManager.create(interaction)
    }

    console.log(`Created ${sampleInteractions.length} sample interactions for contract ${contractId}`)
}

/**
 * Clear all interactions for a contract (useful for testing)
 */
export const clearContractInteractions = async (contractId: number): Promise<void> => {
    await contractInteractionsManager.deleteByContractId(contractId)
    console.log(`Cleared all interactions for contract ${contractId}`)
}

/**
 * Create sample interactions for all contracts in the database
 */
export const createSampleInteractionsForAllContracts = async (): Promise<void> => {
    const { contractsManager } = await import('@/storage/contractsDatabase')
    const contracts = await contractsManager.getAll()
    
    for (const contract of contracts) {
        if (contract.id) {
            await createSampleInteractions(contract.id)
        }
    }
    
    console.log(`Created sample interactions for ${contracts.length} contracts`)
}
