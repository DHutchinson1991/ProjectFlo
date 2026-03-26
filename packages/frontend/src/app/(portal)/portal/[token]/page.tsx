'use client';

import { ClientPortalScreen } from '@/features/workflow/proposals/screens/ClientPortalScreen';

export default function ClientPortalPage({ params }: { params: { token: string } }) {
    return <ClientPortalScreen token={params.token} />;
}
