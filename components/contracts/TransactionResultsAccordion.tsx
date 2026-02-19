import React from 'react'
import { Accordion, Box, Code, Text } from '@mantine/core'
import { IconCheck, IconHash, IconReceipt, IconActivity, IconBolt } from '@tabler/icons-react'
import { serializeBigInt } from '@/components/utils'

export interface TransactionResultsData {
  result?: any
  transactionHash?: string
  receipt?: any
  events?: any[]
  transactionStatus?: string
}

export interface TransactionResultsAccordionProps {
  data: TransactionResultsData
  className?: string
  defaultOpenPanel?: string
}

const TransactionResultsAccordion: React.FC<TransactionResultsAccordionProps> = ({
  data,
  className,
  defaultOpenPanel
}) => {
  const { result, transactionHash, receipt, events = [], transactionStatus } = data
  
  const hasResults = result || (transactionHash || receipt || events.length > 0)

  if (!hasResults) return null

  const accordionItems: any[] = []

  // Result accordion item (for view functions)
  if (result) {
    accordionItems.push({
      value: "result",
      icon: <IconCheck size={16} />,
      title: "Result",
      content: (
        <Code block>
          {typeof result === 'string' ? result : JSON.stringify(serializeBigInt(result), null, 4)}
        </Code>
      )
    })
  }

  // Transaction Hash accordion item
  if (transactionHash) {
    accordionItems.push({
      value: "transaction-hash",
      icon: <IconHash size={16} />,
      title: "Transaction Hash",
      content: (
        <Box>
          <Code>{transactionHash}</Code>
        </Box>
      )
    })
  }

  // Transaction Status accordion item
  if (transactionStatus) {
    accordionItems.push({
      value: "transaction-status",
      icon: <IconBolt size={16} />,
      title: "Status",
      content: (
        <Text 
          size="sm" 
          c={
            transactionStatus.includes('Successful') || transactionStatus.includes('Call Successful') 
              ? 'green' 
              : transactionStatus.includes('Failed') || transactionStatus.includes('Reverted') 
                ? 'red' 
                : 'blue'
          }
        >
          {transactionStatus}
        </Text>
      )
    })
  }

  // Events accordion item
  if (events.length > 0) {
    accordionItems.push({
      value: "events",
      icon: <IconActivity size={16} />,
      title: `Events (${events.length})`,
      content: (
        <Code block>
          {JSON.stringify(serializeBigInt(events), null, 2)}
        </Code>
      )
    })
  }

  // Receipt accordion item
  if (receipt && result !== receipt) {
    accordionItems.push({
      value: "receipt",
      icon: <IconReceipt size={16} />,
      title: "Receipt",
      content: (
        <Code block>
          {JSON.stringify(serializeBigInt(receipt), null, 2)}
        </Code>
      )
    })
  }

  // Determine default open panel
  const getDefaultValue = () => {
    if (defaultOpenPanel) return defaultOpenPanel
    if (result) return "result"
    if (transactionStatus) return "transaction-status"
    return accordionItems[0]?.value || ""
  }

  return (
    <Box mt="md" className={className}>
      <Accordion 
        defaultValue={getDefaultValue()} 
        variant="separated" 
        radius="lg"
      >
        {accordionItems.map((item) => (
          <Accordion.Item key={item.value} value={item.value}>
            <Accordion.Control icon={item.icon}>
              {item.title}
            </Accordion.Control>
            <Accordion.Panel>
              {item.content}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Box>
  )
}

export default TransactionResultsAccordion
