import { SpaceDetailScreen } from '@/features/workflow/locations/screens';

interface PageProps { params: { id: string; spaceId: string }; }

export default function SpacePage({ params }: PageProps) {
    return <SpaceDetailScreen locationId={Number(params.id)} spaceId={Number(params.spaceId)} />;
}
