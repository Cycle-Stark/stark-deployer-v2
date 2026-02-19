import DefaultMainLayout from '@/layouts/DefaultMainLayout';
import {
  Container,
  Title,
  Text,
  Stack,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Anchor,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import Link from 'next/link';

const posts = [
  {
    slug: 'getting-started',
    title: 'Getting Started with Stark Deployer',
    excerpt: 'Learn how to deploy your first Starknet smart contract using Stark Deployer.',
    date: 'Feb 15, 2026',
    tag: 'Tutorial',
  },
  {
    slug: 'contract-interaction-tips',
    title: 'Tips for Interacting with Starknet Contracts',
    excerpt: 'Best practices for calling and invoking functions on deployed contracts.',
    date: 'Feb 10, 2026',
    tag: 'Guide',
  },
  {
    slug: 'whats-new-v2',
    title: "What's New in V2",
    excerpt: 'A look at all the new features and improvements in version 2 of Stark Deployer.',
    date: 'Feb 1, 2026',
    tag: 'Announcement',
  },
];

function BlogPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={1}>Blog</Title>
          <Text c="dimmed">Updates, tutorials, and announcements.</Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {posts.map((post) => (
            <Card
              key={post.slug}
              padding="lg"
              radius="md"
              withBorder
              bg={isDark ? theme.colors.dark[7] : theme.white}
              component={Link}
              href={`/blog/${post.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Stack gap="sm">
                <Group justify="space-between">
                  <Badge size="sm" color="violet" variant="light">
                    {post.tag}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {post.date}
                  </Text>
                </Group>
                <Text fw={600}>{post.title}</Text>
                <Text size="sm" c="dimmed">
                  {post.excerpt}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

BlogPage.PageLayout = DefaultMainLayout;
export default BlogPage;
