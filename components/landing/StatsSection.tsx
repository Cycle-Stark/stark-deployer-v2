import {
  Text,
  Group,
  Stack,
  Container,
  Box,
  SimpleGrid,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconSparkles,
  IconWorld,
  IconCurrencyDollarOff,
  IconBrandOpenSource,
} from '@tabler/icons-react';

const stats = [
  {
    icon: IconCurrencyDollarOff,
    value: '100% Free',
    label: 'No fees, no subscriptions',
    color: 'green',
  },
  {
    icon: IconBrandOpenSource,
    value: 'Open Source',
    label: 'Transparent & community-driven',
    color: 'violet',
  },
  {
    icon: IconWorld,
    value: '3 Networks',
    label: 'Mainnet, Sepolia & Devnet',
    color: 'blue',
  },
  {
    icon: IconSparkles,
    value: '10+ Tools',
    label: 'Built-in developer utilities',
    color: 'orange',
  },
];

export default function StatsSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box
      py={{ base: 40, md: 50 }}
      bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
          {stats.map((stat) => (
            <Stack key={stat.label} align="center" ta="center" gap={6}>
              <ThemeIcon size={40} radius="xl" color={stat.color} variant="light">
                <stat.icon size={20} />
              </ThemeIcon>
              <Text fw={700} size="xl">{stat.value}</Text>
              <Text size="xs" c="dimmed">{stat.label}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
