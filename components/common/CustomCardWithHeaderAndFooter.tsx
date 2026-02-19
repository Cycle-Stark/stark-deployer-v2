import { Paper, Group, Text, Tooltip, ActionIcon, Box, useMantineTheme, useMantineColorScheme, Stack, Overlay, Center, Collapse } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"

interface ICustomCardWithHeaderAndFooter {
    title: string
    subtitle?: string
    Icon: any,
    description?: string
    footerContent?: React.ReactNode
    children?: React.ReactNode
    disabled?: boolean
    expandable?: boolean
}

const CustomCardWithHeaderAndFooter = ({ title, subtitle, Icon, description, footerContent, children, disabled, expandable }: ICustomCardWithHeaderAndFooter) => {
    const [opened, { toggle }] = useDisclosure(expandable ? false : true);
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === 'dark'
    const theme = useMantineTheme()

    return (
        <Paper withBorder bg={isDark ? theme.colors.dark[9] : theme.colors.gray[0]} radius="lg" style={{
            overflow: "hidden",
            userSelect: disabled ? "none" : "auto",
            pointerEvents: disabled ? "none" : "auto",
        }} pos={"relative"}>
            {
                disabled ? (
                    <Overlay h={"100%"} w={"100%"} bg={isDark ? theme.colors.darkColor[9] : theme.colors.gray[1]} opacity={0.5}>
                        <Center h={"100%"} w={"100%"}>
                            <Text size="lg" fw={400}>
                                Coming soon!
                            </Text>
                        </Center>
                    </Overlay>
                ) : null
            }
            <Group justify="space-between" align="center" p={"md"} onClick={() => {
                if(expandable){
                    toggle()
                }
            }}>
                <Group gap={"xs"} wrap="nowrap">
                    <Box>
                        <Icon size={24} stroke={1.5} />
                    </Box>
                    <Stack gap={"0"}>
                        <Text size="lg">
                            {title}
                        </Text>
                        <Text size="xs" c={"dimmed"}>
                            {subtitle}
                        </Text>
                    </Stack>
                </Group>
                <Group>
                    <Text size="xs" c="dimmed">
                        {description}
                    </Text>
                    {
                        expandable ? (
                            <Tooltip label={opened ? "Collapse" : "Expand"}>
                                <ActionIcon onClick={toggle} variant="light" radius={"xl"} size="md">
                                    {
                                        opened ? (
                                            <IconChevronUp size={20} />
                                        ) : (
                                            <IconChevronDown size={20} />
                                        )
                                    }
                                </ActionIcon>
                            </Tooltip>
                        ) : null
                    }
                </Group>
            </Group>
            <Collapse in={expandable ? opened : true} transitionDuration={300} transitionTimingFunction="ease">
                <Box p="md" style={{
                    borderTop: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}`,
                    ...(footerContent && {
                        borderBottom: `1px solid ${isDark ? theme.colors.dark[4] : theme.colors.gray[2]}`,
                    })
                }}>
                    {children}
                </Box>
                {
                    footerContent ? (
                        <Box p={"md"}>
                            {footerContent}
                        </Box>
                    ) : null
                }
            </Collapse>
        </Paper>
    )
}

export default CustomCardWithHeaderAndFooter