import React, { useState } from 'react';
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
import { SandboxCard } from './SandboxCard';
import { useSandboxes, useCreateSandbox, useSandboxOperations } from '@/hooks/useSandbox';

export const SandboxDashboard: React.FC = () => {
  const [newSpriteName, setNewSpriteName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: sprites = [], isLoading, refetch } = useSandboxes();
  const { mutate: createSandbox, isPending: creating } = useCreateSandbox();
  const { deleteSandbox, shutdownSandbox, wakeSandbox } = useSandboxOperations();

  const handleCreate = () => {
    if (!newSpriteName.trim()) return;
    createSandbox(
      { name: newSpriteName },
      {
        onSuccess: () => {
          setNewSpriteName('');
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleDelete = (name: string) => {
    if (!confirm(`Are you sure you want to destroy '${name}'?`)) return;
    deleteSandbox.mutate(name);
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sandbox Environment</h1>
          <p className="text-muted-foreground">Manage your isolated Sprite sandboxes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

      {isLoading ? (
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
              onPower={() => wakeSandbox.mutate(sprite.name)}
              onHibernate={() => shutdownSandbox.mutate(sprite.name)} // Using shutdown for hibernate for now
              onWake={() => wakeSandbox.mutate(sprite.name)}
              onShutdown={() => shutdownSandbox.mutate(sprite.name)}
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
