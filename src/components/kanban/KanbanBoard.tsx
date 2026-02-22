import { useParams } from 'react-router-dom';
import { useState, useMemo } from 'react';
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
  const { studentId } = useParams<{ studentId: string }>();
  const activeStudent = studentId
    ? studentId.charAt(0).toUpperCase() + studentId.slice(1)
    : 'Benji';

  const { assignments, addAssignment, moveAssignment, deleteAssignment, clearAll, getByColumn, setAssignments } = assignmentsHook;
  const { syncing, syncFromCanvas } = canvasSyncHook;

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Derive unique subjects from the To Do column only
  const todoAssignments = getByColumn('todo');
  const subjects = useMemo(() => {
    const seen = new Set<string>();
    todoAssignments.forEach(a => { if (a.subject) seen.add(a.subject); });
    return Array.from(seen).sort();
  }, [todoAssignments]);

  // Filtered To Do assignments
  const filteredTodo = useMemo(() =>
    selectedSubject
      ? todoAssignments.filter(a => a.subject === selectedSubject)
      : todoAssignments,
    [todoAssignments, selectedSubject]
  );

  const handleClearAndResync = async () => {
    syncFromCanvas(assignments, addAssignment, setAssignments);
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
              {activeStudent}'s Homework Tracker ✨
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
            assignments={col.id === 'todo' ? filteredTodo : getByColumn(col.id)}
            totalCount={col.id === 'todo' ? todoAssignments.length : undefined}
            subjects={col.id === 'todo' ? subjects : undefined}
            selectedSubject={col.id === 'todo' ? selectedSubject : undefined}
            onSubjectChange={col.id === 'todo' ? setSelectedSubject : undefined}
            onMove={handleMove}
            onDelete={deleteAssignment}
            onDrop={handleMove}
          />
        ))}
      </div>
    </div>
  );
}
