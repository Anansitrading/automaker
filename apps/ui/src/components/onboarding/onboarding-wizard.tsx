import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Play, Plus, RefreshCw } from 'lucide-react';
import { getElectronAPI, Sprite } from '@/lib/electron';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface OnboardingManifest {
  claudeCodeInstalled: boolean;
  mcpServers: Array<{
    name: string;
    transport: 'stdio' | 'http' | 'sse';
    command?: string;
    args?: string[];
    url?: string;
    scope: 'user' | 'project';
    env?: Record<string, string>;
  }>;
  skillsRepos: string[];
  systemPrompt: string;
}

interface Step {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
}

const INITIAL_STEPS: Step[] = [
  { id: 1, name: 'Check Claude Code availability', status: 'pending' },
  { id: 2, name: 'Configure OAuth credentials', status: 'pending' },
  { id: 3, name: 'Install OpenTelemetry SDK', status: 'pending' },
  { id: 4, name: 'Install MCP servers', status: 'pending' },
  { id: 5, name: 'Install skills repositories', status: 'pending' },
  { id: 6, name: 'Setup git config + auth', status: 'pending' },
  { id: 7, name: 'Clone main repository', status: 'pending' },
  { id: 8, name: 'Create git worktree', status: 'pending' },
  { id: 9, name: 'Install dependencies', status: 'pending' },
  { id: 10, name: 'Create CLAUDE.md system prompt', status: 'pending' },
  { id: 11, name: 'Create checkpoint', status: 'pending' },
];

export function OnboardingWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'config' | 'progress'>('config');
  const [spriteId, setSpriteId] = useState('');
  const [sprites, setSprites] = useState<Sprite[]>([]);
  const [isLoadingSprites, setIsLoadingSprites] = useState(false);
  const [isCreatingSprite, setIsCreatingSprite] = useState(false);
  const [newSpriteName, setNewSpriteName] = useState('');
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch sprites on mount
  useEffect(() => {
    if (open) {
      loadSprites();
    }
  }, [open]);

  const loadSprites = async () => {
    setIsLoadingSprites(true);
    try {
      const api = getElectronAPI();
      if (api.sprites) {
        const result = await api.sprites.list();
        if (result.success && result.sprites) {
          setSprites(result.sprites);
        }
      }
    } catch (error) {
      console.error('Failed to load sprites:', error);
    } finally {
      setIsLoadingSprites(false);
    }
  };

  const handleCreateSprite = async () => {
    if (!newSpriteName) return;
    setIsProcessing(true);
    try {
      const api = getElectronAPI();
      if (!api.sprites) throw new Error('Sprites API not available');

      const result = await api.sprites.create({ name: newSpriteName });
      if (result.success && result.sprite) {
        setSprites((prev) => [...prev, result.sprite!]);
        setSpriteId(result.sprite.id);
        setIsCreatingSprite(false);
        setNewSpriteName('');
        toast.success('Sprite created successfully');
      } else {
        throw new Error(result.error || 'Failed to create sprite');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Form State
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI coding agent.');
  const [claudeInstalled, setClaudeInstalled] = useState(true);
  const [skillsRepos, setSkillsRepos] = useState<string>('');

  const handleStartOnboarding = async () => {
    if (!spriteId) {
      toast.error('Please enter a Sprite ID (temporary)');
      return;
    }

    setIsProcessing(true);
    setActiveTab('progress');
    setSteps(INITIAL_STEPS);

    const manifest: OnboardingManifest = {
      claudeCodeInstalled: claudeInstalled,
      mcpServers: [],
      skillsRepos: skillsRepos
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      systemPrompt,
    };

    try {
      const api = getElectronAPI();
      if (!api?.onboarding) {
        throw new Error('Onboarding API not available');
      }

      const result = await api.onboarding.start(spriteId, manifest);

      if (!result.success) {
        throw new Error(result.error || 'Failed to start onboarding');
      }

      toast.success('Onboarding started');
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
      setActiveTab('config');
    }
  };

  // Subscribe to events
  useEffect(() => {
    const api = getElectronAPI();
    if (!api?.onboarding) return;

    const unsubscribe = api.onboarding.onEvent((event: { type: string; payload: unknown }) => {
      if (event.type === 'onboarding:step') {
        const payload = event.payload as {
          id: number;
          name: string;
          status: 'running' | 'completed' | 'failed';
          error?: string;
        };
        setSteps((prev) =>
          prev.map((step) =>
            step.id === payload.id
              ? { ...step, status: payload.status, error: payload.error }
              : step
          )
        );
      } else if (event.type === 'onboarding:completed') {
        setIsProcessing(false);
        toast.success('Onboarding completed successfully!');
      } else if (event.type === 'onboarding:failed') {
        setIsProcessing(false);
        toast.error('Onboarding failed. Check the logs.');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sprite Onboarding Wizard</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target Sprite</Label>
                {!isCreatingSprite ? (
                  <div className="flex gap-2">
                    <Select value={spriteId} onValueChange={setSpriteId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a sprite..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sprites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({s.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreatingSprite(true)}
                      title="Create new sprite"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={loadSprites}
                      disabled={isLoadingSprites}
                      title="Refresh sprites"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingSprites ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={newSpriteName}
                      onChange={(e) => setNewSpriteName(e.target.value)}
                      placeholder="Enter new sprite name"
                      className="flex-1"
                    />
                    <Button onClick={handleCreateSprite} disabled={!newSpriteName || isProcessing}>
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingSprite(false)}
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">ID:</span> {spriteId || 'None selected'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Skills Repositories (comma separated)</Label>
                <Input
                  value={skillsRepos}
                  onChange={(e) => setSkillsRepos(e.target.value)}
                  placeholder="https://github.com/a/b.git, ..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="claude"
                  checked={claudeInstalled}
                  onCheckedChange={(c) => setClaudeInstalled(!!c)}
                />
                <Label htmlFor="claude">Claude Code Installed</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3 p-2 rounded border bg-card">
                    <div className="w-6 flex justify-center">
                      {step.status === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      )}
                      {step.status === 'running' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {step.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {step.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <span
                        className={`text-sm ${step.status === 'pending' ? 'text-muted-foreground' : 'font-medium'}`}
                      >
                        {step.name}
                      </span>
                      {step.error && <p className="text-xs text-red-500 mt-1">{step.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {activeTab === 'config' ? (
            <Button onClick={handleStartOnboarding} disabled={isProcessing}>
              <Play className="w-4 h-4 mr-2" />
              Start Onboarding
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActiveTab('config')}
              disabled={isProcessing}
            >
              Back
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
