
'use client';

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UpgradeTooltipProps {
  featureName: string;
  isAllowed: boolean;
  requiredPlan: string;
  button: React.ReactNode;
}

export function UpgradeTooltip({
  featureName,
  isAllowed,
  requiredPlan,
  button,
}: UpgradeTooltipProps) {
  if (isAllowed) {
    return <>{button}</>;
  }

  // Find the actual button child to apply the disabled prop
  const triggerButton = React.Children.map(button, (child) => {
    if (React.isValidElement(child) && child.type === Button) {
      return React.cloneElement(child as React.ReactElement<any>, {
        disabled: true,
      });
    }
    return child;
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* The button is wrapped in a div so the tooltip works even when disabled */}
          <div className="inline-block cursor-not-allowed">
            {triggerButton}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="p-2 text-center">
            <p>
              Upgrade to the <span className="font-semibold">{requiredPlan}</span> plan to use{' '}
              {featureName}.
            </p>
            <Button size="sm" asChild className="mt-2">
              <Link href="/dashboard/settings">Upgrade Plan</Link>
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
