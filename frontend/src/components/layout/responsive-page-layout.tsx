import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ReactNode } from "react";

interface ResponsivePageLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function ResponsivePageLayout({
  title,
  description,
  children,
  actions,
}: ResponsivePageLayoutProps) {
  return (
    <>
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        <div className="space-y-6">{children}</div>
      </Main>
    </>
  );
}
