import { BookOpen, LayoutDashboard, MessageCircle, Info, BarChart3 } from 'lucide-react';
import { useParams } from 'react-router-dom';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';

interface AppSidebarProps {
  onToggleChat: () => void;
  chatOpen: boolean;
}

export function AppSidebar({ onToggleChat, chatOpen }: AppSidebarProps) {
  const { studentId } = useParams<{ studentId: string }>();
  const activeStudent = studentId
    ? studentId.charAt(0).toUpperCase() + studentId.slice(1)
    : 'Benji';

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-tight">
              {activeStudent}'s
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
              {/* BENJI SECTION */}
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-body font-medium">
                      <span>👦 Benji</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/benji/board" end className="font-body rounded-md" activeClassName="bg-primary/10 text-primary font-medium">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Board</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/benji/stats" className="font-body rounded-md" activeClassName="bg-primary/10 text-primary font-medium">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Stats</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* LEVI SECTION */}
              <Collapsible defaultOpen className="group/collapsible mt-2">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="font-body font-medium">
                      <span>👦 Levi</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/levi/board" end className="font-body rounded-md" activeClassName="bg-primary/10 text-primary font-medium">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Board</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <NavLink to="/levi/stats" className="font-body rounded-md" activeClassName="bg-primary/10 text-primary font-medium">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>Stats</span>
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

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
          <span>Stay awesome, guys!</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
