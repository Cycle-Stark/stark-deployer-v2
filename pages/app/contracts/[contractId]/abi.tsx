import CustomCardWithHeaderAndFooter from '@/components/common/CustomCardWithHeaderAndFooter'
import { useContract } from '@/contexts/ContractProvider'
import ContractLayoutWithProvider from '@/layouts/ContractLayout'
import InnerLayout from '@/layouts/InnerLayout'
import { CodeHighlight } from '@mantine/code-highlight'
import { ScrollArea, Stack } from '@mantine/core'
import { IconActivity } from '@tabler/icons-react'
import React, { useState } from 'react'

const ContractAbi = () => {
    const {contract} = useContract()
    const [expanded, setExpanded] = useState(false)

    const contractAbi = JSON.stringify(JSON.parse(contract?.sierra || "{}")?.abi, null, 4)
    return (
        <InnerLayout>
            <ScrollArea scrollbars="y" offsetScrollbars p="md" h="100%">
                <CustomCardWithHeaderAndFooter
                    title="Contract ABI"
                    Icon={IconActivity}
                    subtitle='Contract ABI'
                >
                    <Stack gap="md">
                        <CodeHighlight
                            code={contractAbi}
                            language="json"
                            radius={"lg"}
                            expanded={expanded}
                            maxCollapsedHeight={600}
                            onExpandedChange={(expanded) => setExpanded(expanded)}
                            withExpandButton={true}
                            collapseCodeLabel='Collapse ABI'
                            expandCodeLabel='Expand ABI'
                        />
                    </Stack>
                </CustomCardWithHeaderAndFooter>
            </ScrollArea>
        </InnerLayout>

    )
}

ContractAbi.PageLayout = ContractLayoutWithProvider
export default ContractAbi
