import {
  Title,
  Text,
  Stack,
  Container,
  Box,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconWallet, IconUpload, IconPlayerPlay, IconArrowRight } from '@tabler/icons-react';

const steps = [
  {
    step: 1,
    icon: IconWallet,
    title: 'Connect Wallet',
    description: 'Connect your Starknet wallet (Argent X or Braavos) to get started.',
    color: 'violet',
  },
  {
    step: 2,
    icon: IconUpload,
    title: 'Deploy or Import',
    description: 'Deploy a new contract from Sierra/CASM or import an existing one by address.',
    color: 'blue',
  },
  {
    step: 3,
    icon: IconPlayerPlay,
    title: 'Interact & Monitor',
    description: 'Call functions, invoke transactions, and track all your contract interactions.',
    color: 'green',
  },
];

export default function HowItWorksSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box
      py={{ base: 60, md: 80 }}
      bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              How it works
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Get started in three simple steps.
            </Text>
          </Stack>

          {/* Steps with connectors */}
          <Box w="100%">
            {/* Desktop: horizontal layout with arrows */}
            <Box visibleFrom="sm">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: 0,
              }}>
                {steps.map((item, index) => (
                  <div key={item.step} style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Stack align="center" ta="center" gap="sm" style={{ width: 220 }}>
                      <ThemeIcon size={60} radius="xl" color={item.color} variant="light">
                        <item.icon size={28} />
                      </ThemeIcon>
                      <Text
                        size="10px"
                        fw={700}
                        tt="uppercase"
                        c={item.color}
                        lh={1}
                      >
                        Step {item.step}
                      </Text>
                      <Text fw={600} size="lg">{item.title}</Text>
                      <Text size="sm" c="dimmed">{item.description}</Text>
                    </Stack>
                    {index < steps.length - 1 && (
                      <Box mt={18} px="md">
                        <ThemeIcon
                          size={24}
                          radius="xl"
                          variant="subtle"
                          color="dimmed"
                        >
                          <IconArrowRight size={16} />
                        </ThemeIcon>
                      </Box>
                    )}
                  </div>
                ))}
              </div>
            </Box>

            {/* Mobile: vertical layout with line connectors */}
            <Box hiddenFrom="sm">
              <Stack gap={0} align="center">
                {steps.map((item, index) => (
                  <div key={item.step}>
                    <Stack align="center" ta="center" gap="sm">
                      <ThemeIcon size={60} radius="xl" color={item.color} variant="light">
                        <item.icon size={28} />
                      </ThemeIcon>
                      <Text
                        size="10px"
                        fw={700}
                        tt="uppercase"
                        c={item.color}
                        lh={1}
                      >
                        Step {item.step}
                      </Text>
                      <Text fw={600} size="lg">{item.title}</Text>
                      <Text size="sm" c="dimmed" maw={280}>{item.description}</Text>
                    </Stack>
                    {index < steps.length - 1 && (
                      <Stack align="center" gap={0} my="xs">
                        <Box
                          w={2}
                          h={30}
                          bg={isDark ? theme.colors.dark[4] : theme.colors.gray[4]}
                          style={{ borderRadius: 1 }}
                        />
                      </Stack>
                    )}
                  </div>
                ))}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
