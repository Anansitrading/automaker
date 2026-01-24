import React, { useEffect, useState } from 'react';
import { Sprite, Checkpoint } from '@/lib/electron';
import { getHttpApiClient } from '@/lib/http-api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, RotateCcw, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { formatTimeAgo } from './utils';

interface CheckpointsModalProps {
  sprite: Sprite;
}

export const CheckpointsModal: React.FC<CheckpointsModalProps> = ({ sprite }) => {
  const [open, setOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCheckpointName, setNewCheckpointName] = useState('');

  const client = getHttpApiClient();

  const loadCheckpoints = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.sprites.listCheckpoints(sprite.name);
      if (res.success && res.checkpoints) {
        setCheckpoints(res.checkpoints);
      }
    } catch {
      toast.error('Failed to load checkpoints');
    } finally {
      setLoading(false);
    }
  }, [client.sprites, sprite.name]);

  useEffect(() => {
    if (open) {
      loadCheckpoints();
    }
  }, [open, loadCheckpoints]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await client.sprites.createCheckpoint(sprite.name, newCheckpointName);
      if (res.success) {
        toast.success('Checkpoint created');
        setNewCheckpointName('');
        loadCheckpoints();
      } else {
        toast.error(res.error || 'Failed to create checkpoint');
      }
    } catch {
      toast.error('Failed to create checkpoint');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('This will rollback the sandbox to this state. Continue?')) return;
    try {
      const res = await client.sprites.restoreCheckpoint(sprite.name, id);
      if (res.success) {
        toast.success('Sandbox restored');
        setOpen(false);
      } else {
        toast.error(res.error || 'Failed to restore');
      }
    } catch {
      toast.error('Failed to restore');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Checkpoints" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkpoints for {sprite.name}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 my-2">
          <Input
            value={newCheckpointName}
            onChange={(e) => setNewCheckpointName(e.target.value)}
            placeholder="New checkpoint label..."
          />
          <Button size="icon" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>

        <div className="max-h-[300px] overflow-y-auto border rounded-md">
          {loading ? (
            <div className="p-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No checkpoints found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((cp) => (
                  <TableRow key={cp.id}>
                    <TableCell className="text-xs">
                      {formatTimeAgo(new Date(cp.createdAt))}
                    </TableCell>
                    <TableCell>
                      {cp.name || <span className="text-muted-foreground italic">Untitled</span>}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRestore(cp.id)}
                        title="Restore this checkpoint"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
