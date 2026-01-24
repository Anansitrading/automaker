import React, { useEffect, useState } from 'react';
import { Sprite, Checkpoint } from '@/lib/electron';
import { getHttpApiClient } from '@/lib/http-api-client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Play,
  Square,
  Save,
  RotateCcw,
  Trash2,
  Terminal,
  RefreshCw,
  Plus,
  History,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function formatTimeAgo(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export const SandboxDashboard: React.FC = () => {
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSpriteName, setNewSpriteName] = useState('');

  const client = getHttpApiClient();

  const fetchSprites = React.useCallback(async () => {
    try {
      const res = await client.sprites.list();
      if (res.success && res.sprites) {
        setSprites(res.sprites);
      }
    } catch (error) {
      console.error('Failed to fetch sprites:', error);
      toast.error('Failed to fetch sandboxes');
    } finally {
      setLoading(false);
    }
  }, [client.sprites]);

  useEffect(() => {
    fetchSprites();
    const interval = setInterval(fetchSprites, 5000);
    return () => clearInterval(interval);
  }, [fetchSprites]);

  const handleCreate = async () => {
    if (!newSpriteName.trim()) return;
    setCreating(true);
    try {
      const res = await client.sprites.create({ name: newSpriteName });
      if (res.success) {
        toast.success(`Sandbox '${newSpriteName}' created`);
        setNewSpriteName('');
        fetchSprites();
      } else {
        toast.error(res.error || 'Failed to create sandbox');
      }
    } catch (error) {
      toast.error('Failed to create sandbox');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to destroy '${name}'?`)) return;
    try {
      const res = await client.sprites.delete(name);
      if (res.success) {
        toast.success(`Sandbox '${name}' destroyed`);
        fetchSprites();
      } else {
        toast.error(res.error || 'Failed to destroy sandbox');
      }
    } catch (error) {
      toast.error('Failed to destroy sandbox');
    }
  };

  const handlePower = async (sprite: Sprite) => {
    const action = sprite.status === 'running' ? 'shutdown' : 'wake';
    try {
      const res =
        action === 'shutdown'
          ? await client.sprites.shutdown(sprite.name)
          : await client.sprites.wake(sprite.name);

      if (res.success) {
        toast.success(`Sandbox ${action} initiated`);
        fetchSprites();
      } else {
        toast.error(res.error || `Failed to ${action} sandbox`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} sandbox`);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sandbox Environment</h1>
          <p className="text-muted-foreground">Manage your isolated Sprite sandboxes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchSprites()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Sandbox
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Sandbox</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSpriteName}
                    onChange={(e) => setNewSpriteName(e.target.value)}
                    placeholder="my-sandbox-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating || !newSpriteName.trim()}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && sprites.length === 0 ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprites.map((sprite) => (
            <SpriteCard
              key={sprite.id}
              sprite={sprite}
              onDelete={() => handleDelete(sprite.name)}
              onPower={() => handlePower(sprite)}
            />
          ))}
          {sprites.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 p-12 border-2 border-dashed rounded-lg text-muted-foreground">
              <p>No sandboxes found.</p>
              <Button variant="outline" onClick={() => setNewSpriteName('demo-sandbox')}>
                Create your first sandbox
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SpriteCardProps {
  sprite: Sprite;
  onDelete: () => void;
  onPower: () => void;
}

const SpriteCard: React.FC<SpriteCardProps> = React.memo(({ sprite, onDelete, onPower }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{sprite.name}</CardTitle>
        <StatusBadge status={sprite.status} />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-xs text-muted-foreground mt-2">
          <div className="flex justify-between py-1">
            <span>ID:</span>
            <span className="font-mono">{sprite.id.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Created:</span>
            <span>{formatTimeAgo(new Date(sprite.createdAt))}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Last Active:</span>
            <span>{formatTimeAgo(new Date(sprite.lastActivityAt))}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-2 border-t bg-muted/20">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPower}
            title={sprite.status === 'running' ? 'Shutdown' : 'Wake'}
          >
            {sprite.status === 'running' ? (
              <Square className="h-4 w-4 text-red-500" />
            ) : (
              <Play className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <CheckpointsModal sprite={sprite} />
          {/* Terminal button logic would go here if we link to console URL */}
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} title="Destroy">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
});

const StatusBadge: React.FC<{ status: Sprite['status'] }> = ({ status }) => {
  const styles = {
    running: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
    hibernating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    provisioning: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    error: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  };

  return (
    <Badge variant="outline" className={`${styles[status] || styles.error} capitalize`}>
      {status}
    </Badge>
  );
};

const CheckpointsModal: React.FC<{ sprite: Sprite }> = ({ sprite }) => {
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
        setOpen(false); // Close modal on restore as status might change
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
        <Button variant="ghost" size="icon" title="Checkpoints">
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
