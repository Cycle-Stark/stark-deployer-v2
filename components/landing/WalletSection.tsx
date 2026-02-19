import {
  Title,
  Text,
  Stack,
  Container,
  Box,
  Group,
  Badge,
  ThemeIcon,
  SimpleGrid,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconWallet,
  IconShieldCheck,
  IconPlugConnected,
} from '@tabler/icons-react';

const wallets = [
  {
    name: 'Argent X',
    description: 'The most popular Starknet wallet with built-in security features and account abstraction.',
    color: 'orange',
  },
  {
    name: 'Braavos',
    description: 'Feature-rich Starknet wallet with hardware signer support and multi-factor authentication.',
    color: 'blue',
  },
  {
    name: 'Keon',
    description: 'A modern Starknet wallet built for developers with a streamlined signing experience.',
    color: 'grape',
  },
];

const highlights = [
  {
    icon: IconShieldCheck,
    title: 'Non-Custodial',
    description: 'Your keys, your contracts. We never have access to your wallet or private keys.',
    color: 'green',
  },
  {
    icon: IconPlugConnected,
    title: 'StarknetKit Integration',
    description: 'Seamless wallet connection powered by StarknetKit for a reliable experience.',
    color: 'violet',
  },
];

export default function WalletSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              Wallet compatibility
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Connect with the Starknet wallets you already use and trust.
            </Text>
          </Stack>

          {/* Supported wallets */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" w="100%">
            {wallets.map((wallet) => (
              <Stack
                key={wallet.name}
                gap="sm"
                p="lg"
                style={{
                  border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                  borderRadius: theme.radius.md,
                  background: isDark ? theme.colors.dark[7] : theme.white,
                }}
              >
                <Group gap="sm">
                  <ThemeIcon size={36} radius="md" color={wallet.color} variant="light">
                    <IconWallet size={20} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600}>{wallet.name}</Text>
                    <Badge variant="light" color={wallet.color} size="xs">Supported</Badge>
                  </div>
                </Group>
                <Text size="sm" c="dimmed">{wallet.description}</Text>
              </Stack>
            ))}
          </SimpleGrid>

          {/* Security highlights */}
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" w="100%" maw={700}>
            {highlights.map((item) => (
              <Group
                key={item.title}
                gap="sm"
                p="md"
                align="flex-start"
                style={{
                  border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                  borderRadius: theme.radius.md,
                  background: isDark ? theme.colors.dark[7] : theme.white,
                }}
              >
                <ThemeIcon size={36} radius="md" color={item.color} variant="light">
                  <item.icon size={20} />
                </ThemeIcon>
                <Stack gap={4} style={{ flex: 1 }}>
                  <Text fw={600} size="sm">{item.title}</Text>
                  <Text size="xs" c="dimmed">{item.description}</Text>
                </Stack>
              </Group>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
