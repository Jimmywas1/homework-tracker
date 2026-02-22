import { BookOpen, LayoutDashboard, MessageCircle, Info, BarChart3 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  onToggleChat: () => void;
  chatOpen: boolean;
}

export function AppSidebar({ onToggleChat, chatOpen }: AppSidebarProps) {
  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-tight">
              Benji's
            </h1>
            <p className="text-xs text-muted-foreground font-body">
              Homework Tracker
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground font-body tracking-wider px-3 mb-1">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className="font-body rounded-lg" activeClassName="bg-primary/10 text-primary font-medium">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Board</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/stats" className="font-body rounded-lg" activeClassName="bg-primary/10 text-primary font-medium">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Stats</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onToggleChat}
                  className={`font-body rounded-lg transition-colors ${chatOpen ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>AI Helper</span>
                  <span className="ml-auto text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                    NEW
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/about" className="font-body rounded-lg" activeClassName="bg-primary/10 text-primary font-medium">
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <span>✨</span>
          <span>Stay awesome, Benji!</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
