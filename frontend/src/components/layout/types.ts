interface LinkProps {
  to: string
}

interface User {
  full_name: string
  email: string
  avatar: string
}

interface Team {
  name: string
  logo: string
  plan: string
}

interface BaseNavItem {
  title: string
  badge?: string
  icon?: React.ComponentType<any>
  roles?: string[] // optional list of roles allowed to see this item; absent means all
}

type NavLink = BaseNavItem & {
  url: LinkProps['to']
  items?: never
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: LinkProps['to'] })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

interface NavGroup {
  title: string
  items: NavItem[]
}

interface SidebarData {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
