import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getElectronAPI } from '@/lib/electron';
import type { Sprite, SpriteConfig, Checkpoint } from '@/lib/electron';
import { toast } from 'sonner';

const getApi = () => {
  const api = getElectronAPI();
  if (!api?.sprites) {
    throw new Error('Sprites API is not available');
  }
  return api.sprites;
};

/**
 * Hook to list all active sandboxes (sprites)
 */
export function useSandboxes() {
  return useQuery({
    queryKey: ['sprites'],
    queryFn: async () => {
      const result = await getApi().list();
      if (!result.success) throw new Error(result.error || 'Failed to list sandboxes');
      return result.sprites || [];
    },
  });
}

/**
 * Hook to create a new sandbox
 */
export function useCreateSandbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: SpriteConfig) => {
      const result = await getApi().create(config);
      if (!result.success) throw new Error(result.error || 'Failed to create sandbox');
      return result.sprite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprites'] });
      toast.success('Sandbox created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create sandbox: ${error.message}`);
    },
  });
}

/**
 * Hook to list checkpoints for a specific sandbox
 */
export function useCheckpoints(name: string, enabled = true) {
  return useQuery({
    queryKey: ['sprites', name, 'checkpoints'],
    queryFn: async () => {
      const result = await getApi().listCheckpoints(name);
      if (!result.success) throw new Error(result.error || 'Failed to list checkpoints');
      return result.checkpoints || [];
    },
    enabled: !!name && enabled,
  });
}

/**
 * Hook to get the console URL for a sandbox
 */
export function useSandboxConsole(name: string) {
  return useQuery({
    queryKey: ['sprites', name, 'console'],
    queryFn: async () => {
      const result = await getApi().getConsoleUrl(name);
      if (!result.success) throw new Error(result.error || 'Failed to get console URL');
      return result.url;
    },
    enabled: !!name,
    staleTime: 0, // Always fetch fresh URL
  });
}

/**
 * Hook to manage sandbox operations (delete, power, etc.)
 */
export function useSandboxOperations() {
  const queryClient = useQueryClient();

  const deleteSandbox = useMutation({
    mutationFn: async (name: string) => {
      const result = await getApi().delete(name);
      if (!result.success) throw new Error(result.error || 'Failed to delete sandbox');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprites'] });
      toast.success('Sandbox deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const shutdownSandbox = useMutation({
    mutationFn: async (name: string) => {
      const result = await getApi().shutdown(name);
      if (!result.success) throw new Error(result.error || 'Failed to shutdown sandbox');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprites'] });
      toast.success('Sandbox shutting down');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const wakeSandbox = useMutation({
    mutationFn: async (name: string) => {
      const result = await getApi().wake(name);
      if (!result.success) throw new Error(result.error || 'Failed to wake sandbox');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprites'] });
      toast.success('Sandbox starting');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    deleteSandbox,
    shutdownSandbox,
    wakeSandbox,
  };
}

/**
 * Hook to manage checkpoint operations (create, restore)
 */
export function useCheckpointOperations() {
  const queryClient = useQueryClient();

  const createCheckpoint = useMutation({
    mutationFn: async ({ name, checkpointName }: { name: string; checkpointName?: string }) => {
      const result = await getApi().createCheckpoint(name, checkpointName);
      if (!result.success) throw new Error(result.error || 'Failed to create checkpoint');
      return result.checkpoint;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sprites', variables.name, 'checkpoints'] });
      toast.success('Checkpoint created');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const restoreCheckpoint = useMutation({
    mutationFn: async ({ name, checkpointId }: { name: string; checkpointId: string }) => {
      const result = await getApi().restoreCheckpoint(name, checkpointId);
      if (!result.success) throw new Error(result.error || 'Failed to restore checkpoint');
    },
    onSuccess: (_, variables) => {
      // Invalidate both checkpoints (maybe status changed?) and sprite list (status might be provisioning/running)
      queryClient.invalidateQueries({ queryKey: ['sprites'] });
      queryClient.invalidateQueries({ queryKey: ['sprites', variables.name, 'checkpoints'] });
      toast.success('Checkpoint restored');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    createCheckpoint,
    restoreCheckpoint,
  };
}
