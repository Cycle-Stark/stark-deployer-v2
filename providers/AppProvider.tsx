import { ReactNode, useEffect, useMemo, useState } from 'react';
import { connect, disconnect } from 'starknetkit';
import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { Account, RpcProvider, shortString } from 'starknet';
import { notifications, showNotification } from '@mantine/notifications';
import { AppContext } from '../contexts/AppContext';
import { useSettings } from '../hooks/useSettings';
import { getChainId, loadStarknetDevnetAccounts, NETWORK_MAP } from '@/components/utils';
import { siteSettingsManager } from '@/storage/siteSettings';
import { InjectedConnector } from 'starknetkit/injected'

interface IAppProvider {
    children: ReactNode;
}

const AppProvider = ({ children }: IAppProvider) => {
    // Settings hook for RPC endpoints
    const { settings, isLoading } = useSettings();

    const [activeChain, setActiveChain] = useState(settings.activeChain)
    const [activeNetwork, setActiveNetwork] = useState(settings.activeNetwork)
    const [areSettingsLoading, setAreSettingsLoading] = useState(isLoading)

    // Simple state
    const [connectedAccount, setConnectedAccount] = useState<any>(null);
    const [activeWalletAddress, setActiveWalletAddress] = useState<string>('');
    const [provider, setProvider] = useState<any>(null);
    const [connection, setConnection] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [devnetAccounts, setDevnetAccounts] = useState<any>([]);

    let enablingCount = 0;

    const connectDevnetAccount = async (index?: number) => {
        if (devnetAccounts?.length > 0) {
            const acc = devnetAccounts[index ?? 0]
            const provider = new RpcProvider({ nodeUrl: `${settings?.starknet.networks.devnet.rpcUrl}/rpc` })
            const account = new Account({
                provider,
                address: acc?.address,
                signer: acc?.private_key
            })
            setProvider(provider)
            setConnectedAccount(account);
            setActiveWalletAddress(acc?.address);
        }
    };


    const handleConnectStarknet = async () => {
        setIsConnecting(true);
        const settings = await siteSettingsManager.getSettings();

        if (areSettingsLoading || !settings) {
            showNotification({
                title: 'Loading Settings',
                message: 'Loading settings...',
                color: 'orange',
                radius: 'md',
                autoClose: 1000
            });
            return;
        };

        try {
            const activeNetwork = settings?.activeNetwork;
            if (!activeNetwork) {
                showNotification({
                    title: 'No active network',
                    message: 'No active network selected',
                    color: 'red',
                    radius: 'md',
                    autoClose: 1000
                });
                return;
            }
            const rpcURL: string = (settings?.starknet.networks as any)[activeNetwork].rpcUrl;
            // const rpcUrl = settings?.acti
            // if (activeNetwork === 'devnet') {
            //     const accounts = await loadStarknetDevnetAccounts(settings?.starknet.networks.devnet.rpcUrl)
            //     setDevnetAccounts(accounts)
            //     if (accounts?.length > 0) {
            //         const acc = accounts[0]
            //         const provider = new RpcProvider({ nodeUrl: `${settings?.starknet.networks.devnet.rpcUrl}/rpc` })
            //         const account = new Account({
            //             provider,
            //             address: acc?.address,
            //             signer: acc?.private_key
            //         })

            //         setProvider(provider)
            //         setConnectedAccount(account);
            //         setActiveWalletAddress(acc?.address);

            //         showNotification({
            //             title: 'Devnet Connected',
            //             message: 'Devnet is connected',
            //             color: 'green',
            //             radius: 'md',
            //             autoClose: 2000
            //         });

            //     } else {
            //         showNotification({
            //             title: 'Devnet Not running',
            //             message: 'Devnet is not running',
            //             color: 'red',
            //             radius: 'md',
            //             autoClose: 5000
            //         });
            //     }
            //     return;
            // }
            // Get RPC endpoint from settings
            // const rpcUrl = activeNetwork === 'mainnet'
            //     ? settings.starknet.networks.mainnet.rpcUrl
            //     : settings.starknet.networks.sepolia.rpcUrl;

            const rpcProvider = new RpcProvider({ nodeUrl: rpcURL });

            const connectionData = await connect({
                argentMobileOptions: {
                    dappName: "Stark Deployer",
                    url: window.location.origin,
                },
                // modalMode: enablingCount === 1 ? "neverAsk" : "alwaysAsk",
                connectors: [
                    new InjectedConnector({
                        options: {
                            id: 'keon',
                            name: 'Keon Wallet'
                        }
                    }),
                    new InjectedConnector({
                        options: { id: "argentX" }
                    }),
                    new InjectedConnector({
                        options: { id: "braavos" }
                    })
                ]
            });

            console.log("Connector data: ", connectionData)

            let _chainId: bigint | undefined = connectionData.connectorData?.chainId;


            let decodedChainId = getChainId(_chainId?.toString() || "");
            console.log("Active network: ", activeNetwork)
            const expectedChainId = NETWORK_MAP[activeNetwork];

            if (decodedChainId !== expectedChainId) {
                showNotification({
                    title: 'Chain Mismatch',
                    message: 'Connected to a different chain',
                    color: 'red'
                });
                return;
            }

            if (connectionData?.wallet?.id === "braavos" || connectionData?.wallet?.id === "keon") {
                const _wallet: any = connectionData.wallet;
                // if (!_wallet.account.address) {
                //     enablingCount++;
                //     _wallet?.enable();
                //     await handleConnectStarknet();
                //     return;
                // }
                _wallet.account.address = connectionData.connectorData?.account;

                setConnectedAccount(_wallet.account);
                setActiveWalletAddress(connectionData.connectorData?.account || '');
                setProvider(rpcProvider);
                setConnection(connectionData);

                showNotification({
                    title: 'Wallet Connected',
                    message: 'Successfully connected to Starknet wallet',
                    color: 'green'
                });
            } else if (connectionData?.wallet?.id === "argentX") {
                let _wallet = connectionData?.wallet as any;
                if (!_wallet.account) {
                    enablingCount++;
                    _wallet?.enable();
                    setTimeout(() => {
                        handleConnectStarknet();
                    }, 100);
                    return;
                }

                setConnectedAccount(_wallet.account);
                setActiveWalletAddress(_wallet.account.address || connectionData.connectorData?.account || '');
                setProvider(rpcProvider);
                setConnection(connectionData);

                showNotification({
                    title: 'Wallet Connected',
                    message: 'Successfully connected to Starknet wallet',
                    color: 'green'
                });
            } else {
                showNotification({
                    title: 'Wallet Not Supported',
                    message: 'Connected to an unsupported wallet',
                    color: 'red'
                });
                return;
            }
        } catch (error: any) {
            console.error('Connection failed:', error);

            // Handle user rejection silently
            if (error?.message?.includes('User rejected request') || error?.name === 'UserRejectedRequestError') {
                showNotification({
                    message: 'Connection cancelled by user',
                    color: 'orange'
                });
                return;
            }

            showNotification({
                message: 'Failed to connect wallet',
                color: 'red'
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleConnectWallet = async () => {
        try {
            if (settings.activeChain === "starknet") {
                await handleConnectStarknet();
            } else {
                notifications.show({
                    title: 'Chain Not Supported',
                    message: 'Connected to an unsupported chain',
                    color: 'red'
                });
            }
        } catch (error) {
            console.error('Connection failed:', error);
            showNotification({
                message: 'Failed to connect wallet',
                color: 'red'
            });
        } finally {
            setIsConnecting(false);
        }
    };


    const handleDisconnectWallet = async () => {
        await disconnect({ clearLastWallet: false });
        setConnectedAccount(null);
        setActiveWalletAddress('');
        setProvider(null);
        setConnection(null);
    };


    const contextValue = useMemo(
        () => ({
            connectedAccount,
            activeWalletAddress,
            provider,
            activeNetwork,
            activeChain,
            handleConnectWallet,
            handleDisconnectWallet,
            isConnecting,
            connectDevnetAccount,
            devnetAccounts,
        }),
        [connectedAccount, activeWalletAddress, provider, activeNetwork, activeChain, isConnecting, devnetAccounts]
    );

    // Listen for account changes
    // useEffect(() => {
    //     if (connection?.wallet) {
    //         connection.wallet.on({
    //             type: 'accountsChanged',
    //         }).then((accounts: any) => {
    //             if (accounts && accounts.length > 0) {
    //                 setActiveWalletAddress(accounts[0]);
    //             }
    //         }).catch((error: any) => {
    //             console.error('Account change listener error:', error);
    //         });
    //     }
    // }, [connection]);

    useEffect(() => {
        handleConnectStarknet();
    }, [areSettingsLoading])

    useEffect(() => {
        setActiveChain(settings.activeChain)
        setActiveNetwork(settings.activeNetwork)
        setAreSettingsLoading(isLoading)
    }, [settings, isLoading])

    useEffect(() => {
        if (settings.activeNetwork !== activeNetwork || settings.activeChain !== activeChain) {
            handleDisconnectWallet()
        }
    }, [settings])

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;

