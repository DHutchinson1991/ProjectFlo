'use client';

import { PaymentsPortalScreen } from '@/features/workflow/proposals/screens/PaymentsPortalScreen';

export default function PaymentsPage({ params }: { params: { token: string } }) {
    return <PaymentsPortalScreen token={params.token} />;
}
