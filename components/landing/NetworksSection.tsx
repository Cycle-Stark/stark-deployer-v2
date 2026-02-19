import {
  Title,
  Text,
  Group,
  Stack,
  Container,
  Box,
  Badge,
  ThemeIcon,
  SimpleGrid,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconWorld, IconTestPipe, IconServer } from '@tabler/icons-react';

const networks = [
  {
    icon: IconWorld,
    name: 'Mainnet',
    description: 'Deploy production-ready contracts to Starknet Mainnet.',
    color: 'green',
    badge: 'Production',
  },
  {
    icon: IconTestPipe,
    name: 'Sepolia',
    description: 'Test and iterate on Starknet\'s public testnet before going live.',
    color: 'blue',
    badge: 'Testnet',
  },
  {
    icon: IconServer,
    name: 'Devnet',
    description: 'Rapid local development with instant feedback and zero gas costs.',
    color: 'orange',
    badge: 'Local',
  },
];

export default function NetworksSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              Deploy to any network
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Seamlessly switch between Mainnet, Sepolia testnet, and local Devnet.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" w="100%">
            {networks.map((net) => (
              <Stack
                key={net.name}
                align="center"
                ta="center"
                gap="sm"
                p="lg"
                style={{
                  border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
                  borderRadius: theme.radius.md,
                  background: isDark ? theme.colors.dark[7] : theme.white,
                }}
              >
                <ThemeIcon size={48} radius="xl" color={net.color} variant="light">
                  <net.icon size={24} />
                </ThemeIcon>
                <Group gap={6}>
                  <Text fw={600} size="lg">{net.name}</Text>
                  <Badge variant="light" color={net.color} size="xs">{net.badge}</Badge>
                </Group>
                <Text size="sm" c="dimmed">{net.description}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
