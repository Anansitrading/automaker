import { createFileRoute } from '@tanstack/react-router';
import { SandboxDashboard } from '@/components/sandbox/SandboxDashboard';

export const Route = createFileRoute('/sandboxes')({
  component: SandboxDashboard,
});
