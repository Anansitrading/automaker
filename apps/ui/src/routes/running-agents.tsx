import { createFileRoute } from '@tanstack/react-router';
import { RunningAgentsView } from '@/components/views/running-agents-view';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { useState } from 'react';

export const Route = createFileRoute('/running-agents')({
  component: RunningAgentsPage,
});

function RunningAgentsPage() {
  const [showWizard, setShowWizard] = useState(false);
  return (
    <>
      <RunningAgentsView onNewSprite={() => setShowWizard(true)} />
      <OnboardingWizard open={showWizard} onOpenChange={setShowWizard} />
    </>
  );
}
