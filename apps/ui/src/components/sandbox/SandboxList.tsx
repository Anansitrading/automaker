import React from 'react';
import { useSandboxes, useSandboxOperations } from '@/hooks/useSandbox';
import { SandboxCard } from './SandboxCard';
import { Card } from '@/components/ui/card';
import { Loader2, Server } from 'lucide-react';

export const SandboxList: React.FC = () => {
  const { data: sprites, isLoading, error } = useSandboxes();
  const { deleteSandbox, shutdownSandbox, wakeSandbox } = useSandboxOperations();

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading sandboxes...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 max-w-md">
          <div className="flex flex-col items-center gap-3 text-center">
            <Server className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Sandboxes</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Empty State
  if (!sprites || sprites.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <Server className="h-16 w-16 text-muted-foreground/50" />
            <div>
              <h3 className="font-semibold text-xl">No Sandboxes Yet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get started by creating your first sandbox environment.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Sandbox Grid
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sprites.map((sprite) => (
          <SandboxCard
            key={sprite.id}
            sprite={sprite}
            onDelete={() => deleteSandbox.mutate(sprite.name)}
            onPower={() => {
              // Power toggle logic
              if (sprite.status === 'running') {
                shutdownSandbox.mutate(sprite.name);
              } else {
                wakeSandbox.mutate(sprite.name);
              }
            }}
            onHibernate={() => shutdownSandbox.mutate(sprite.name)}
            onWake={() => wakeSandbox.mutate(sprite.name)}
            onShutdown={() => shutdownSandbox.mutate(sprite.name)}
          />
        ))}
      </div>
    </div>
  );
};
