import React from 'react';
import { Sprite } from '@/lib/electron';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { formatTimeAgo } from './utils';
import { SandboxActions } from './SandboxActions';
import { CheckpointsModal } from './CheckpointsModal';
import { ResourceLimits } from './ResourceLimits';

interface SandboxCardProps {
  sprite: Sprite;
  onDelete: () => void;
  onPower: () => void;
}

export const SandboxCard: React.FC<SandboxCardProps> = React.memo(
  ({ sprite, onDelete, onPower }) => {
    return (
      <Card className="flex flex-col hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">{sprite.name}</CardTitle>
          <StatusBadge status={sprite.status} />
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Metadata Section */}
          <div className="text-xs text-muted-foreground space-y-1">
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

          {/* Resource Limits Display */}
          <ResourceLimits sprite={sprite} />
        </CardContent>

        <CardFooter className="flex justify-between gap-2 pt-2 border-t bg-muted/20">
          <div className="flex gap-1">
            <SandboxActions sprite={sprite} onPower={onPower} />
            <CheckpointsModal sprite={sprite} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            title="Destroy"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardFooter>
      </Card>
    );
  }
);

SandboxCard.displayName = 'SandboxCard';

const StatusBadge: React.FC<{ status: Sprite['status'] }> = ({ status }) => {
  const styles = {
    running: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
    hibernating: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    provisioning: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    error: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20',
  };

  const icons = {
    running: '●',
    hibernating: '◐',
    provisioning: '◔',
    error: '✕',
  };

  return (
    <Badge variant="outline" className={`${styles[status] || styles.error} capitalize`}>
      <span className="mr-1">{icons[status] || icons.error}</span>
      {status}
    </Badge>
  );
};
