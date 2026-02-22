import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { SUBJECT_EMOJIS } from '@/types/kanban';
import type { Assignment, ColumnId } from '@/types/kanban';

interface Props {
  onAdd: (assignment: Omit<Assignment, 'id' | 'createdAt'>) => void;
}

export default function AddAssignmentDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !dueDate) return;

    onAdd({
      title,
      subject,
      dueDate,
      emoji: SUBJECT_EMOJIS[subject] || '📝',
      columnId: 'todo' as ColumnId,
    });

    setTitle('');
    setSubject('');
    setDueDate('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-display font-bold gap-2 rounded-full px-6 text-base">
          <Plus size={18} /> Add Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border font-body sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">📚 New Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div>
            <Label className="font-body text-sm text-muted-foreground">Assignment Name</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 Review"
              className="mt-1 bg-secondary border-border font-body"
              required
            />
          </div>
          <div>
            <Label className="font-body text-sm text-muted-foreground">Subject</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger className="mt-1 bg-secondary border-border font-body">
                <SelectValue placeholder="Pick a subject" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECT_EMOJIS).map(([name, emoji]) => (
                  <SelectItem key={name} value={name} className="font-body">
                    {emoji} {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-body text-sm text-muted-foreground">Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="mt-1 bg-secondary border-border font-body"
              required
            />
          </div>
          <Button type="submit" className="font-display font-bold rounded-full mt-2">
            🎯 Add to Board
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
