import { useState, useEffect, useCallback } from 'react';
import { Assignment, ColumnId } from '@/types/kanban';

const STORAGE_KEY = 'homework-kanban-assignments';

function loadAssignments(): Assignment[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const addAssignment = useCallback((assignment: Omit<Assignment, 'id' | 'createdAt'>) => {
    setAssignments(prev => [
      ...prev,
      { ...assignment, id: crypto.randomUUID(), createdAt: Date.now() },
    ]);
  }, []);

  const moveAssignment = useCallback((id: string, columnId: ColumnId) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, columnId } : a))
    );
  }, []);

  const updateGrade = useCallback((id: string, grade: string) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, grade } : a))
    );
  }, []);

  const updateScore = useCallback((id: string, score: number, totalPoints: number) => {
    setAssignments(prev =>
      prev.map(a => (a.id === id ? { ...a, score, totalPoints } : a))
    );
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAssignments([]);
  }, []);

  const getByColumn = useCallback(
    (columnId: ColumnId) =>
      assignments
        .filter(a => a.columnId === columnId)
        .sort((a, b) => {
          // Undated items go to the bottom
          if (!a.dueDate && !b.dueDate) return a.createdAt - b.createdAt;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          // Otherwise sort chronologically (earliest/most overdue first)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }),
    [assignments]
  );

  return { assignments, setAssignments, addAssignment, moveAssignment, updateGrade, updateScore, deleteAssignment, clearAll, getByColumn };
}
