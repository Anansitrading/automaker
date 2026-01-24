import React, { useEffect, useState } from 'react';
import { Sprite } from '@/lib/electron';
import { getHttpApiClient } from '@/lib/http-api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SandboxCard } from './SandboxCard';

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
    try {
      const res = await client.sprites.wake(sprite.name);
      if (res.success) {
        toast.success(`Sandbox wake initiated`);
        fetchSprites();
      } else {
        toast.error(res.error || `Failed to wake sandbox`);
      }
    } catch (error) {
      toast.error(`Failed to wake sandbox`);
    }
  };

  const handleHibernate = async (sprite: Sprite) => {
    try {
      const res = await client.sprites.shutdown(sprite.name); // Shutdown is used for hibernation
      if (res.success) {
        toast.success(`Sandbox hibernation initiated`);
        fetchSprites();
      } else {
        toast.error(res.error || `Failed to hibernate sandbox`);
      }
    } catch (error) {
      toast.error(`Failed to hibernate sandbox`);
    }
  };

  const handleShutdown = async (sprite: Sprite) => {
    try {
      const res = await client.sprites.shutdown(sprite.name);
      if (res.success) {
        toast.success(`Sandbox shutdown initiated`);
        fetchSprites();
      } else {
        toast.error(res.error || `Failed to shutdown sandbox`);
      }
    } catch (error) {
      toast.error(`Failed to shutdown sandbox`);
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
            <SandboxCard
              key={sprite.id}
              sprite={sprite}
              onDelete={() => handleDelete(sprite.name)}
              onPower={() => handlePower(sprite)}
              onHibernate={() => handleHibernate(sprite)}
              onWake={() => handlePower(sprite)} // Wake is same as power/start for now
              onShutdown={() => handleShutdown(sprite)}
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
