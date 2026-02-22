import { COLUMNS } from '@/types/kanban';
import type { useAssignments } from '@/hooks/useAssignments';
import type { useCanvasSync } from '@/hooks/useCanvasSync';
import KanbanColumn from './KanbanColumn';
import AddAssignmentDialog from './AddAssignmentDialog';
import { fireConfetti } from '@/lib/confetti';
import { ColumnId } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface KanbanBoardProps {
  assignmentsHook: ReturnType<typeof useAssignments>;
  canvasSyncHook: ReturnType<typeof useCanvasSync>;
}

export default function KanbanBoard({ assignmentsHook, canvasSyncHook }: KanbanBoardProps) {
  const { assignments, addAssignment, moveAssignment, deleteAssignment, clearAll, getByColumn } = assignmentsHook;
  const { syncing, syncFromCanvas } = canvasSyncHook;

  const handleClearAndResync = async () => {
    clearAll();
    // Small delay to let state clear, then sync
    setTimeout(() => syncFromCanvas([], addAssignment), 100);
  };

  const handleMove = (id: string, columnId: ColumnId) => {
    moveAssignment(id, columnId);
    if (columnId === 'done') fireConfetti();
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">
              Benji's Homework Tracker ✨
            </h1>
            <p className="text-muted-foreground text-sm font-body">
              Stay on top of every assignment!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="font-display font-bold gap-2 rounded-full px-6 text-base"
              onClick={handleClearAndResync}
              disabled={syncing}
            >
              <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync from Canvas'}
            </Button>
            <AddAssignmentDialog onAdd={addAssignment} />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            assignments={getByColumn(col.id)}
            onMove={handleMove}
            onDelete={deleteAssignment}
            onDrop={handleMove}
          />
        ))}
      </div>
    </div>
  );
}
