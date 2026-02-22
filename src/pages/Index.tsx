import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { AppSidebar } from '@/components/AppSidebar';
import AIChatPanel from '@/components/chat/AIChatPanel';
import About from '@/pages/About';
import Stats from '@/pages/Stats';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAssignments } from '@/hooks/useAssignments';
import { useCanvasSync } from '@/hooks/useCanvasSync';

const Index = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const isAbout = location.pathname === '/about';
  const isStats = location.pathname === '/stats';
  const isBoard = !isAbout && !isStats;
  const assignmentsHook = useAssignments();
  const canvasSyncHook = useCanvasSync();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar onToggleChat={() => setChatOpen(!chatOpen)} chatOpen={chatOpen} />
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <header className="h-12 flex items-center border-b border-border px-4 bg-background">
              <SidebarTrigger />
            </header>
            <main className="flex-1 overflow-auto">
              {isAbout ? <About /> : isStats ? <Stats assignments={assignmentsHook.assignments} /> : <KanbanBoard assignmentsHook={assignmentsHook} canvasSyncHook={canvasSyncHook} />}
            </main>
          </div>
          {chatOpen && isBoard && (
            <div className="w-[360px] border-l border-border flex-shrink-0">
              <AIChatPanel onClose={() => setChatOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
