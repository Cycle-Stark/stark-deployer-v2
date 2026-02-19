import { Button, Group, Text } from '@mantine/core';
import { IconWallet, IconWalletOff } from '@tabler/icons-react';
import { useAppContext } from '@/contexts/AppContext';
import { formatAddress } from '@/utils';

const WalletButton = () => {
  const {
    connectedAccount,
    activeWalletAddress,
    handleConnectWallet,
    handleDisconnectWallet,
  } = useAppContext();

  if (!connectedAccount || !activeWalletAddress) {
    return (
      <Button
        variant="filled"
        leftSection={<IconWallet size={16} />}
        onClick={handleConnectWallet}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      leftSection={<IconWalletOff size={16} />}
      onClick={handleDisconnectWallet}
    >
      <Text size="sm">
        {formatAddress(activeWalletAddress, 6, 4)}
      </Text>
    </Button>
  );
};

export default WalletButton;
