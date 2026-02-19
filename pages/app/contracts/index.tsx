import CustomCardWithHeaderAndFooter from '@/components/common/CustomCardWithHeaderAndFooter';
import { AppLayout } from '@/layouts/AppLayout';
import { Text, Stack, Group, ActionIcon, Box, Drawer, ScrollArea, Tooltip, TextInput, Select } from '@mantine/core';
import { IconEye, IconTrash, IconFile, IconSend2, IconSearch } from '@tabler/icons-react';
import { useContracts } from '@/hooks/useContracts';
import { DataTable } from 'mantine-datatable';
import { formatAddress } from '@/utils';
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import QuickContractInfo from '@/components/contracts/QuickContractInfo';
import ContractInteractionStats from '@/components/contracts/ContractInteractionStats';
import { IContract } from '@/types';
import { useState } from 'react';
import { modals } from '@mantine/modals';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function ContractsPage() {
  const [search, setSearch] = useState('');
  const [networkFilter, setNetworkFilter] = useState<string | null>(null);

  const { contracts, totalCount, isLoading, deleteContract, availableNetworks } = useContracts({
    limit: 20,
    search: search || undefined,
    network: networkFilter || undefined,
  });

  const [activeContract, setActiveContract] = useState<IContract | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const handleDeleteContract = (contractId: number) => {
    deleteContract(contractId)
  }

  const confirmDeleteContract = (contractId: number) => modals.openConfirmModal({
    title: 'Delete Contract',
    children: <Text>Are you sure you want to delete this contract?</Text>,
    labels: { confirm: 'Delete', cancel: 'Cancel' },
    centered: true,
    radius: "md",
    onCancel: () => console.log('Cancel'),
    onConfirm: () => {
      handleDeleteContract(contractId)
    },
    confirmProps: {
      radius: "md",
      color: "red",
      variant: "light"
    },
    cancelProps: {
      radius: "md"
    }
  })

  const networkSelectData = [
    { value: '', label: 'All Networks' },
    ...(availableNetworks || []).map((n: string) => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) })),
  ];

  return (
    <>
      <Box p={"lg"}>
        <CustomCardWithHeaderAndFooter
          title='Contracts'
          subtitle="Manage your deployed contracts and view their status."
          Icon={IconFile}
          description={`${totalCount || 0} contracts`}
        >
          <Stack gap="md">
            {/* Search and Filter */}
            <Group gap="xs" align="end">
              <TextInput
                placeholder="Search contracts..."
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
                radius="md"
              />
              <Select
                placeholder="Network"
                data={networkSelectData}
                value={networkFilter || ''}
                onChange={(value) => setNetworkFilter(value || null)}
                w={160}
                radius="md"
                clearable
              />
            </Group>

            <DataTable
              withTableBorder
              fz="sm"
              minHeight={"300px"}
              borderRadius={"lg"}
              bg={isDark ? theme.colors.darkColor[8] : theme.colors.gray[0]}
              columns={[
                {
                  accessor: "id",
                  title: "#",
                  width: "40px",
                  render: (value, index) => index + 1
                },
                {
                  accessor: 'name',
                  title: 'Name',
                  width: "200px",
                },
                {
                  accessor: 'address',
                  title: 'Address',
                  width: "200px",
                  render: (item) => (
                    <Text size="sm" style={{ fontFamily: 'monospace' }}>
                      {formatAddress(item.address, 6, 4)}
                    </Text>
                  )
                },
                {
                  accessor: 'network',
                  title: 'Network',
                  width: "150px",
                  render: (item) => (
                    <Stack gap={0}>
                      <Text size="sm" tt="capitalize">
                        {item.chain}
                      </Text>
                      <Text size="xs" tt="capitalize">
                        {item.network}
                      </Text>
                    </Stack>
                  )
                },
                {
                  accessor: 'deployedAt',
                  title: 'Deployed',
                  render: (item) => (
                    <Tooltip
                      label={dayjs(item.deployedAt).fromNow()}
                      radius="md"
                    >
                      <Stack gap={0} style={{ cursor: 'default' }}>
                        <Text size="sm">
                          {dayjs(item.deployedAt).format('MMM D, YYYY')}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {dayjs(item.deployedAt).format('h:mm A')}
                        </Text>
                      </Stack>
                    </Tooltip>
                  )
                },
                {
                  accessor: 'interactions',
                  title: 'Interactions',
                  width: "160px",
                  render: (item) => (
                    <ContractInteractionStats contractId={item.id!} />
                  )
                },
                {
                  accessor: 'actions',
                  title: 'Actions',
                  width: "200px",
                  render: (item) => (
                    <Group>
                      <ActionIcon variant="subtle" size="sm">
                        <IconEye size={16} onClick={() => {
                          setActiveContract(item)
                          open()
                        }} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" size="sm" color="red" onClick={() => confirmDeleteContract(item.id!)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                      <Tooltip label="Interact" radius={"md"}>
                        <ActionIcon variant="subtle" size="sm" component={Link} href={`/app/contracts/${item.id}`}>
                          <IconSend2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )
                },
              ]}
              records={contracts}
            />
          </Stack>
        </CustomCardWithHeaderAndFooter>
      </Box>
      <Drawer
        position='right'
        title={activeContract ? `Contract: ${activeContract.name}` : "Contract Information"}
        opened={opened}
        onClose={close}
        size={"lg"}
        offset={10}
        radius={"lg"}
      >
        <Drawer.Body p={0} h="calc(100vh - 100px)">
          <ScrollArea h="100%" style={{ overflowX: 'hidden' }}>
            {
              activeContract ? (
                <QuickContractInfo contract={activeContract} />
              ) : null
            }
          </ScrollArea>
        </Drawer.Body>
      </Drawer>
    </>
  );
}

ContractsPage.PageLayout = AppLayout;
export default ContractsPage
