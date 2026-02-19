import DefaultMainLayout from '@/layouts/DefaultMainLayout';
import { Container, Title, Text, Stack } from '@mantine/core';

function PrivacyPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Privacy Policy</Title>
        <Text c="dimmed">Last updated: February 2026</Text>

        <Stack gap="md">
          <Title order={3}>1. Information We Collect</Title>
          <Text>
            Stark Deployer operates entirely in your browser. We do not collect personal
            data, wallet addresses, or transaction history. All contract data is stored
            locally in your browser using IndexedDB.
          </Text>

          <Title order={3}>2. Local Storage</Title>
          <Text>
            Your contracts, settings, and interaction history are stored locally on your
            device. This data is not transmitted to any server. Clearing your browser data
            will remove all stored information.
          </Text>

          <Title order={3}>3. Third-Party Services</Title>
          <Text>
            The application connects to Starknet RPC endpoints to interact with the
            blockchain. These connections are necessary for the service to function. We
            recommend reviewing the privacy policies of any RPC providers you configure.
          </Text>

          <Title order={3}>4. Cookies</Title>
          <Text>
            We use a single cookie to store your theme preference (light/dark mode). No
            tracking or analytics cookies are used.
          </Text>

          <Title order={3}>5. Contact</Title>
          <Text>
            If you have questions about this privacy policy, please open an issue on our
            GitHub repository.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}

PrivacyPage.PageLayout = DefaultMainLayout;
export default PrivacyPage;
