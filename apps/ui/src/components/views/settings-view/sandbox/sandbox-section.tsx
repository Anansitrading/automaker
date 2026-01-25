import { useAppStore } from '@/store/app-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SandboxSettingsSection() {
  const { sandboxSettings, setSandboxSettings } = useAppStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Sandbox Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure the isolated runtime environment for executing code and running agents.
        </p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>
              Global controls for sandbox availability and behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Sandbox</Label>
                <div className="text-sm text-muted-foreground">
                  Allow the application to create and manage isolated environments.
                </div>
              </div>
              <Switch
                checked={sandboxSettings.enabled}
                onCheckedChange={(checked) => setSandboxSettings({ enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label>Auto-Hibernate Timeout</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[300px]">
                          Time in minutes before an inactive sandbox is automatically stopped to
                          save resources. Set to 0 to disable auto-hibernate.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-sm text-muted-foreground">
                  Automatically stop inactive sandboxes after a period of time.
                </div>
              </div>
              <div className="w-[180px]">
                <Input
                  type="number"
                  min={0}
                  value={sandboxSettings.autoHibernateTimeout}
                  onChange={(e) =>
                    setSandboxSettings({ autoHibernateTimeout: parseInt(e.target.value) || 0 })
                  }
                />
                <span className="text-xs text-muted-foreground mt-1 block text-right">
                  {sandboxSettings.autoHibernateTimeout === 0 ? 'Disabled' : 'Minutes'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resource Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Limits</CardTitle>
            <CardDescription>Set default resource constraints for new sandboxes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>CPU Cores</Label>
                <Select
                  value={String(sandboxSettings.resourceLimits.cpu)}
                  onValueChange={(value) =>
                    setSandboxSettings({
                      resourceLimits: {
                        ...sandboxSettings.resourceLimits,
                        cpu: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CPU cores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Core</SelectItem>
                    <SelectItem value="2">2 Cores</SelectItem>
                    <SelectItem value="4">4 Cores</SelectItem>
                    <SelectItem value="8">8 Cores</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maximum CPU cores allocated to a single sandbox instance.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Memory (RAM)</Label>
                <Select
                  value={String(sandboxSettings.resourceLimits.memory)}
                  onValueChange={(value) =>
                    setSandboxSettings({
                      resourceLimits: {
                        ...sandboxSettings.resourceLimits,
                        memory: parseInt(value),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select memory limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512 MB</SelectItem>
                    <SelectItem value="1024">1 GB</SelectItem>
                    <SelectItem value="2048">2 GB</SelectItem>
                    <SelectItem value="4096">4 GB</SelectItem>
                    <SelectItem value="8192">8 GB</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maximum memory allocated to a single sandbox instance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Contexts */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Contexts</CardTitle>
            <CardDescription>
              Control where and how sandboxes are used within the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Use in Auto Mode</Label>
                <div className="text-sm text-muted-foreground">
                  Allow automated workflows to spin up sandboxes for task execution.
                </div>
              </div>
              <Switch
                checked={sandboxSettings.useInAutoMode}
                onCheckedChange={(checked) => setSandboxSettings({ useInAutoMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Use for Agents</Label>
                <div className="text-sm text-muted-foreground">
                  Allow conversational agents to execute code within sandboxes.
                </div>
              </div>
              <Switch
                checked={sandboxSettings.useForAgents}
                onCheckedChange={(checked) => setSandboxSettings({ useForAgents: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
