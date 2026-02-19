import {
  Title,
  Text,
  Button,
  Stack,
  Container,
  Box,
  Group,
  ThemeIcon,
  SimpleGrid,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconBrandGithub,
  IconCode,
  IconEye,
  IconGitFork,
} from '@tabler/icons-react';

const points = [
  {
    icon: IconCode,
    title: 'Fully Open Source',
    description: 'Every line of code is publicly available. Audit, fork, or contribute.',
    color: 'violet',
  },
  {
    icon: IconEye,
    title: 'Transparent',
    description: 'No hidden logic, no tracking, no data collection. What you see is what you get.',
    color: 'teal',
  },
  {
    icon: IconGitFork,
    title: 'Community Driven',
    description: 'Contributions, bug reports, and feature requests are always welcome.',
    color: 'blue',
  },
];

export default function OpenSourceSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              Free & open source
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Built in the open for the Starknet developer community.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" w="100%">
            {points.map((point) => (
              <Stack
                key={point.title}
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
                <ThemeIcon size={44} radius="md" color={point.color} variant="light">
                  <point.icon size={22} />
                </ThemeIcon>
                <Text fw={600}>{point.title}</Text>
                <Text size="sm" c="dimmed">{point.description}</Text>
              </Stack>
            ))}
          </SimpleGrid>

          <Group gap="md">
            <Button
              component="a"
              href="https://github.com/Cycle-Stark/stark-deployer"
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              radius="md"
              variant="filled"
              color="dark"
              leftSection={<IconBrandGithub size={20} />}
            >
              View on GitHub
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
