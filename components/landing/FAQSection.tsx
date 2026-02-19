import {
  Title,
  Text,
  Stack,
  Container,
  Box,
  Accordion,
  ThemeIcon,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconQuestionMark } from '@tabler/icons-react';

const faqs = [
  {
    question: 'Is Stark Deployer free to use?',
    answer:
      'Yes, Stark Deployer is completely free and open source. There are no fees, subscriptions, or hidden costs. You only pay the standard Starknet gas fees for on-chain transactions.',
  },
  {
    question: 'Which networks are supported?',
    answer:
      'Stark Deployer supports Starknet Mainnet, Sepolia testnet, and local Devnet. You can switch between networks from the app settings and deploy or interact with contracts on any of them.',
  },
  {
    question: 'Which wallets can I use?',
    answer:
      'We support Argent X, Braavos, and Keon wallet. Connection is handled through StarknetKit for a seamless experience. You need one of these browser extensions installed to use the app.',
  },
  {
    question: 'How do I deploy a contract?',
    answer:
      'Connect your wallet, navigate to the Deploy page, upload your compiled Sierra and CASM files, fill in the constructor arguments (if any), and click Deploy. The app guides you through each step and shows real-time transaction status.',
  },
  {
    question: 'Can I import contracts I did not deploy?',
    answer:
      'Absolutely. Use the Import page to add any existing Starknet contract by its address. The app will fetch the ABI automatically and let you interact with all its functions; both read (call) and write (invoke).',
  },
  {
    question: 'What are the Handy Tools?',
    answer:
      'Handy Tools is a sidebar with 10+ developer utilities: universal hex/decimal/string converter, large number creator, felt/string encoder, ERC-20 token approvals, block timestamp fetcher, Starknet ID resolver, transaction lookup, a notes manager, and more.',
  },
  {
    question: 'Is my data stored securely?',
    answer:
      'All data (contracts, interactions, settings, notes) is stored locally in your browser using IndexedDB. Nothing is sent to any external server. Your wallet connection is non-custodial; we never have access to your private keys.',
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No installation required: Stark Deployer runs entirely in your browser. You just need a Starknet wallet extension (Argent X, Braavos, or Keon) installed in your browser to sign transactions.',
  },
];

export default function FAQSection() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();

  return (
    <Box
      py={{ base: 60, md: 80 }}
      bg={isDark ? theme.colors.dark[8] : theme.colors.gray[0]}
    >
      <Container size="md">
        <Stack align="center" gap="xl">
          <Stack align="center" gap="xs" ta="center">
            <Title order={2} size="2rem" fw={700}>
              Frequently asked questions
            </Title>
            <Text size="md" c="dimmed" maw={500}>
              Everything you need to know before getting started.
            </Text>
          </Stack>

          <Accordion
            variant="separated"
            radius="md"
            w="100%"
            styles={{
              item: {
                background: isDark ? theme.colors.dark[7] : theme.white,
                border: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[3]}`,
              },
              control: {
                paddingTop: 14,
                paddingBottom: 14,
              },
            }}
          >
            {faqs.map((faq, i) => (
              <Accordion.Item key={i} value={`faq-${i}`}>
                <Accordion.Control
                  icon={
                    <ThemeIcon size={24} radius="xl" color="violet" variant="light">
                      <IconQuestionMark size={14} />
                    </ThemeIcon>
                  }
                >
                  <Text size="sm" fw={600}>{faq.question}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Text size="sm" c="dimmed" lh={1.6}>{faq.answer}</Text>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Container>
    </Box>
  );
}
