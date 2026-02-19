import {
  Stack,
  Text,
  Button,
  Group,
  Center,
  Paper,
  ThemeIcon,
  useMantineColorScheme ,
  useMantineTheme
} from '@mantine/core';
import { IconHome, IconArrowLeft, IconExclamationMark } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import DefaultMainLayout from '@/layouts/DefaultMainLayout';

export default function Custom404() {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme()

  const handleGoHome = () => {
    router.push('/app');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <DefaultMainLayout>
      <Center h="calc(100vh - 200px)" p="xl">
        <Paper
          p="xl"
          radius="lg"
          shadow="sm"
          bg={isDark ? theme.colors.dark[9] : theme.colors.gray[0]}
          style={{
            textAlign: 'center',
            maxWidth: 500,
            width: '100%'
          }}
        >
          <Stack gap="lg" align="center">
            {/* Error Icon */}
            <ThemeIcon
              size={80}
              radius="lg"
              color="violet"
              variant={isDark ? "filled" : "light"}
            >
              <IconExclamationMark size={40} />
            </ThemeIcon>

            {/* Error Code */}
            <Text
              size="6rem"
              fw={900}
              variant="gradient"
              gradient={{ from: 'violet', to: 'indigo', deg: 45 }}
              style={{ lineHeight: 1 }}
            >
              404
            </Text>

            {/* Error Message */}
            <Stack gap="xs" align="center">
              <Text size="xl" fw={600}>
                Page Not Found
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                The page you're looking for doesn't exist or has been moved.
                Please check the URL or navigate back to a safe place.
              </Text>
            </Stack>

            {/* Action Buttons */}
            <Group gap="sm" mt="md">
              <Button
                variant="filled"
                leftSection={<IconHome size={20} />}
                onClick={handleGoHome}
                size="md"
                radius="md"
              >
                Go Home
              </Button>
              <Button
                variant="outline"
                leftSection={<IconArrowLeft size={20} />}
                onClick={handleGoBack}
                size="md"
                radius="md"
              >
                Go Back
              </Button>
            </Group>

            {/* Additional Help */}
            <Text size="xs" c="dimmed" mt="lg">
              If you believe this is an error, please contact support or try refreshing the page.
            </Text>
          </Stack>
        </Paper>
      </Center>
    </DefaultMainLayout>
  );
}
