import React from 'react';
import { Sprite } from '@/lib/electron';
import { Progress } from '@/components/ui/progress';
import { Cpu, HardDrive, MemoryStick } from 'lucide-react';

interface ResourceLimitsProps {
  sprite: Sprite;
}

export const ResourceLimits: React.FC<ResourceLimitsProps> = ({ sprite }) => {
  // Mock resource data - in production, this would come from sprite telemetry
  const resources = {
    cpu: sprite.status === 'running' ? 45 : 0,
    memory: sprite.status === 'running' ? 60 : 0,
    storage: 30,
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="text-xs font-medium text-muted-foreground mb-2">Resources</div>

      {/* CPU Usage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-blue-500" />
            <span>CPU</span>
          </div>
          <span className="font-mono">{resources.cpu}%</span>
        </div>
        <Progress value={resources.cpu} className="h-1.5" />
      </div>

      {/* Memory Usage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <MemoryStick className="h-3 w-3 text-purple-500" />
            <span>Memory</span>
          </div>
          <span className="font-mono">{resources.memory}%</span>
        </div>
        <Progress value={resources.memory} className="h-1.5" />
      </div>

      {/* Storage Usage */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-3 w-3 text-amber-500" />
            <span>Storage</span>
          </div>
          <span className="font-mono">{resources.storage}%</span>
        </div>
        <Progress value={resources.storage} className="h-1.5" />
      </div>
    </div>
  );
};
