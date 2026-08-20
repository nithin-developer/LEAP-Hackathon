import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import { NavUser } from "@/components/layout/nav-user";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import { useAuth } from "@/stores/authStore";
import { sidebarData } from "./data/sidebar-data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const auth = useAuth();
  const currentRole = auth.user?.role;

  // Use authenticated user data or fallback to default
  const userData = auth.user
    ? {
        full_name: auth.user.full_name || sidebarData.user.full_name,
        email: auth.user.email,
        avatar: sidebarData.user.avatar, // Keep default avatar for now
      }
    : sidebarData.user;

  // Filter navigation items based on user role
  const filterByRole = (items: any[]): any[] =>
    items
      .filter(
        (it) => !it.roles || (currentRole && it.roles.includes(currentRole))
      )
      .map((it) => (it.items ? { ...it, items: filterByRole(it.items) } : it));

  const filteredNavGroups = sidebarData.navGroups.map((group) => ({
    ...group,
    items: filterByRole(group.items),
  }));

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
