import React from 'react';
import { Sprite } from '@/lib/electron';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Moon, Sun, RotateCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SandboxActionsProps {
  sprite: Sprite;
  onPower?: () => void;
  onHibernate?: () => void;
  onWake?: () => void;
  onShutdown?: () => void;
  onDelete?: () => void;
}

export const SandboxActions: React.FC<SandboxActionsProps> = ({
  sprite,
  onPower,
  onHibernate,
  onWake,
  onShutdown,
  onDelete,
}) => {
  const isRunning = sprite.status === 'running';
  const isHibernated = sprite.status === 'warm' || sprite.status === 'cold';
  const isProvisioning = sprite.status === 'provisioning';
  const isError = sprite.status === 'error';

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {/* Play/Wake Action */}
        {(isHibernated || sprite.status === 'shutdown' || isError) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={isHibernated ? onWake : onPower}
                className="h-8 w-8"
                disabled={isProvisioning}
              >
                <Play className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHibernated ? 'Wake' : 'Start'}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Hibernate Action */}
        {isRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onHibernate} className="h-8 w-8">
                <Moon className="h-4 w-4 text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hibernate</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Stop/Shutdown Action */}
        {(isRunning || isHibernated) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onShutdown} className="h-8 w-8">
                <Square className="h-4 w-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Shut Down</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Delete Action (only if not running) */}
        {!isRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Sandbox</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
