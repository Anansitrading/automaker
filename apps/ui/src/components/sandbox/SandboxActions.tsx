import React from 'react';
import { Sprite } from '@/lib/electron';
import { Button } from '@/components/ui/button';
import { Play, Square, Trash2, Moon, Sun } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SandboxActionsProps {
  sprite: Sprite;
  onPower: () => void;
}

export const SandboxActions: React.FC<SandboxActionsProps> = ({ sprite, onPower }) => {
  const isRunning = sprite.status === 'running';
  const isHibernating = sprite.status === 'hibernating';

  return (
    <TooltipProvider>
      <div className="flex gap-1">
        {/* Power Control */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onPower} className="h-8 w-8">
              {isRunning ? (
                <Square className="h-4 w-4 text-red-500" />
              ) : (
                <Play className="h-4 w-4 text-green-500" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRunning ? 'Shutdown' : 'Wake'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Hibernate/Wake (if applicable) */}
        {isHibernating && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onPower} className="h-8 w-8">
                <Sun className="h-4 w-4 text-orange-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Wake from hibernation</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
