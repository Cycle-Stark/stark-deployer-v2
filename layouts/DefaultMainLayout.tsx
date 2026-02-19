import { ReactNode } from 'react';
import {
  Group,
  Text,
  Stack,
  Button,
  Container,
  Anchor,
  Box,
  SimpleGrid,
  ActionIcon,
  Divider,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconRocket, IconBrandGithub, IconBrandX } from '@tabler/icons-react';
import ColorSchemeToggle from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import Link from 'next/link';

interface DefaultMainLayoutProps {
  children: ReactNode;
}

export default function DefaultMainLayout({ children }: DefaultMainLayoutProps) {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box mih="100vh" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        component="header"
        h={60}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          background: isDark ? theme.colors.dark[7] : theme.white,
        }}
      >
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <IconRocket size={24} color={theme.colors.violet[6]} />
              <Text
                component={Link}
                href="/"
                size="lg"
                fw={700}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                Stark Deployer
              </Text>
            </Group>

            <Group gap="md">
              <Anchor component={Link} href="/" size="sm" c="dimmed" underline="never">
                Home
              </Anchor>
              <Anchor component={Link} href="/blog" size="sm" c="dimmed" underline="never">
                Blog
              </Anchor>
              <ActionIcon
                component="a"
                href="https://github.com/Cycle-Stark/stark-deployer"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                color="gray"
                size="lg"
                radius="md"
              >
                <IconBrandGithub size={18} />
              </ActionIcon>
              <Button
                component={Link}
                href="/app"
                variant="filled"
                color="violet"
                size="sm"
                radius="md"
              >
                Go to App
              </Button>
              <ColorSchemeToggle />
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Main Content */}
      <Box component="main" style={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        py="xl"
        style={{
          borderTop: `1px solid ${isDark ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          background: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
        }}
      >
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
            {/* Brand */}
            <Stack gap="xs">
              <Group gap="xs">
                <IconRocket size={20} color={theme.colors.violet[6]} />
                <Text fw={700}>Stark Deployer</Text>
              </Group>
              <Text size="xs" c="dimmed">
                Free & open-source tool for deploying and interacting with Starknet smart contracts.
              </Text>
              <Group gap="xs" mt={4}>
                <ActionIcon
                  component="a"
                  href="https://github.com/Cycle-Stark/stark-deployer"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="gray"
                  size="sm"
                >
                  <IconBrandGithub size={16} />
                </ActionIcon>
                <ActionIcon
                  component="a"
                  href="https://x.com/dalaboroscience"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="subtle"
                  color="gray"
                  size="sm"
                >
                  <IconBrandX size={16} />
                </ActionIcon>
              </Group>
            </Stack>

            {/* Product */}
            <Stack gap="xs">
              <Text size="sm" fw={600}>Product</Text>
              <Anchor component={Link} href="/app" size="xs" c="dimmed" underline="never">
                Launch App
              </Anchor>
              <Anchor component={Link} href="/blog" size="xs" c="dimmed" underline="never">
                Blog
              </Anchor>
              <Anchor component={Link} href="/#features" size="xs" c="dimmed" underline="never">
                Features
              </Anchor>
            </Stack>

            {/* Resources */}
            <Stack gap="xs">
              <Text size="sm" fw={600}>Resources</Text>
              <Anchor href="https://github.com/Cycle-Stark/stark-deployer" target="_blank" rel="noopener noreferrer" size="xs" c="dimmed" underline="never">
                GitHub Repository
              </Anchor>
              <Anchor href="https://docs.starknet.io" target="_blank" rel="noopener noreferrer" size="xs" c="dimmed" underline="never">
                Starknet Docs
              </Anchor>
              <Anchor href="https://book.cairo-lang.org" target="_blank" rel="noopener noreferrer" size="xs" c="dimmed" underline="never">
                Cairo Book
              </Anchor>
            </Stack>

            {/* Legal */}
            <Stack gap="xs">
              <Text size="sm" fw={600}>Legal</Text>
              <Anchor component={Link} href="/terms" size="xs" c="dimmed" underline="never">
                Terms & Conditions
              </Anchor>
              <Anchor component={Link} href="/privacy" size="xs" c="dimmed" underline="never">
                Privacy Policy
              </Anchor>
            </Stack>
          </SimpleGrid>

          <Divider my="lg" color={isDark ? theme.colors.dark[5] : theme.colors.gray[3]} />

          <Text size="xs" c="dimmed" ta="center">
            &copy; {new Date().getFullYear()} Stark Deployer. All rights reserved. Built for the Starknet community.
          </Text>
        </Container>
      </Box>
    </Box>
  );
}
