import { useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Container,
  Box,
  Paper,
  Group,
  ActionIcon,
  Image,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const TOTAL_IMAGES = 13;
const images = Array.from({ length: TOTAL_IMAGES }, (_, i) => `/images/img_${i + 1}.png`);

export default function ScreenshotSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <Box py={{ base: 60, md: 80 }}>
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              See it in action
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              A clean, intuitive interface designed for developers.
            </Text>
          </Stack>

          <Paper
            w="100%"
            radius="lg"
            withBorder
            bg={isDark ? theme.colors.dark[6] : theme.colors.gray[1]}
            p="md"
            style={{ overflow: 'hidden' }}
          >
            <Image
              src={images[current]}
              alt={`Screenshot ${current + 1}`}
              radius="md"
              fit="contain"
              style={{ maxHeight: 500 }}
            />
          </Paper>

          <Group gap="sm">
            <ActionIcon variant="light" color="gray" radius="xl" size="lg" onClick={prev}>
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm" c="dimmed" fw={500}>
              {current + 1} / {images.length}
            </Text>
            <ActionIcon variant="light" color="gray" radius="xl" size="lg" onClick={next}>
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>

          {/* Dot indicators */}
          <Group gap={6}>
            {images.map((_, i) => (
              <Box
                key={i}
                w={8}
                h={8}
                style={{
                  borderRadius: '50%',
                  background: i === current
                    ? 'var(--mantine-color-violet-5)'
                    : isDark
                      ? theme.colors.dark[4]
                      : theme.colors.gray[4],
                  cursor: 'pointer',
                  transition: 'background 150ms ease',
                }}
                onClick={() => setCurrent(i)}
              />
            ))}
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
