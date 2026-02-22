import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SUBJECT_EMOJIS, ColumnId } from '@/types/kanban';
import type { Assignment, DueStatus } from '@/types/kanban';
import { toast } from '@/hooks/use-toast';

interface CanvasAssignment {
  canvasId: number;
  title: string;
  subject: string;
  dueDate: string;
  status: 'todo' | 'progress' | 'done';
  grade?: string;
  score?: number;
  totalPoints?: number;
  dueStatus: DueStatus;
  canvasUrl?: string;
}

function matchSubjectEmoji(subject: string): string {
  const lower = subject.toLowerCase();
  for (const [key, emoji] of Object.entries(SUBJECT_EMOJIS)) {
    if (lower.includes(key.toLowerCase())) return emoji;
  }
  return '📝';
}

export function useCanvasSync() {
  const [syncing, setSyncing] = useState(false);

  const syncFromCanvas = useCallback(
    async (
      existingAssignments: Assignment[],
      addAssignment: (a: Omit<Assignment, 'id' | 'createdAt'>) => void
    ) => {
      setSyncing(true);
      try {
        const { data, error } = await supabase.functions.invoke('canvas-sync');

        if (error) throw error;

        const canvasAssignments: CanvasAssignment[] = data.assignments;
        let added = 0;

        for (const ca of canvasAssignments) {
          // Skip if already exists (match by title + due date)
          const exists = existingAssignments.some(
            (a) => a.title === ca.title && a.dueDate === ca.dueDate
          );
          if (exists) continue;

          const columnId: ColumnId =
            ca.status === 'done' ? 'done' : ca.status === 'progress' ? 'progress' : 'todo';

          addAssignment({
            title: ca.title,
            subject: ca.subject,
            dueDate: ca.dueDate,
            emoji: matchSubjectEmoji(ca.subject),
            columnId,
            grade: ca.grade,
            score: ca.score,
            totalPoints: ca.totalPoints,
            dueStatus: ca.dueStatus,
            canvasUrl: ca.canvasUrl,
          });
          added++;
        }

        toast({
          title: `🎓 Canvas Sync Complete`,
          description: `Found ${canvasAssignments.length} assignments, added ${added} new ones.`,
        });
      } catch (err) {
        console.error('Canvas sync error:', err);
        toast({
          title: '❌ Canvas Sync Failed',
          description: err instanceof Error ? err.message : 'Could not connect to Canvas.',
          variant: 'destructive',
        });
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  return { syncing, syncFromCanvas };
}
