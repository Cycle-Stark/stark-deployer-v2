import {
  Title,
  Text,
  Button,
  Stack,
  Container,
  Box,
  Group,
  Divider,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconRocket,
  IconBrandGithub,
  IconBug,
  IconBulb,
  IconGitPullRequest,
} from '@tabler/icons-react';
import Link from 'next/link';

const contributeLinks = [
  {
    icon: IconBug,
    label: 'Report a Bug',
    href: 'https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=bug',
    color: 'red',
  },
  {
    icon: IconBulb,
    label: 'Request a Feature',
    href: 'https://github.com/Cycle-Stark/stark-deployer/issues/new?labels=enhancement',
    color: 'yellow',
  },
  {
    icon: IconGitPullRequest,
    label: 'Submit a PR',
    href: 'https://github.com/Cycle-Stark/stark-deployer/pulls',
    color: 'green',
  },
];

export default function CTASection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box
      py={{ base: 60, md: 80 }}
      bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
    >
      <Container size="sm">
        <Stack align="center" gap="xl" ta="center">
          {/* Launch CTA */}
          <Stack align="center" gap="lg">
            <Title order={2} size="2rem" fw={700}>
              Ready to deploy?
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Deploy to Mainnet, Sepolia, or Devnet and start interacting with your Starknet contracts today.
            </Text>
            <Button
              component={Link}
              href="/app"
              size="lg"
              radius="md"
              color="violet"
              leftSection={<IconRocket size={20} />}
            >
              Launch App
            </Button>
          </Stack>

          <Divider
            w="100%"
            label="or help us make it better"
            labelPosition="center"
            color={isDark ? theme.colors.dark[4] : theme.colors.gray[4]}
          />

          {/* Contribute CTA */}
          <Stack align="center" gap="md">
            <Text size="sm" c="dimmed" maw={400}>
              Stark Deployer is open source and built by the community.
              Found a bug? Have an idea? Contributions of all kinds are welcome.
            </Text>

            <Group gap="sm" justify="center" wrap="wrap">
              {contributeLinks.map((item) => (
                <Button
                  key={item.label}
                  component="a"
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  radius="md"
                  variant="light"
                  color={item.color}
                  leftSection={<item.icon size={16} />}
                >
                  {item.label}
                </Button>
              ))}
            </Group>

            <Button
              component="a"
              href="https://github.com/Cycle-Stark/stark-deployer"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              radius="md"
              variant="subtle"
              color="gray"
              leftSection={<IconBrandGithub size={16} />}
            >
              View on GitHub
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
