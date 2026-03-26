import { FloorPlanEditorScreen } from '@/features/workflow/locations/screens';

interface PageProps { params: { id: string; floorPlanId: string }; }

export default function FloorPlanPage({ params }: PageProps) {
    return <FloorPlanEditorScreen locationId={Number(params.id)} floorPlanId={Number(params.floorPlanId)} />;
}
