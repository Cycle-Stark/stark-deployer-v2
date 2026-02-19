import { ReactNode } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Text,
  Stack,
  useMantineColorScheme,
  useMantineTheme,
  Center,
  ScrollAreaAutosize,
  ActionIcon,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconRocket,
  IconFileText,
  IconSettings,
  IconLayout2,
  IconChevronRight,
  IconChevronLeft,
  IconCloudDownload,
  IconHome2,
  IconX,
} from '@tabler/icons-react';
import ColorSchemeToggle from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import SidebarLink from '@/components/navigation/SidebarLink';
import NetworkSwitch from '@/components/common/NetworkSwitch';
import HandyTools from '@/components/common/HandyTools';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const [sidebarOpened, { toggle: sideBarToggle }] = useDisclosure();

  const navigationItems = [
    { icon: IconHome2, label: 'Go Home', href: '/' },
    { icon: IconRocket, label: 'Deploy', href: '/app' },
    { icon: IconCloudDownload, label: 'Import', href: '/app/import' },
    { icon: IconFileText, label: 'Contracts', href: '/app/contracts' },
    { icon: IconSettings, label: 'Account / Settings', href: '/app/settings' },
  ];

  const { colorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = useMantineTheme()
  const router = useRouter()

  return (
    <AppShell
      header={{ height: 60, offset: true }}
      navbar={{
        width: { base: 250, md: 320 },
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      aside={{
        width: { base: 250, md: 400 },
        breakpoint: 'sm',
        collapsed: { desktop: !sidebarOpened, mobile: !sidebarOpened },
        // offset: "10px",
      }}
      styles={{
        //         root: {
        // overflow: "auto"
        //         },
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
      transitionDuration={500}
      transitionTimingFunction="ease"
      layout='alt'
    // padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" gap={"4px"}>
          <Group gap={"xs"}>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={600}>
              StarkD
            </Text>
          </Group>

          <Group gap={"4px"}>
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
        <AppShell.Section h={"60px"} style={{
          borderBottom: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[3]}`
        }}>
          <Group px={"md"} h={"100%"} justify='space-between' align='center'>
            <Group h={"100%"} onClick={() => {
              router.push("/")
            }} style={{
              cursor: "pointer"
            }}>
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
        </AppShell.Section>
        <AppShell.Section offsetScrollbars grow py={"md"} component={ScrollAreaAutosize} scrollbars={"y"} scrollbarSize={"10px"} type='always'>
          <Stack gap="2px" px={"md"}>
            {
              navigationItems.map((item) => (
                <SidebarLink key={item.label} label={item.label} href={`${item.href}`} Icon={item.icon} click={() => toggle()} />
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

      <AppShell.Main h="calc(100vh - 100px)" style={{ overflow: "hidden" }} bg={isDark ? theme.colors.darkColor[9] : theme.white}>{children}</AppShell.Main>

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

      <AppShell.Aside p="0" style={{
        marginRight: 'var(--removed-body-scroll-bar-size, 0px)',
      }}>
        <HandyTools onClose={() => sideBarToggle()} />
      </AppShell.Aside>
    </AppShell>
  );
}
