import { ICallDataItem } from '@/types'
import { IAbiEntry } from '@/types/contracts'
import { Stack, Text } from '@mantine/core'
import React from 'react'
import { AbiEntry } from 'starknet'
import CustomCardWithHeaderAndFooter from '../common/CustomCardWithHeaderAndFooter'
import { IconCode } from '@tabler/icons-react'

const RenderAbiEntry = ({ entry }: { entry: IAbiEntry }) => {
    if (!entry || entry.type === "impl") return null
    if (entry.type === 'function' || entry.type === 'constructor') {
        return (
            <CustomCardWithHeaderAndFooter
                title={entry.name}
                subtitle={entry.signature}
                Icon={IconCode}
            >
                <Stack gap={"xs"}>
                    <Text size='sm'>Inputs</Text>
                    <Stack gap={"xs"}>
                        {entry.inputs?.map((input: AbiEntry, idx: number) => (
                            <Text key={`${input.name}-${idx}`} size="sm" c="dimmed">
                                {`${idx + 1}. ${input.name}: ${input.type}`}
                            </Text>
                        ))}
                        {entry.inputs?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                    <Text size='sm'>Outputs</Text>
                    <Stack gap={"xs"}>
                        {!entry.outputs ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                        {entry.outputs?.map((output: AbiEntry, idx: number) => (
                            <Text key={`${output.name}-${idx}`} size="sm" c="dimmed">
                                {`${idx + 1}. ${output.name}: ${output.type}`}
                            </Text>
                        ))}
                        {entry.outputs?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>
            </CustomCardWithHeaderAndFooter>
        )
    }
    if (entry.type === 'struct') {
        return (
            <CustomCardWithHeaderAndFooter
                title={entry.name}
                subtitle={entry.signature}
                Icon={IconCode}
            >
                <Stack gap={"xs"}>
                    <Text size='sm'>Members</Text>
                    <Stack gap={"xs"}>
                        {entry.members?.map((member: AbiEntry, idx: number) => (
                            <Text key={`${member.name}-${idx}`} size="sm" c="dimmed">
                                {`${idx + 1}. ${member.name}: ${member.type}`}
                            </Text>
                        ))}
                        {entry.members?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>
            </CustomCardWithHeaderAndFooter>
        )
    }
    if (entry.type === 'interface') {
        return (
            <CustomCardWithHeaderAndFooter
                title={entry.name}
                subtitle={entry.signature}
                Icon={IconCode}
            >
                <Stack gap={"xs"}>
                    <Text size='sm'>Functions</Text>
                    <Stack gap={"xs"}>
                        {entry.items?.map((member: AbiEntry, idx: number) => (
                            <RenderAbiEntry key={`${member.name}-${idx}`} entry={member} />
                        ))}
                        {entry.items?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>
            </CustomCardWithHeaderAndFooter>
        )
    }
    if (entry.type === 'event' && entry.kind === "struct") {
        return (
            <CustomCardWithHeaderAndFooter
                title={entry.name}
                subtitle={entry.signature}
                Icon={IconCode}
            >
                <Stack gap={"xs"}>
                    <Text size='sm'>Members</Text>
                    <Stack gap={"xs"}>
                        {entry.members?.map((member: AbiEntry, idx: number) => (
                            <RenderAbiEntry key={`${member.name}-${idx}`} entry={member} />
                        ))}
                        {entry.members?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>
            </CustomCardWithHeaderAndFooter>
        )
    }
    if (entry.type === 'event' && entry.kind === "enum") {
        return (
            <CustomCardWithHeaderAndFooter
                title={entry.name}
                subtitle={entry.signature}
                Icon={IconCode}
            >
                <Stack gap={"xs"}>
                    <Text size='sm'>Variants</Text>
                    <Stack gap={"xs"}>
                        {entry.variants?.map((variant: AbiEntry, idx: number) => (
                            <RenderAbiEntry key={`${variant.name}-${idx}`} entry={variant} />
                        ))}
                        {entry.variants?.length === 0 ? (
                            <Text size="sm" c="dimmed">
                                —
                            </Text>
                        ) : null}
                    </Stack>
                </Stack>
            </CustomCardWithHeaderAndFooter>
        )
    }
    return (
        <CustomCardWithHeaderAndFooter
            title={entry.name}
            subtitle={entry.signature}
            Icon={IconCode}
        >
            <Text size="sm">{entry.type}</Text>
            {
                entry.kind ? (
                    <Text size="xs" c="dimmed">{`Kind: ${entry.kind}`}</Text>
                ) : null
            }
        </CustomCardWithHeaderAndFooter>
    )
}

export default RenderAbiEntry