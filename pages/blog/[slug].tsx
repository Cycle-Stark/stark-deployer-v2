import DefaultMainLayout from '@/layouts/DefaultMainLayout';
import { Container, Title, Text, Stack, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import Link from 'next/link';

function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;

  const formattedTitle = typeof slug === 'string'
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Blog Post';

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Button
          component={Link}
          href="/blog"
          variant="subtle"
          color="dimmed"
          leftSection={<IconArrowLeft size={16} />}
          w="fit-content"
          px={0}
        >
          Back to Blog
        </Button>

        <Title order={1}>{formattedTitle}</Title>
        <Text c="dimmed" size="sm">Published on February 2026</Text>

        <Text>
          This blog post is coming soon. Check back later for the full article.
        </Text>
      </Stack>
    </Container>
  );
}

BlogPostPage.PageLayout = DefaultMainLayout;
export default BlogPostPage;
