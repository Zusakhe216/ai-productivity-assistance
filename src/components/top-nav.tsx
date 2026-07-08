import { Bell, Moon, Search, Settings as SettingsIcon, Sun } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/lib/theme";

export function TopNav() {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="relative ml-1 hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search history, tasks, notes…" className="h-9 pl-8" />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button asChild variant="ghost" size="icon" aria-label="Settings">
          <Link to="/settings">
            <SettingsIcon className="h-4 w-4" />
          </Link>
        </Button>
        <Avatar className="ml-1 h-8 w-8">
          <AvatarFallback className="bg-gradient-brand text-xs font-semibold text-white">
            YO
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
