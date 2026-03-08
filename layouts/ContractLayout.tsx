import { ReactNode, useState } from 'react';
import {
  AppShell,
  Anchor,
  Burger,
  Group,
  Text,
  Stack,
  Divider,
  useMantineColorScheme,
  useMantineTheme,
  Box,
  SegmentedControl,
  Center,
  ScrollAreaAutosize,
  TextInput,
  em,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconFile,
  IconLayout2,
  IconBraces,
  IconEye,
  IconWriting,
  IconSearch,
  IconShield,
  IconChevronRight,
  IconActivity,
  IconChevronLeft,
  IconArrowUp,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import ColorSchemeToggle from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import SidebarLink from '@/components/navigation/SidebarLink';
import { ContractProvider, useContract } from '@/contexts/ContractProvider';
import NetworkSwitch from '@/components/common/NetworkSwitch';
import HandyTools from '@/components/common/HandyTools';
import UpgradeContractModal from '@/components/contracts/UpgradeContractModal';

interface AppLayoutProps {
  children: ReactNode;
}

function ContractLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const [sidebarOpened, { toggle: sideBarToggle }] = useDisclosure();
  const [upgradeOpened, { open: openUpgrade, close: closeUpgrade }] = useDisclosure();
  const { contract, contractId, functionName, getAllFunctions } = useContract();
  const [viewType, setViewType] = useState<'all' | 'write' | 'read'>('all')
  const [query, setQuery] = useState<string>("")

  const navigationItems = [
    { icon: IconLayout2, label: 'Dashboard', href: '/app/contracts/:contractId' },
    { icon: IconActivity, label: 'Function Calls/Invocations', href: '/app/contracts/:contractId/calls' },
    { icon: IconBraces, label: 'ABI', href: '/app/contracts/:contractId/abi' },
    { icon: IconFile, label: 'Contracts', href: '/app/contracts' },
    // { icon: IconReload, label: 'Reload  ABI', href: '/contracts/:contractId/abi' },
    // { icon: IconRocket, label: 'Deploy', href: '/', active: true },
    // { icon: IconFile, label: 'Contracts', href: '/contracts', active: true },
    // { icon: IconSettings, label: 'Account / Settings', href: '/settings' },
  ];

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()

  const getFilteredFunctions = () => {
    const allFuncs = getAllFunctions().filter((func) => func.name.toLowerCase().includes(query.toLowerCase()))

    if (viewType === 'all') return allFuncs
    if (viewType === 'write') return allFuncs.filter((func) => func.state_mutability === 'nonpayable' || func.state_mutability === 'payable' || func.state_mutability === 'external')
    if (viewType === 'read') return allFuncs.filter((func) => func.state_mutability === 'view' || func.state_mutability === 'pure')
    return allFuncs
  }

  const contractFunctions = getFilteredFunctions()

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: { base: 250, md: 320 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      aside={{
        width: { base: 250, md: 400 },
        breakpoint: 'md',
        collapsed: { desktop: !sidebarOpened, mobile: !sidebarOpened },
      }}
      styles={{
        navbar: {
          background: isDark ? theme.colors.darkColor[9] : theme.white,
        },
        main: {
          background: isDark ? theme.colors.darkColor[9] : theme.white,
        },
        header: {
          background: isDark ? theme.colors.darkColor[9] : theme.white,
        },
        footer: {
          background: isDark ? theme.colors.darkColor[8] : theme.white,
        },
        aside: {
          background: isDark ? theme.colors.darkColor[9] : theme.white,
        },
      }}
      // padding="md"
      layout='alt'
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap={"xs"} align='center'>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap={"2px"} align='center'>
              <Group gap={"xs"} visibleFrom='md' align='center'>
                <ActionIcon style={{ pointerEvents: "none" }} color='violet'
                  size={"lg"}
                  radius={"md"} variant='light'>
                  <IconShield size={20} />
                </ActionIcon>
                <Text size="sm">
                  Contracts
                </Text>
                <IconChevronRight size={20} />
                <Text size="sm">
                  {contract?.name || "Interact"}
                </Text>
              </Group>
              {
                functionName ? (
                  <>
                    <Group visibleFrom='sm' h={"fit-content"}>
                      <IconChevronRight size={20} />
                    </Group>
                    <Text size="sm">
                      {functionName}
                    </Text>
                  </>
                ) : null
              }
            </Group>
          </Group>

          <Group gap={"2px"}>
            <NetworkSwitch />
            <ColorSchemeToggle />
            <ActionIcon onClick={sideBarToggle} variant='light' size="lg" radius="md">
              {
                sidebarOpened ? <IconChevronRight size={20} /> : <IconChevronLeft size={20} />
              }
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar>
        <AppShell.Section>
          <Stack gap={"xs"}>
            <Group h={"60px"} px={"md"} justify='space-between' align='center'>
              <Group>
                <Center w={"40px"} h={"40px"}
                  style={{
                    background: isDark ? theme.colors.darkColor[7] : theme.colors.gray[3],
                    borderRadius: theme.radius.md,
                  }}
                >
                  <IconLayout2 size={20} />
                </Center>
                <Stack gap={0}>
                  <Text size='sm'>
                    Stark Deployer
                  </Text>
                  <Text size='xs' c={"dimmed"}>
                    Interaction Suite
                  </Text>
                </Stack>
              </Group>
              <ActionIcon onClick={() => {
                toggle()
              }} variant='light' size="lg" radius="md" display={{ base: "block", sm: "none" }}>
                <IconX size={20} />
              </ActionIcon>
            </Group>
            <Stack gap="2px" px={"md"}>
              {
                navigationItems.map((item) => (
                  <SidebarLink key={item.label} label={item.label} href={`${item.href.replace(':contractId', (contract?.id as any) ?? "-")}`} Icon={item.icon} click={() => toggle()} />
                ))
              }
              <SidebarLink label="Upgrade Contract" href="#" Icon={IconArrowUp} click={(e: React.MouseEvent) => { e.preventDefault(); openUpgrade(); toggle(); }} />
            </Stack>
            <Divider />
            <Box px={"md"}>
              <SegmentedControl
                fullWidth
                size='md'
                data={[
                  { value: "all", label: "All" },
                  { value: "write", label: "Write" },
                  { value: "read", label: "Read" },
                ]} radius={"xl"} variant='light' color='violet'
                value={viewType}
                onChange={(value) => setViewType(value as "all" | "write" | "read")}
              />
            </Box>
            <Box px="md">
              <TextInput
                leftSection={<IconSearch size={"1.4rem"} stroke={em(1.5)} />}
                radius={"xl"}
                placeholder='Search functions...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </Box>
          </Stack>
        </AppShell.Section>
        <AppShell.Section offsetScrollbars grow p={"md"} component={ScrollAreaAutosize} scrollbars={"y"} scrollbarSize={"10px"} type='always'>
          <Stack gap={"4px"}>
            {
              contractFunctions?.map((func, idx: number) => (
                <SidebarLink
                  key={`func_${func.name}_${idx}`}
                  label={func.name.replaceAll("_", " ")}
                  href={`/app/contracts/${contractId}/functions/${func.name}`}
                  Icon={func.state_mutability === "view" ? IconEye : IconWriting}
                  radius="md"
                  click={() => toggle()}
                />
              ))
            }
          </Stack>
        </AppShell.Section>
        <AppShell.Section h={"70px"} style={{
          borderTop: "1px solid",
          borderColor: isDark ? theme.colors.darkColor[6] : theme.colors.gray[2],
        }}>

        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main h="calc(100vh - 100px)"
        bg={isDark ? theme.colors.darkColor[9] : theme.white} pb="md">
        {children}
      </AppShell.Main>
      <AppShell.Footer h="40px" zIndex={0}>
        <Group gap={"md"} justify='space-between' align='center' h="100%" px={"md"}>
          <Text size="xs" c="dimmed">
            &copy; {new Date().getFullYear()} Stark Deployer. All rights reserved
          </Text>
          <Text size="xs" c="dimmed">
            Interaction Suite • v2 • <Anchor href='https://stark-deployer.vercel.app/' target="_blank">Check out v1</Anchor> • <Anchor component={Link} href='/changelog' target="_blank">Changelog</Anchor>
          </Text>
        </Group>
      </AppShell.Footer>

      <AppShell.Aside>
        <HandyTools onClose={() => sideBarToggle()} />
      </AppShell.Aside>

      <UpgradeContractModal opened={upgradeOpened} onClose={closeUpgrade} />
    </AppShell>
  );
}


const ContractLayoutWithProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ContractProvider>
      <ContractLayout>
        {children}
      </ContractLayout>
    </ContractProvider>
  )
}

export default ContractLayoutWithProvider
