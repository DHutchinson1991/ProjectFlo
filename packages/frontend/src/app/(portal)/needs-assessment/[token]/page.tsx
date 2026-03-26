'use client';

import { PublicNeedsAssessmentScreen } from '@/features/workflow/inquiry-wizard/screens/PublicNeedsAssessmentScreen';

export default function NeedsAssessmentPage({ params }: { params: { token: string } }) {
    return <PublicNeedsAssessmentScreen token={params.token} />;
}
