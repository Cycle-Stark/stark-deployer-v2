import React, { useState } from 'react'
import {
    Stack,
    Text,
    Button,
    Group,
    Badge,
    Collapse,
    ActionIcon,
    Alert,
    ScrollArea,
} from '@mantine/core'
import {
    IconChevronDown,
    IconChevronUp,
    IconEye,
    IconSend,
    IconAlertCircle,
    IconSend2,
} from '@tabler/icons-react'
import { IAbiEntry, ICallDataItem } from '@/types'
import { useContractInteractions } from '@/hooks/useContractInteractions'
import CustomCardWithHeaderAndFooter from '../common/CustomCardWithHeaderAndFooter'
import { CodeHighlight } from '@mantine/code-highlight'

interface InteractiveAbiEntryProps {
    entry: IAbiEntry
    contractId: number
    contractAddress: string
    abi: any[]
    provider?: any
    account?: any
    executedBy?: string
}

const InteractiveAbiEntry = ({
    entry,
    contractId,
    contractAddress,
    abi,
    provider,
    account,
    executedBy
}: InteractiveAbiEntryProps) => {
    const [opened, setOpened] = useState(false)
    const [callDataItems, setCallDataItems] = useState<ICallDataItem[]>([])
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const {
        loading,
        executeReadFunction,
        executeWriteFunction,
    } = useContractInteractions({
        contractId,
        contractAddress,
        abi,
        provider,
        account,
    })

    // Initialize call data items when component mounts or entry changes
    React.useEffect(() => {
        if (entry.inputs && entry.inputs.length > 0) {
            const items: ICallDataItem[] = entry.inputs.map((input: any) => ({
                type: mapAbiTypeToCallDataType(input.type),
                name: input.name || 'unnamed',
                value: '',
                isArray: input.type?.includes('*') || false,
            }))
            setCallDataItems(items)
        } else {
            setCallDataItems([])
        }
    }, [entry])

    const mapAbiTypeToCallDataType = (abiType: string): ICallDataItem['type'] => {
        if (abiType.includes('felt') || abiType.includes('Felt')) return 'felt'
        if (abiType.includes('u256') || abiType.includes('u128') || abiType.includes('u64') || abiType.includes('u32')) return 'number'
        if (abiType.includes('bool')) return 'bool'
        if (abiType.includes('ContractAddress') || abiType.includes('contract_address')) return 'address'
        if (abiType.includes('ClassHash') || abiType.includes('class_hash')) return 'class_hash'
        return 'felt' // default
    }

    const isReadFunction = entry.state_mutability === 'view'
    const isWriteFunction = entry.state_mutability === 'external' || !entry.state_mutability

    const handleExecute = async () => {
        setError(null)
        setResult(null)

        try {
            if (isReadFunction) {
                const { result: execResult } = await executeReadFunction(
                    entry.name || '',
                    callDataItems,
                    executedBy
                )
                setResult(execResult)
            } else if (isWriteFunction) {
                const { transactionHash } = await executeWriteFunction(
                    entry.name || '',
                    callDataItems,
                    executedBy
                )
                setResult({ transactionHash })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const canExecute = () => {
        if (isReadFunction && !provider) return false
        if (isWriteFunction && !account) return false
        
        // Check if all required inputs have values
        return callDataItems.every(item => item.value.trim() !== '')
    }

    const updateCallDataItem = (index: number, updates: Partial<ICallDataItem>) => {
        setCallDataItems(prev => 
            prev.map((item, i) => i === index ? { ...item, ...updates } : item)
        )
    }

    if (!entry || entry.type !== 'function') {
        return null
    }

    return (
        <CustomCardWithHeaderAndFooter
            title={`${isReadFunction ? 'Read' : 'Write'}: ${entry.name}`}
            subtitle={entry.signature}
            Icon={isReadFunction ? IconEye : IconSend}
        >
            <Collapse in={opened}>
                <Stack gap="md">
                    {/* Function Inputs */}
                    {entry.inputs && entry.inputs.length > 0 && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Inputs</Text>
                            {/* {callDataItems.map((item, index) => (
                                <RenderA
                                    key={`${item.name}-${index}`}
                                    item={item}
                                    onChange={(updates) => updateCallDataItem(index, updates)}
                                />
                            ))} */}
                        </Stack>
                    )}

                    {/* Execute Button */}
                    <Group justify="space-between" align="center">
                        <Button
                            leftSection={<IconSend2 size={16} />}
                            onClick={handleExecute}
                            loading={loading}
                            disabled={!canExecute()}
                            color={isReadFunction ? 'blue' : 'teal'}
                            variant={isReadFunction ? 'light' : 'filled'}
                        >
                            {isReadFunction ? 'Call' : 'Invoke'}
                        </Button>

                        {!canExecute() && (
                            <Text size="xs" c="dimmed">
                                {isReadFunction && !provider && 'Provider required'}
                                {isWriteFunction && !account && 'Account required'}
                                {((isReadFunction && provider) || (isWriteFunction && account)) && 
                                 callDataItems.some(item => item.value.trim() === '') && 
                                 'Fill all required inputs'}
                            </Text>
                        )}
                    </Group>

                    {/* Error Display */}
                    {error && (
                        <Alert
                            icon={<IconAlertCircle size={16} />}
                            color="red"
                            variant="light"
                        >
                            <Text size="sm">{error}</Text>
                        </Alert>
                    )}

                    {/* Result Display */}
                    {result && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Result</Text>
                            <ScrollArea.Autosize mah={200}>
                                <CodeHighlight
                                    code={JSON.stringify(result, null, 2)}
                                    language="json"
                                />
                            </ScrollArea.Autosize>
                        </Stack>
                    )}

                    {/* Function Outputs Info */}
                    {entry.outputs && entry.outputs.length > 0 && (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>Expected Outputs</Text>
                            {entry.outputs.map((output: any, idx: number) => (
                                <Text key={`${output.name}-${idx}`} size="xs" c="dimmed">
                                    {`${idx + 1}. ${output.name || 'unnamed'}: ${output.type}`}
                                </Text>
                            ))}
                        </Stack>
                    )}
                </Stack>
            </Collapse>
        </CustomCardWithHeaderAndFooter>
    )
}

export default InteractiveAbiEntry
