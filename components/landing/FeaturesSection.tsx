import {
  Title,
  Text,
  SimpleGrid,
  Card,
  ThemeIcon,
  Stack,
  Container,
  Box,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconRocket,
  IconCloudDownload,
  IconSend2,
  IconActivity,
  IconSparkles,
  IconTerminal,
} from '@tabler/icons-react';

const features = [
  {
    icon: IconRocket,
    title: 'Deploy Contracts',
    description:
      'Deploy Cairo smart contracts to Mainnet, Sepolia, or Devnet with a guided step-by-step process.',
  },
  {
    icon: IconCloudDownload,
    title: 'Import & Manage',
    description:
      'Import existing contracts by address and manage all your contracts in one organized dashboard.',
  },
  {
    icon: IconSend2,
    title: 'Interactive Testing',
    description:
      'Call and invoke contract functions directly from the interface with auto-generated forms from the ABI.',
  },
  {
    icon: IconActivity,
    title: 'Monitor & Track',
    description:
      'Track every interaction, monitor transaction statuses, and review historical call data for your contracts.',
  },
  {
    icon: IconSparkles,
    title: 'Handy Tools',
    description:
      '10+ built-in developer tools: Universal converter, felt/string encoder, token approvals, Starknet ID resolver, notes, and more.',
  },
  {
    icon: IconTerminal,
    title: 'System Logs',
    description:
      'Real-time system logs panel that captures every action, transaction, and error for full transparency.',
  },
];

export default function FeaturesSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box py={{ base: 60, md: 80 }} id="features">
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              Everything you need
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              A complete toolkit for working with Starknet smart contracts.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" w="100%">
            {features.map((feature) => (
              <Card
                key={feature.title}
                padding="lg"
                radius="md"
                withBorder
                bg={isDark ? theme.colors.dark[7] : theme.white}
              >
                <Stack gap="sm">
                  <ThemeIcon size={44} radius="md" color="violet" variant="light">
                    <feature.icon size={24} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">
                    {feature.title}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {feature.description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
