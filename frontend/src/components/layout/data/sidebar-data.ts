import { IconLayoutDashboard } from "@tabler/icons-react";
import {
  Activity,
  Settings,
} from "lucide-react";

import { IconPalette, IconTool } from "@tabler/icons-react";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    full_name: "User",
    email: "user@manditrace.com",
    avatar: "",
  },
  teams: [
    {
      name: "MandiTrace",
      logo: "/src/assets/vvce.png",
      plan: "Farmer Dashboard",
    },
  ],
  navGroups: [
    {
      title: "MandiTrace",
      items: [
        {
          title: "Dashboard",
          url: "/",
          icon: IconLayoutDashboard,
        },
        { title: "Crop Journey", url: "/crop-journey", icon: Activity },
      ],
    },
    {
      title: "Management",
      items: [
        {
          title: "Settings",
          icon: Settings,
          roles: ["farmer", "mandi_owner"],
          items: [
            {
              title: "Account",
              url: "/settings/account",
              icon: IconTool,
              roles: ["farmer", "mandi_owner"],
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
              icon: IconPalette,
              roles: ["farmer", "mandi_owner"],
            },
          ],
        },
      ],
    },
  ],
};
