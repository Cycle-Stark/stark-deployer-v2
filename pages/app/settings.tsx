import { AppLayout } from '@/layouts/AppLayout';
import {
  Text,
  Stack,
  TextInput,
  Switch,
  Button,
  Group,
  Select,
  Alert,
  NumberInput,
  MultiSelect,
  ColorInput,
  Slider,
  Textarea,
  SimpleGrid,
  Box,
  ScrollArea,
  Radio,
  useMantineColorScheme,
  useComputedColorScheme,
  MantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  IconInfoCircle,
  IconPalette,
  IconNetwork,
  IconGasStation,
  IconShield,
  IconCode,
  IconBell,
  IconDatabase,
  IconSettings,
  IconDeviceDesktopDown
} from '@tabler/icons-react';
import { useSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';
import CustomCardWithHeaderAndFooter from '@/components/common/CustomCardWithHeaderAndFooter';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { ISiteSettings } from '@/types';
import InnerLayout from '@/layouts/InnerLayout';
import CustomRadioInput from '@/components/common/CustomRadioInput';

function SettingsPage() {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const inputRadius = "md"
  const theme = useMantineTheme()

  const form = useForm<ISiteSettings>({
    initialValues: {
      ...settings,
    },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.uiux?.showLogs) {
        errors.uiux = 'showLogs is required';
      }
      if (!values.starknet?.networks?.mainnet?.rpcUrl) {
        errors.starknet = 'mainnet rpcUrl is required';
      }
      if (!values.starknet?.networks?.sepolia?.rpcUrl) {
        errors.starknet = 'sepolia rpcUrl is required';
      }
      if (!values.starknet?.networks?.devnet?.rpcUrl) {
        errors.starknet = 'devnet rpcUrl is required';
      }

      return errors;
    }
  });

  const handleResetSettings = async () => {
    try {
      await resetSettings();
      setHasChanges(false);
      notifications.show({
        title: 'Settings Reset',
        message: 'All settings have been reset to defaults.',
        color: 'blue',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to reset settings. Please try again.',
        color: 'red',
      });
    }
  };

  const SubmitButton = ({ disabled }: { disabled?: boolean }) => {

    return (
      <Group justify="right">
        <Button
          variant="light"
          color='green'
          fw={400} radius={"md"}
          leftSection={<IconDeviceDesktopDown size={16} />}
          disabled={!form.isTouched() || disabled}
          loading={form.submitting}
          onClick={async () => {
            try {
              await updateSettings(form.values)
              form.reset()
              notifications.show({
                title: 'Settings Saved',
                message: 'Your settings have been saved successfully.',
                color: 'green',
                radius: "md",
              })
            } catch (error) {
              notifications.show({
                title: 'Error',
                message: 'Failed to save settings. Please try again.',
                color: 'red',
              })
            }
          }}
        >
          Save Settings
        </Button>
      </Group>
    )
  }

  const { setColorScheme, colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (settings && !isLoading) {
      form.setValues(settings);
    }
  }, [settings]);


  if (isLoading) {
    return (
      <AppLayout>
        <Text>Loading settings...</Text>
      </AppLayout>
    );
  }

  return (
    <InnerLayout showLogsButton={false}>
      <ScrollArea scrollbars="y" offsetScrollbars p="md" h="100%">
        <Stack gap="lg">
          <div>
            <Text size="xl" fw={600}>
              Settings
            </Text>
            <Text size="sm" c="dimmed">
              Manage your application preferences and configuration.
            </Text>
          </div>

          {/* UI/UX Settings */}
          <CustomCardWithHeaderAndFooter
            title="UI/UX Settings"
            subtitle="Customize the interface and user experience"
            Icon={IconPalette}
            description="Theme, layout, and interaction preferences"
            footerContent={<SubmitButton />}
          >
            <Stack gap="md">
              <Radio.Group
                value={colorScheme}
                onChange={(value) => {
                  console.log("Value: ", value)
                  setColorScheme(value as MantineColorScheme)
                }
                }
                label="Theme"
              >
                <SimpleGrid cols={{ base: 6 }} spacing="md">
                  <CustomRadioInput item={{ name: 'Light', description: 'Light theme', value: 'light' }} />
                  <CustomRadioInput item={{ name: 'Dark', description: 'Dark theme', value: 'dark' }} />
                </SimpleGrid>
              </Radio.Group>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Switch
                  label="Show Logs"
                  description="Display application logs in the interface"
                  {...form.getInputProps('uiux.showLogs', { type: "checkbox" })}
                  radius={inputRadius}
                />

                <Switch
                  label="Enable Animations"
                  description="Enable smooth transitions and animations"
                  {...form.getInputProps('uiux.enableAnimations', { type: "checkbox" })}
                  radius={inputRadius}
                />

                <Select
                  label="Tab Size"
                  description="Code indentation size"
                  {...form.getInputProps('uiux.serialization.tabSize')}
                  data={[
                    { value: '2', label: '2 spaces' },
                    { value: '4', label: '4 spaces' },
                    { value: '8', label: '8 spaces' }
                  ]}
                  radius={inputRadius}
                />

                <Select
                  label="Default Page Size"
                  description="Number of items per page in tables"
                  {...form.getInputProps('uiux.defaultPageSize')}
                  data={[
                    { value: '10', label: '10 items' },
                    { value: '15', label: '15 items' },
                    { value: '20', label: '20 items' },
                    { value: '50', label: '50 items' }
                  ]}
                  radius={inputRadius}
                />

                <Select
                  label="View Mode"
                  description="Default layout density"
                  {...form.getInputProps('uiux.viewMode')}
                  data={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'expanded', label: 'Expanded' }
                  ]}
                  radius={inputRadius}
                />

                <NumberInput
                  label="Auto-refresh Interval"
                  description="Contract interactions refresh rate (seconds)"
                  {...form.getInputProps('uiux.autoRefreshIntervals.contractInteractions')}
                  min={5}
                  max={300}
                  radius={inputRadius}
                />
              </SimpleGrid>
            </Stack>
          </CustomCardWithHeaderAndFooter>

          {/* Network & Chain Settings */}
          <CustomCardWithHeaderAndFooter
            title="Network & Chain Settings"
            subtitle="Configure blockchain networks and connections"
            Icon={IconNetwork}
            description="RPC endpoints, explorers, and network preferences"
            footerContent={<SubmitButton />}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Active Chain"
                description="Primary blockchain network"
                {...form.getInputProps('activeChain')}
                data={[
                  { value: 'starknet', label: 'Starknet' },
                  // { value: 'ethereum', label: 'Ethereum' },
                  // { value: 'sepolia', label: 'Sepolia' },
                  // { value: 'arbitrum', label: 'Arbitrum' },
                  // { value: 'base', label: 'Base' },
                  // { value: 'polygon', label: 'Polygon' },
                  // { value: 'bsc', label: 'BSC' },
                  // { value: 'avalanche', label: 'Avalanche' }
                ]}
                radius={inputRadius}
              />

              <Select
                label="Active Network"
                description="Primary blockchain network"
                {...form.getInputProps('activeNetwork')}
                data={[
                  { value: 'mainnet', label: 'Mainnet' },
                  { value: 'sepolia', label: 'Sepolia' },
                  { value: 'devnet', label: 'Devnet' }
                ]}
                radius={inputRadius}
              />

            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

          <CustomCardWithHeaderAndFooter
            title="Starknet Settings"
            subtitle="Configure Starknet networks and connections"
            Icon={IconNetwork}
            description="RPC endpoints, explorers, and network preferences"
            footerContent={<SubmitButton />}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <TextInput
                label="Mainnet RPC URL"
                description="Mainnet RPC endpoint"
                {...form.getInputProps('starknet.networks.mainnet.rpcUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Mainnet Explorer URL"
                description="Mainnet Explorer endpoint"
                {...form.getInputProps('starknet.networks.mainnet.explorerUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Sepolia RPC URL"
                description="Sepolia RPC endpoint"
                {...form.getInputProps('starknet.networks.sepolia.rpcUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Sepolia Explorer URL"
                description="Sepolia Explorer endpoint"
                {...form.getInputProps('starknet.networks.sepolia.explorerUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Devnet RPC URL"
                description="Devnet RPC endpoint"
                {...form.getInputProps('starknet.networks.devnet.rpcUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Devnet Explorer URL"
                description="Devnet Explorer endpoint"
                {...form.getInputProps('starknet.networks.devnet.explorerUrl')}
                radius={inputRadius}
              />
              <TextInput
                label="Devnet Seed"
                description="Devnet seed to ensure state consistency"
                {...form.getInputProps('starknet.networks.devnet.seed')}
                radius={inputRadius}
              />
              <TextInput
                label="Devnet Dump Path"
                description="Devnet dump path"
                {...form.getInputProps('starknet.networks.devnet.dumpPath')}
                radius={inputRadius}
              />
            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

          {/* Gas & Transaction Settings */}
          <CustomCardWithHeaderAndFooter
            title="Gas & Transaction Settings"
            subtitle="Configure gas estimation and transaction behavior"
            Icon={IconGasStation}
            description="Gas limits, timeouts, and optimization preferences"
            footerContent={<SubmitButton disabled={true} />}
            disabled={true}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Switch
                label="Show Gas Estimation"
                description="Display gas estimates before transactions"
                {...form.getInputProps('gasTransaction.showGasEstimation', {
                  type: 'checkbox',
                })}
                radius={inputRadius}
              />

              <Switch
                label="Auto-calculate Gas"
                description="Automatically calculate optimal gas values"
                {...form.getInputProps('gasTransaction.autoCalculateGas', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Gas Price Alerts"
                description="Show alerts for high gas prices"
                {...form.getInputProps('gasTransaction.gasPriceAlerts', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Auto-retry Failed Transactions"
                description="Automatically retry failed transactions"
                {...form.getInputProps('gasTransaction.autoRetryFailedTransactions', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Gas Optimization Suggestions"
                description="Show suggestions to optimize gas usage"
                {...form.getInputProps('gasTransaction.gasOptimizationSuggestions', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <NumberInput
                label="Transaction Timeout (seconds)"
                description="Maximum time to wait for transaction confirmation"
                {...form.getInputProps('gasTransaction.transactionTimeout')}
                radius={inputRadius}
                min={30}
                max={3600}
              />
            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

          {/* Security & Privacy Settings */}
          <CustomCardWithHeaderAndFooter
            title="Security & Privacy Settings"
            subtitle="Configure security features and privacy options"
            Icon={IconShield}
            description="Wallet security, transaction confirmations, and privacy"
            footerContent={<SubmitButton disabled={true} />}
            disabled={true}
          >
            <Stack gap="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                Your private keys are never stored on our servers. All transactions are signed locally in your wallet.
              </Alert>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <Switch
                  label="Auto-lock Wallet"
                  description="Automatically lock wallet after inactivity"
                  {...form.getInputProps('securityPrivacy.autoLockWallet.enabled', { type: 'checkbox' })}
                  radius={inputRadius}
                />

                <NumberInput
                  label="Auto-lock Timeout (minutes)"
                  description="Minutes of inactivity before auto-lock"
                  {...form.getInputProps('securityPrivacy.autoLockWallet.timeoutMinutes')}
                  radius={inputRadius}
                  min={1}
                  max={120}
                  disabled={!settings.securityPrivacy?.autoLockWallet?.enabled}
                />

                <Switch
                  label="Transaction Confirmation Required"
                  description="Require confirmation for all transactions"
                  {...form.getInputProps('securityPrivacy.transactionConfirmationRequirements.requireConfirmation', { type: 'checkbox' })}
                  radius={inputRadius}
                />

                <NumberInput
                  label="High-value Threshold"
                  description="Amount above which extra confirmation is required"
                  {...form.getInputProps('securityPrivacy.transactionConfirmationRequirements.highValueThreshold')}
                  radius={inputRadius}
                  min={0}
                />

                <Switch
                  label="Phishing Protection"
                  description="Enable phishing protection warnings"
                  {...form.getInputProps('securityPrivacy.phishingProtection', { type: 'checkbox' })}
                  radius={inputRadius}
                />

                <Switch
                  label="Contract Verification Required"
                  description="Only interact with verified contracts"
                  {...form.getInputProps('securityPrivacy.contractVerificationRequired', { type: 'checkbox' })}
                  radius={inputRadius}
                />

                <Switch
                  label="Contract Interaction Warnings"
                  description="Show warnings before contract interactions"
                  {...form.getInputProps('securityPrivacy.contractInteractionWarnings', { type: 'checkbox' })}
                  radius={inputRadius}
                />
              </SimpleGrid>
            </Stack>
          </CustomCardWithHeaderAndFooter>

          {/* Developer Settings */}
          <CustomCardWithHeaderAndFooter
            title="Developer Settings"
            subtitle="Advanced settings for developers"
            Icon={IconCode}
            description="Debug mode, logging, and development tools"
            footerContent={<SubmitButton disabled={true} />}
            disabled={true}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Switch
                label="Debug Mode"
                description="Enable debug mode with additional logging"
                {...form.getInputProps('developer.debugMode', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Select
                label="Verbose Logging"
                description="Set logging verbosity level"
                {...form.getInputProps('developer.verboseLogging')}
                radius={inputRadius}
                data={[
                  { value: 'none', label: 'None' },
                  { value: 'basic', label: 'Basic' },
                  { value: 'verbose', label: 'Verbose' },
                  { value: 'debug', label: 'Debug' }
                ]}
              />

              <Switch
                label="Export Interaction History"
                description="Allow exporting interaction history"
                {...form.getInputProps('developer.exportInteractionHistory', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Development Tools Visible"
                description="Show development tools in the interface"
                {...form.getInputProps('developer.developmentToolsVisible', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="API Rate Limiting"
                description="Enable API rate limiting"
                {...form.getInputProps('developer.apiRateLimiting.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <NumberInput
                label="Requests Per Minute"
                description="Maximum API requests per minute"
                {...form.getInputProps('developer.apiRateLimiting.requestsPerMinute')}
                radius={inputRadius}
                min={1}
                max={1000}
                disabled={!settings.developer?.apiRateLimiting?.enabled}
              />
            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

          {/* Notification Settings */}
          <CustomCardWithHeaderAndFooter
            title="Notification Settings"
            subtitle="Configure notification preferences"
            Icon={IconBell}
            description="Transaction alerts, status updates, and communication"
            footerContent={<SubmitButton disabled={true} />}
            disabled={true}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Switch
                label="Transaction Status Notifications"
                description="Get notified about transaction status changes"
                {...form.getInputProps('notifications.transactionStatus', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Network Status Alerts"
                description="Receive alerts about network status changes"
                {...form.getInputProps('notifications.networkStatus', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Contract Event Notifications"
                description="Get notified about contract events"
                {...form.getInputProps('notifications.contractEvents', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Push Notifications"
                description="Enable browser push notifications"
                {...form.getInputProps('notifications.pushNotifications', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Switch
                label="Gas Price Notifications"
                description="Get notified about gas price changes"
                {...form.getInputProps('notifications.gasPriceNotifications.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <NumberInput
                label="Gas Price Threshold (Gwei)"
                description="Notify when gas price exceeds this threshold"
                {...form.getInputProps('notifications.gasPriceNotifications.thresholdGwei')}
                radius={inputRadius}
                min={1}
                max={1000}
                disabled={!settings.notifications?.gasPriceNotifications?.enabled}
              />

              <Switch
                label="Email Notifications"
                description="Get notified about gas price changes"
                {...form.getInputProps('notifications.emailNotifications.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <TextInput
                label="Email"
                description="Notify when gas price exceeds this threshold"
                {...form.getInputProps('notifications.emailNotifications.email')}
                radius={inputRadius}
                disabled={!form.values.notifications?.emailNotifications?.enabled}
                placeholder='example@example.com'
              />

              <Switch
                label="SMS Notifications"
                description="Get notified about gas price changes"
                {...form.getInputProps('notifications.smsNotifications.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <TextInput
                label="Phone Number"
                description="Notify when gas price exceeds this threshold"
                {...form.getInputProps('notifications.smsNotifications.phoneNumber')}
                radius={inputRadius}
                disabled={!form.values.notifications?.smsNotifications?.enabled}
                placeholder='+1234567890'
              />

            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

          {/* Data Management Settings */}
          <CustomCardWithHeaderAndFooter
            title="Data Management Settings"
            subtitle="Configure data storage and backup preferences"
            Icon={IconDatabase}
            description="History retention, backups, and data export"
            footerContent={<SubmitButton disabled={true} />}
            disabled={true}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Switch
                label="Interaction History Retention"
                description="Keep interaction history for analysis"
                {...form.getInputProps('dataManagement.interactionHistoryRetention.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <NumberInput
                label="Retention Period (days)"
                description="How long to keep interaction history"
                {...form.getInputProps('dataManagement.interactionHistoryRetention.retentionDays')}
                radius={inputRadius}
                min={1}
                max={365}
                disabled={!form.values.dataManagement?.interactionHistoryRetention?.enabled}
              />

              <Switch
                label="Auto-cleanup Old Data"
                description="Automatically remove old data based on retention settings"
                {...form.getInputProps('dataManagement.autoCleanupOldData', { type: 'checkbox' })}
                radius={inputRadius}
              />

              <Select
                label="Backup Frequency"
                description="How often to create data backups"
                {...form.getInputProps('dataManagement.backupFrequency')}
                radius={inputRadius}
                data={[
                  { value: 'never', label: 'Never' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' }
                ]}
              />

              <MultiSelect
                label="Export Formats"
                description="Available formats for data export"
                {...form.getInputProps('dataManagement.exportFormats')}
                radius={inputRadius}
                data={[
                  { value: 'json', label: 'JSON' },
                  { value: 'csv', label: 'CSV' },
                  { value: 'xlsx', label: 'Excel' }
                ]}
              />

              <Switch
                label="Cloud Sync"
                description="Enable cloud synchronization of settings"
                {...form.getInputProps('dataManagement.cloudSync.enabled', { type: 'checkbox' })}
                radius={inputRadius}
              />
            </SimpleGrid>
          </CustomCardWithHeaderAndFooter>

        </Stack>
      </ScrollArea>
    </InnerLayout>
  );
}


SettingsPage.PageLayout = AppLayout;

export default SettingsPage;
