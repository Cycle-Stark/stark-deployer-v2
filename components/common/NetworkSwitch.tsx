import { DEVNET_ADDRESS } from '@/constants'
import { useSettings } from '@/hooks/useSettings'
import { useAppContext } from '@/contexts/AppContext'
import { formatAddress } from '@/utils'
import { ActionIcon, Box, Button, CopyButton, Group, Image, Popover, Stack, Text, Tooltip, useMantineColorScheme, useMantineTheme } from '@mantine/core'
import { useHover } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconAddressBook, IconCheck, IconChevronDown, IconCopy, IconHash, IconKey, IconLogout, IconNetwork, IconPlugConnected, IconSend2, IconUserCircle, IconWallet, IconX } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'
import { IDevnetAccount } from '@/types/contracts'
import { formatTokensValue } from '../utils'
import { NotesButton } from './NotesTool'


const CustomToolTip = ({ children, label }: { children: React.ReactNode, label: string }) => {

    return (
        <Tooltip label={label} radius={"sm"} px={"xs"} py="2px" style={{
            fontSize: "12px"
        }}>
            {children}
        </Tooltip>
    )
}

const RenderDevnetAccount = ({ devnetAccount, index }: { devnetAccount: IDevnetAccount, index: number }) => {

    const { connectDevnetAccount, activeWalletAddress } = useAppContext()

    return (
        <Group justify='space-between'>
            <Stack gap={0}>
                <Text size="xs" ff={"monospace"}>{formatAddress(devnetAccount.address, 6, 4)}</Text>
                <Text size="xs">{`${formatTokensValue(devnetAccount.initial_balance, 18)} ETH`}</Text>
            </Stack>
            <Group gap={"2px"}>
                <CustomToolTip label="Connect">
                    <ActionIcon size={"xs"} color={activeWalletAddress === devnetAccount.address ? "green" : "gray"} variant={activeWalletAddress === devnetAccount.address ? "filled" : "default"} onClick={() => connectDevnetAccount(index)}>
                        {
                            activeWalletAddress === devnetAccount.address ? <IconCheck size={12} /> : <IconPlugConnected size={12} />
                        }
                    </ActionIcon>
                </CustomToolTip>
                <CopyButton value={devnetAccount.address}>
                    {({ copied, copy }) => (
                        <CustomToolTip label="Copy address">
                            <ActionIcon size={"xs"} variant='default' onClick={copy}>
                                {
                                    copied ? <IconCheck size={12} /> : <IconCopy size={12} />
                                }
                            </ActionIcon>
                        </CustomToolTip>
                    )}
                </CopyButton>
                <CopyButton value={devnetAccount.private_key}>
                    {({ copied, copy }) => (
                        <CustomToolTip label="Copy private key">
                            <ActionIcon size={"xs"} variant='default' onClick={copy}>
                                {
                                    copied ? <IconCheck size={12} /> : <IconKey size={12} />
                                }
                            </ActionIcon>
                        </CustomToolTip>
                    )}
                </CopyButton>
            </Group>
        </Group >
    )
}


interface ICustomPopover {
    trigger: React.ReactNode
    children: React.ReactNode
    width?: number
}

const CustomPopover = ({ trigger, children, width = 200 }: ICustomPopover) => {

    return (
        <Popover width={width} position="bottom-end" radius={"md"} shadow="md">
            <Popover.Target>
                {trigger}
            </Popover.Target>
            <Popover.Dropdown p={"xs"}>
                {children}
            </Popover.Dropdown>
        </Popover>
    )
}

interface ISelectableItem {
    name: string
    value: string
    icon?: React.ReactNode
    onSelect: (value: string) => void
    activeItem: string
}

const SelectableItem = ({ name, value, icon, onSelect, activeItem }: ISelectableItem) => {
    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === "dark"
    const { hovered, ref } = useHover()

    return (
        <Group justify='space-between' ref={ref} px={"xs"} py={"6px"} style={{
            background: isDark ? hovered ? theme.colors.dark[8] : theme.colors.dark[9] : hovered ? theme.colors.gray[2] : theme.colors.gray[2],
            borderRadius: theme.radius.xl,
            cursor: "pointer"
        }} onClick={() => onSelect(value)}>
            <Group gap={"xs"}>
                <Box>
                    {icon}
                </Box>
                <Text size="xs">{name}</Text>
            </Group>
            {value === activeItem ? <IconCheck size={16} /> : null}
        </Group>
    )
}

const STARKNET_NETWORKs = [
    { name: "Mainnet", value: "mainnet", icon: <Image radius={"xl"} src={"/starknet.png"} /> },
    { name: "Sepolia", value: "sepolia", icon: <Image radius={"xl"} src={"/starknet.png"} /> },
    { name: "Devnet", value: "devnet", icon: <Image radius={"xl"} src={"/starknet.png"} /> },
]

const NetworkSwitch = () => {

    const { settings, updateSettings } = useSettings()
    const { handleConnectWallet,
        connectedAccount,
        activeWalletAddress,
        handleDisconnectWallet, devnetAccounts } = useAppContext()

    const [activeChain, setActiveChain] = useState(settings.activeChain)
    const [activeNetwork, setActiveNetwork] = useState(settings.activeNetwork)

    const theme = useMantineTheme()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === "dark"

    const updateChainAndNetwork = async (target: "chain" | "network", value: string) => {
        try {
            if (target === "chain") {
                updateSettings({
                    activeChain: value
                })
            } else {
                updateSettings({
                    activeNetwork: value
                })
            }
            notifications.show({
                title: `${target.charAt(0).toUpperCase() + target.slice(1)} updated`,
                message: `${target.charAt(0).toUpperCase() + target.slice(1)} updated successfully`,
                color: "green",
                icon: <IconCheck size={16} />,
                radius: "md",
            })
        } catch (error) {
            notifications.show({
                title: "Error",
                message: `Error updating ${target.charAt(0).toUpperCase() + target.slice(1)}`,
                color: "red",
                icon: <IconX size={16} />,
                radius: "md",
            })
        }
    }

    useEffect(() => {
        if (settings.activeChain !== activeChain) {
            setActiveChain(settings.activeChain)
        }
        if (settings.activeNetwork !== activeNetwork) {
            setActiveNetwork(settings.activeNetwork)
        }
    }, [settings])

    return (
        <Group px={"xs"} py={"4px"} gap={"4px"} bg={isDark ? theme.colors.dark[9] : theme.colors.gray[2]}
            style={{
                borderRadius: theme.radius.xl,
                overflow: "hidden"
            }}>
            {/* <CustomPopover trigger={<Button leftSection={<IconNetwork size={14} />} w={"120px"} variant="default" radius="xl" size='xs' tt={"capitalize"} rightSection={<IconChevronDown size={14} />}>{activeChain}</Button>}>
                <Stack>
                    <SelectableItem
                        name="Starknet"
                        value="starknet"
                        icon={<Image radius={"xl"} src={"/starknet.png"} />}
                        onSelect={(value) => updateChainAndNetwork("chain", value)}
                        activeItem={activeChain}
                    />
                </Stack>
            </CustomPopover> */}
            <CustomPopover trigger={
                <Group gap={0} align='center'>
                    <ActionIcon hiddenFrom={"md"} size={"md"} radius={"xl"} color={isDark ? "gray" : "darkColor"} variant="default" onClick={() => { }} style={{ marginRight: 4 }}>
                        <IconNetwork size={14} />
                    </ActionIcon>
                    <Button visibleFrom='md' leftSection={<IconNetwork size={14} />} w={"120px"} variant="default" tt={"capitalize"} radius="xl" size='xs'
                        rightSection={<IconChevronDown size={14} />}>
                        {activeNetwork}
                    </Button>
                </Group>
            }>
                <Stack gap={"2px"}>
                    {
                        STARKNET_NETWORKs.map((network) => (
                            <SelectableItem
                                key={network.value}
                                name={network.name}
                                value={network.value}
                                icon={<IconNetwork size={14} />}
                                onSelect={(value) => updateChainAndNetwork("network", value)}
                                activeItem={activeNetwork}
                            />
                        ))
                    }
                </Stack>
            </CustomPopover>
            {
                activeWalletAddress ? (
                    <CustomPopover trigger={
                        <Group gap={0} align='center'>
                            <ActionIcon hiddenFrom={"md"} size={"md"} radius={"xl"} color={"green"} variant="filled" style={{ marginRight: 4 }}>
                                <IconUserCircle size={14} />
                            </ActionIcon>
                            <Button
                                visibleFrom='md'
                                color='green'
                                variant="outline"
                                radius="xl"
                                size='xs'
                                ff={"monospace"}
                                rightSection={<Box mih={10} h={10} w={10} miw={10} style={{ borderRadius: theme.radius.xl }} bg={isDark ? theme.colors.green[8] : theme.colors.green[6]} />}
                            >
                                {formatAddress(activeWalletAddress, 6, 4)}
                            </Button>
                        </Group>
                    }
                    >
                        <Stack gap={"xs"}>
                            {/* {
                                activeChain === "starknet" && activeNetwork === "devnet" ? (
                                    <Stack>
                                        {
                                            devnetAccounts.map((account, index) => (
                                                <RenderDevnetAccount key={`devnet_account_${index}`} devnetAccount={account} index={index} />
                                            ))
                                        }
                                    </Stack>
                                ) : null
                            } */}
                            <CopyButton value={activeWalletAddress}>
                                {({ copied, copy }) => (
                                    <Button
                                        color='red'
                                        variant="default"
                                        leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                        radius="md"
                                        size='xs'
                                        onClick={() => copy()}
                                    >
                                        {copied ? "Copied" : "Copy Address"}
                                    </Button>
                                )}
                            </CopyButton>
                            <Button
                                color='red'
                                variant="filled"
                                rightSection={<IconLogout size={14} />}
                                radius="md"
                                size='xs'
                                onClick={() => handleDisconnectWallet()}
                            >
                                Disconnect
                            </Button>
                        </Stack>
                    </CustomPopover>
                ) : (
                    <Group gap={0} align='center'>
                        <ActionIcon onClick={handleConnectWallet} hiddenFrom={"md"} size={"md"} radius={"xl"} color={isDark ? "gray" : "darkColor"} variant="filled" style={{ marginRight: 4 }}>
                            <IconWallet size={14} />
                        </ActionIcon>
                        <Button
                            visibleFrom='md'
                            variant={isDark ? "white" : "default"}
                            radius="xl"
                            size='xs'
                            style={{
                                color: theme.colors.dark[8]
                            }}
                            rightSection={<Box mih={10} h={10} w={10} miw={10} style={{ borderRadius: theme.radius.xl }} bg={isDark ? theme.colors.dark[8] : theme.colors.gray[6]} />}
                            onClick={() => handleConnectWallet()}
                        >
                            Connect Wallet
                        </Button>
                    </Group>
                )
            }
            <NotesButton />
        </Group>
    )
}

export default NetworkSwitch