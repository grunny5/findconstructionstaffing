'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink, Shield } from 'lucide-react';
import { SendMessageButton } from '@/components/messages/SendMessageButton';

interface AgencyActionsProps {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  isClaimed: boolean;
  website: string | null;
}

export function AgencyActions({
  agencyId,
  agencyName,
  agencySlug,
  isClaimed,
  website,
}: AgencyActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" className="min-w-[200px]" asChild>
        <Link href={`/contact/${agencySlug}`}>Request Workers</Link>
      </Button>
      {website && (
        <Button variant="outline" size="lg" asChild>
          <a href={website} target="_blank" rel="noopener noreferrer">
            Visit Website
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      )}
      <SendMessageButton
        agencyId={agencyId}
        agencyName={agencyName}
        agencySlug={agencySlug}
        isClaimed={isClaimed}
      />
      {!isClaimed && (
        <Button
          variant="outline"
          size="lg"
          asChild
          className="min-w-[200px]"
        >
          <Link href={`/claim/${agencySlug}`}>
            <Shield className="mr-2 h-4 w-4" />
            Claim This Agency
          </Link>
        </Button>
      )}
    </div>
  );
}
