import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Container,
  Box,
  Image,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconRocket, IconArrowDown } from '@tabler/icons-react';
import Link from 'next/link';

export default function HeroSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box
      py={{ base: 60, md: 100 }}
      style={{
        background: isDark
          ? `linear-gradient(180deg, ${theme.colors.dark[8]} 0%, ${theme.colors.dark[7]} 100%)`
          : `linear-gradient(180deg, ${theme.white} 0%, ${theme.colors.gray[0]} 100%)`,
      }}
    >
      <Container size="md">
        <Stack align="center" gap="xl" ta="center">
          <Title order={1} size="3rem" fw={800} lh={1.2}>
            Deploy and interact with{' '}
            <Text component="span" inherit c="violet">
              Starknet
            </Text>{' '}
            contracts with ease
          </Title>

          <Text size="lg" c="dimmed" maw={600}>
            Deploy to Starknet Mainnet, Sepolia, and Devnet. Import existing
            contracts, test functions, monitor transactions, and manage
            everything from one interface.
          </Text>

          <Group gap="md" mt="md">
            <Button
              component={Link}
              href="/app"
              size="lg"
              radius="md"
              color="violet"
              leftSection={<IconRocket size={20} />}
            >
              Go to App
            </Button>
            <Button
              component="a"
              href="#features"
              size="lg"
              radius="md"
              variant="outline"
              color="violet"
              leftSection={<IconArrowDown size={20} />}
            >
              Learn More
            </Button>
          </Group>
          <Image
            src={isDark ? "/images/img_1.png" : "/images/img_2.png"}
            alt="App screenshot"
            radius="lg"
            mt="md"
            style={{
              border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
              boxShadow: isDark
                ? '0 8px 32px rgba(0,0,0,0.4)'
                : '0 8px 32px rgba(0,0,0,0.1)',
            }}
          />
        </Stack>
      </Container>
    </Box>
  );
}
