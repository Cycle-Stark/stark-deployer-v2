import DefaultMainLayout from '@/layouts/DefaultMainLayout';
import { Container, Title, Text, Stack } from '@mantine/core';

function TermsPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Title order={1}>Terms & Conditions</Title>
        <Text c="dimmed">Last updated: February 2026</Text>

        <Stack gap="md">
          <Title order={3}>1. Acceptance of Terms</Title>
          <Text>
            By accessing and using Stark Deployer, you accept and agree to be bound by
            these Terms and Conditions. If you do not agree, please do not use the service.
          </Text>

          <Title order={3}>2. Description of Service</Title>
          <Text>
            Stark Deployer is a web-based tool for deploying and interacting with smart
            contracts on the Starknet blockchain. The service is provided as-is for
            development and testing purposes.
          </Text>

          <Title order={3}>3. User Responsibilities</Title>
          <Text>
            You are responsible for the security of your wallet and private keys. You
            understand that blockchain transactions are irreversible and accept all risks
            associated with interacting with smart contracts.
          </Text>

          <Title order={3}>4. Limitation of Liability</Title>
          <Text>
            Stark Deployer is provided without warranty. We are not liable for any losses
            arising from the use of this service, including but not limited to loss of
            funds from smart contract interactions.
          </Text>

          <Title order={3}>5. Changes to Terms</Title>
          <Text>
            We reserve the right to modify these terms at any time. Continued use of the
            service after changes constitutes acceptance of the updated terms.
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}

TermsPage.PageLayout = DefaultMainLayout;
export default TermsPage;
