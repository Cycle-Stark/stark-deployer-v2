import ContractLayout from '@/layouts/ContractLayout';
import InnerLayout from '@/layouts/InnerLayout';
import { useContract } from '@/contexts/ContractProvider';
import { Box, ScrollArea, Text } from '@mantine/core';
import ContractDashboard from '@/components/contracts/ContractDashboard';
import React from 'react'

const SingleContractPage = () => {
  const { contract } = useContract();

  return (
    <InnerLayout>
      <ScrollArea h="100%" offsetScrollbars scrollbars="y">
        <Box p="md">
          {contract ? (
            <ContractDashboard contract={contract} />
          ) : (
            <Text>Loading contract...</Text>
          )}
        </Box>
      </ScrollArea>
    </InnerLayout>
  )
}

SingleContractPage.PageLayout = ContractLayout;
export default SingleContractPage
