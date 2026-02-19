import { em, NavLink, useMantineColorScheme, useMantineTheme } from '@mantine/core'
import Link from 'next/link'
import { useRouter } from 'next/router';
import React from 'react'
import { matchTest } from '../utils/common';

export interface SidebarLinkProps {
    label: string,
    href: string,
    Icon?: any,
    children?: SidebarLinkProps[] | null,
    click?: any
    loginRequired?: boolean
    radius?: string
}

export interface SidebarLinkGroupProps {
    id: string,
    label: string,
    Icon?: any,
    links: SidebarLinkProps[]
}

const SidebarLink = ({ label, href, Icon, children, click, radius }: SidebarLinkProps) => {
    const theme = useMantineTheme()
    const router = useRouter()
    const { colorScheme } = useMantineColorScheme()
    const isDark = colorScheme === "dark"

    const match = () => {
        const path = router.asPath
        return matchTest(path, href)
    }

    const matches = match()
    const RenderIcon = Icon ? <Icon size={"1.2rem"} stroke={em(1.6)} /> : null

    return (
        <>
            {
                children && children.length > 0 ? (
                    <NavLink
                        label={label}
                        leftSection={RenderIcon}
                        active={match()}
                        color='violet'
                        variant='light'
                        // fw={500}
                        style={{
                            borderRadius: theme.radius[radius || "md"],
                        }}>
                        {
                            children?.map((child: SidebarLinkProps, i: number) => (
                                <SidebarLink key={`sidebar_child_${label}_${i}`} {...child} />
                            ))
                        }
                    </NavLink>
                ) :
                    null
            }

            {
                !children ? (
                    <NavLink
                        component={Link}
                        label={label}
                        variant='light'
                        href={href}
                        leftSection={RenderIcon}
                        tt={"capitalize"}
                        // fw={500} 
                        active={match()}
                        color='violet'
                        style={{
                            fontSize: theme.fontSizes.xs,
                            borderRadius: theme.radius[radius || "xl"],
                            borderStyle: 'solid',
                            borderWidth: '0.16em',
                            borderColor: matches ? (isDark ? theme.colors.violet[9] : theme.colors.violet[2]) : "transparent",
                            // background: match() ? theme.colors.gre isDarkMode(colorScheme)
                        }} onClick={click} />
                ) : null
            }


        </>
    )
}

export default SidebarLink